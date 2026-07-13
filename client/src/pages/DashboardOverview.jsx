import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { 
  FaThLarge, 
  FaUsers, 
  FaExclamationTriangle, 
  FaHeart,
  FaFileMedical,
  FaPlusCircle,
  FaRegHeart,
} from 'react-icons/fa';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar, Line, Scatter } from 'react-chartjs-2';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DashboardOverview = () => {
  const { darkMode } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setData(res.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError('Failed to fetch dashboard metrics. Verify database connections.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl lg:col-span-1 animate-pulse"></div>
          <div className="h-80 bg-slate-200 dark:bg-slate-800 rounded-2xl lg:col-span-2 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-center">
        <h3 className="font-display font-bold text-red-600 dark:text-red-400 text-lg">Metrics Offline</h3>
        <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">{error}</p>
        <Link to="/dashboard/predict" className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-medical-500 hover:bg-medical-600 text-white font-semibold text-sm transition">
          <FaPlusCircle className="h-4 w-4" /> Start New Prediction
        </Link>
      </div>
    );
  }

  const { cards, charts } = data;
  const { totalPredictions } = cards;

  const chartThemeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: darkMode ? '#cbd5e1' : '#334155',
          font: { family: 'Inter', weight: '500' }
        }
      }
    },
    scales: {
      x: {
        grid: { color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: darkMode ? '#94a3b8' : '#64748b' }
      },
      y: {
        grid: { color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: darkMode ? '#94a3b8' : '#64748b' }
      }
    }
  };

  const pieData = {
    labels: charts.pie.labels,
    datasets: [{
      data: charts.pie.data,
      backgroundColor: ['#10b981', '#ef4444'],
      borderWidth: darkMode ? 1 : 2,
      borderColor: darkMode ? '#1e293b' : '#ffffff'
    }]
  };

  const barData = {
    labels: charts.bar.labels,
    datasets: [
      {
        label: 'Healthy',
        data: charts.bar.healthy,
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        borderRadius: 6
      },
      {
        label: 'High Risk',
        data: charts.bar.highRisk,
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        borderRadius: 6
      }
    ]
  };

  const lineData = {
    labels: charts.line.labels,
    datasets: [
      {
        label: 'Total Predictions',
        data: charts.line.total,
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.1)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#0284c7'
      }
    ]
  };

  // BP vs Cholesterol Scatter Dataset
  const scatterData = {
    datasets: [
      {
        label: 'Healthy Group',
        data: (charts.scatter || []).filter(p => p.result !== 'High Risk').map(p => ({ x: p.x, y: p.y })),
        backgroundColor: 'rgba(16, 185, 129, 0.85)',
        pointRadius: 6,
        pointHoverRadius: 8
      },
      {
        label: 'High Risk Group',
        data: (charts.scatter || []).filter(p => p.result === 'High Risk').map(p => ({ x: p.x, y: p.y })),
        backgroundColor: 'rgba(239, 68, 68, 0.85)',
        pointRadius: 6,
        pointHoverRadius: 8
      }
    ]
  };

  const scatterOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: darkMode ? '#cbd5e1' : '#334155',
          font: { family: 'Inter', weight: '500' }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const index = context.dataIndex;
            const datasetIndex = context.datasetIndex;
            const points = (charts.scatter || []).filter(p => 
              datasetIndex === 0 ? p.result !== 'High Risk' : p.result === 'High Risk'
            );
            const pt = points[index];
            return `${pt ? pt.name : 'Patient'}: BP ${context.parsed.x} mmHg, Cholesterol ${context.parsed.y} mg/dl`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Resting Blood Pressure (mmHg)',
          color: darkMode ? '#cbd5e1' : '#475569',
          font: { family: 'Inter', size: 10, weight: '600' }
        },
        grid: { color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: darkMode ? '#94a3b8' : '#64748b' }
      },
      y: {
        title: {
          display: true,
          text: 'Serum Cholesterol (mg/dl)',
          color: darkMode ? '#cbd5e1' : '#475569',
          font: { family: 'Inter', size: 10, weight: '600' }
        },
        grid: { color: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: darkMode ? '#94a3b8' : '#64748b' }
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">
            Cardiology Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Diagnostic summaries, patient risk groupings, and monthly prediction loads.
          </p>
        </div>

        <Link
          to="/dashboard/predict"
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-medical-600 to-sky-500 text-white font-bold text-sm shadow-md hover:scale-102 transition flex items-center justify-center gap-2"
        >
          <FaPlusCircle className="h-4 w-4" />
          Run Risk Assessment
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Total Predictions */}
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800 flex items-center gap-5"
        >
          <div className="h-12 w-12 rounded-xl bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400 flex items-center justify-center flex-shrink-0">
            <FaFileMedical className="h-6 w-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{cards.totalPredictions}</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">Total Predictions</p>
          </div>
        </motion.div>

        {/* Total Patients */}
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800 flex items-center gap-5"
        >
          <div className="h-12 w-12 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400 flex items-center justify-center flex-shrink-0">
            <FaUsers className="h-6 w-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{cards.totalPatients}</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">Total Patients</p>
          </div>
        </motion.div>

        {/* High Risk Cases */}
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800 flex items-center gap-5"
        >
          <div className="h-12 w-12 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 flex items-center justify-center flex-shrink-0">
            <FaExclamationTriangle className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{cards.highRiskCount}</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">High Risk Cases</p>
          </div>
        </motion.div>

        {/* Healthy Patients */}
        <motion.div
          whileHover={{ y: -4 }}
          className="glass-card rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800 flex items-center gap-5"
        >
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <FaHeart className="h-6 w-6" />
          </div>
          <div>
            <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">{cards.healthyCount}</span>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mt-0.5">Healthy Group</p>
          </div>
        </motion.div>

      </div>

      {/* Charts Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pie Chart Panel */}
        <div className="glass-card rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800 lg:col-span-1">
          <h3 className="font-display font-bold text-md text-slate-800 dark:text-slate-200 mb-4">Risk Distribution</h3>
          <div className="h-64 relative flex items-center justify-center">
            {totalPredictions > 0 ? (
              <Pie data={pieData} options={{ 
                responsive: true, 
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      color: darkMode ? '#cbd5e1' : '#334155',
                      font: { family: 'Inter', size: 11, weight: '500' }
                    }
                  }
                }
              }} />
            ) : (
              <div className="text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
                <FaRegHeart className="h-8 w-8 text-slate-300" />
                No prediction data logged.
              </div>
            )}
          </div>
        </div>

        {/* Bar Chart Panel */}
        <div className="glass-card rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800 lg:col-span-2">
          <h3 className="font-display font-bold text-md text-slate-800 dark:text-slate-200 mb-4">Age Profile Analysis</h3>
          <div className="h-64 relative">
            {totalPredictions > 0 ? (
              <Bar data={barData} options={chartThemeOptions} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                No patient distributions to show.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Timeline & Scatter Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Timeline Chart */}
        <div className="glass-card rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800">
          <h3 className="font-display font-bold text-md text-slate-800 dark:text-slate-200 mb-4">Prediction Frequency Timeline</h3>
          <div className="h-80 relative">
            {totalPredictions > 0 ? (
              <Line data={lineData} options={chartThemeOptions} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                Waiting for prediction timelines...
              </div>
            )}
          </div>
        </div>

        {/* BP vs Cholesterol Scatter Chart */}
        <div className="glass-card rounded-2xl p-6 shadow-md border border-slate-100 dark:border-slate-800">
          <h3 className="font-display font-bold text-md text-slate-800 dark:text-slate-200 mb-4">BP vs. Cholesterol Correlation</h3>
          <div className="h-80 relative">
            {totalPredictions > 0 ? (
              <Scatter data={scatterData} options={scatterOptions} />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                Waiting for correlation metrics...
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardOverview;
