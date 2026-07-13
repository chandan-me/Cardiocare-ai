const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  const userId = req.user.id;
  const role = req.user.role;

  try {
    let sql = 'SELECT id, patient_name, age, result, trestbps, chol, created_at FROM predictions';
    let params = [];

    // If not admin, restrict stats to their own patients
    if (role !== 'admin') {
      sql += ' WHERE user_id = ?';
      params.push(userId);
    }

    const records = await db.query(sql, params);

    // Calculate metrics
    const totalPredictions = records.length;
    
    // Total unique patients
    const uniquePatients = new Set(records.map(r => r.patient_name.trim().toLowerCase())).size;

    let highRiskCount = 0;
    let healthyCount = 0;

    // Age distribution buckets
    // <40, 40-49, 50-59, 60+
    const ageBuckets = {
      under40: { healthy: 0, highRisk: 0 },
      age40to49: { healthy: 0, highRisk: 0 },
      age50to59: { healthy: 0, highRisk: 0 },
      above60: { healthy: 0, highRisk: 0 }
    };

    // Monthly trends bucket
    // Format: "YYYY-MM" -> { healthy: count, highRisk: count }
    const monthlyTrends = {};

    records.forEach(r => {
      const isHighRisk = r.result === 'High Risk';
      if (isHighRisk) {
        highRiskCount++;
      } else {
        healthyCount++;
      }

      // Age grouping
      if (r.age < 40) {
        if (isHighRisk) ageBuckets.under40.highRisk++;
        else ageBuckets.under40.healthy++;
      } else if (r.age >= 40 && r.age < 50) {
        if (isHighRisk) ageBuckets.age40to49.highRisk++;
        else ageBuckets.age40to49.healthy++;
      } else if (r.age >= 50 && r.age < 60) {
        if (isHighRisk) ageBuckets.age50to59.highRisk++;
        else ageBuckets.age50to59.healthy++;
      } else {
        if (isHighRisk) ageBuckets.above60.highRisk++;
        else ageBuckets.above60.healthy++;
      }

      // Monthly grouping
      const date = new Date(r.created_at);
      const monthYear = date.toLocaleString('default', { month: 'short', year: 'numeric' }); // e.g. "Jul 2026"
      const sortKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`; // e.g. "2026-07"

      if (!monthlyTrends[sortKey]) {
        monthlyTrends[sortKey] = { label: monthYear, healthy: 0, highRisk: 0, total: 0 };
      }
      if (isHighRisk) {
        monthlyTrends[sortKey].highRisk++;
      } else {
        monthlyTrends[sortKey].healthy++;
      }
      monthlyTrends[sortKey].total++;
    });

    // Format monthly trends for Chart.js sorting chronologically
    const sortedMonthKeys = Object.keys(monthlyTrends).sort();
    const monthlyChartData = sortedMonthKeys.map(key => monthlyTrends[key]);

    res.json({
      cards: {
        totalPredictions,
        totalPatients: uniquePatients,
        highRiskCount,
        healthyCount
      },
      charts: {
        pie: {
          labels: ['Healthy', 'High Risk'],
          data: [healthyCount, highRiskCount]
        },
        bar: {
          labels: ['Under 40', '40 - 49', '50 - 59', '60+'],
          healthy: [
            ageBuckets.under40.healthy,
            ageBuckets.age40to49.healthy,
            ageBuckets.age50to59.healthy,
            ageBuckets.above60.healthy
          ],
          highRisk: [
            ageBuckets.under40.highRisk,
            ageBuckets.age40to49.highRisk,
            ageBuckets.age50to59.highRisk,
            ageBuckets.above60.highRisk
          ]
        },
        line: {
          labels: monthlyChartData.map(m => m.label),
          healthy: monthlyChartData.map(m => m.healthy),
          highRisk: monthlyChartData.map(m => m.highRisk),
          total: monthlyChartData.map(m => m.total)
        },
        scatter: records.map(r => ({
          x: r.trestbps,
          y: r.chol,
          result: r.result,
          name: r.patient_name
        }))
      }
    });

  } catch (err) {
    console.error('Error calculating dashboard stats:', err.message);
    res.status(500).json({ error: 'Server error while calculating statistics' });
  }
};
