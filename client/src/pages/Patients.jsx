import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
  FaUser, 
  FaHeartbeat, 
  FaHistory, 
  FaChevronRight, 
  FaArrowUp, 
  FaArrowDown, 
  FaChartLine, 
  FaFolderOpen,
  FaArrowLeft
} from 'react-icons/fa';
import { Line } from 'react-chartjs-2';

const Patients = () => {
  const [loading, setLoading] = useState(true);
  const [predictions, setPredictions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);
      try {
        const res = await api.get('/predictions', { params: { limit: 10000 } });
        const allLogs = res.data.predictions || [];
        setPredictions(allLogs);

        // Group predictions dynamically by unique patient name
        const groups = {};
        allLogs.forEach(log => {
          const name = log.patient_name;
          if (!groups[name]) {
            groups[name] = {
              name,
              age: log.age,
              gender: log.gender,
              screenings: []
            };
          }
          groups[name].screenings.push(log);
        });

        // Convert groups to sorted list
        const patientList = Object.values(groups).map(p => {
          // Sort screenings chronologically
          p.screenings.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          p.lastScreening = p.screenings[p.screenings.length - 1];
          p.firstScreening = p.screenings[0];
          return p;
        });

        setPatients(patientList);
      } catch (err) {
        console.error('Failed to load patient records:', err);
        Swal.fire('Offline', 'Could not query clinical records from database.', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-1/4 animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-44 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // Render Patient Profile Directory List
  if (!selectedPatient) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">
            Patient Profiles Directory
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View profiles and run progression comparisons across longitudinal screenings.
          </p>
        </div>

        {patients.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {patients.map((pat, idx) => (
              <div 
                key={idx}
                className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 flex flex-col justify-between hover:shadow-md transition shadow-sm space-y-4"
              >
                {/* Profile Header */}
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-tr from-medical-500 to-sky-500 text-white flex items-center justify-center flex-shrink-0 font-bold font-display">
                    {pat.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm">{pat.name}</h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block mt-0.5">
                      {pat.age} yrs / {pat.gender === 1 ? 'Male' : 'Female'}
                    </span>
                  </div>
                </div>

                {/* Screening Counts Info */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100/50 dark:border-slate-800 text-[10px] font-bold text-slate-500">
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wide">Screenings</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{pat.screenings.length} tests</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase tracking-wide">Last Result</span>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] ${
                      pat.lastScreening.result === 'High Risk'
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-455'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-455'
                    }`}>
                      {pat.lastScreening.result}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => setSelectedPatient(pat)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-750 dark:hover:bg-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <FaChartLine className="h-3.5 w-3.5" />
                  View Risk Progression
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-10 border border-slate-150 dark:border-slate-850 text-center space-y-3">
            <FaFolderOpen className="mx-auto h-10 w-10 text-slate-355" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200">No Patient Profiles Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Run a cardiac screening first to initiate a profile.</p>
          </div>
        )}
      </div>
    );
  }

  // Render Progression Comparison Page
  const timelineData = selectedPatient.screenings;

  // Chart configuration for progression
  const chartData = {
    labels: timelineData.map((s, idx) => `Test ${idx + 1} (${new Date(s.created_at).toLocaleDateString()})`),
    datasets: [
      {
        label: 'Cholesterol (mg/dl)',
        data: timelineData.map(s => s.chol),
        borderColor: '#0284c7',
        backgroundColor: 'rgba(2, 132, 199, 0.05)',
        tension: 0.3,
        yAxisID: 'y'
      },
      {
        label: 'Resting Blood Pressure (mmHg)',
        data: timelineData.map(s => s.trestbps),
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236, 72, 153, 0.05)',
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { family: 'Inter', size: 10, weight: '500' } } }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Cholesterol (mg/dl)', font: { size: 9, weight: '600' } }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Blood Pressure (mmHg)', font: { size: 9, weight: '600' } }
      }
    }
  };

  // Helper function to calculate differences between successive screenings
  const renderComparisonValue = (param, index) => {
    const val = timelineData[index][param];
    if (index === 0) return <span>{val}</span>;

    const prevVal = timelineData[index - 1][param];
    const diff = val - prevVal;

    if (diff > 0) {
      return (
        <span className="flex items-center gap-1">
          {val} 
          <span className="text-rose-500 text-[10px] font-bold flex items-center">
            <FaArrowUp className="h-2 w-2" /> (+{diff})
          </span>
        </span>
      );
    } else if (diff < 0) {
      return (
        <span className="flex items-center gap-1">
          {val} 
          <span className="text-emerald-500 text-[10px] font-bold flex items-center">
            <FaArrowDown className="h-2 w-2" /> ({diff})
          </span>
        </span>
      );
    }

    return <span>{val}</span>;
  };

  return (
    <div className="space-y-6">
      
      {/* Return button and headers */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSelectedPatient(null)}
          className="p-2.5 rounded-xl border border-slate-205 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 transition cursor-pointer"
        >
          <FaArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-805 dark:text-slate-100 flex items-center gap-2">
            Progression: {selectedPatient.name}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparative diagnostic charts mapping patient parameters across {timelineData.length} screenings.
          </p>
        </div>
      </div>

      {/* Progression Line Chart */}
      <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 shadow-sm">
        <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-4">Vitals Longitudinal Progression</h3>
        <div className="h-72 relative">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>

      {/* Comparative Grid Table */}
      <div className="glass-card rounded-2xl border border-slate-150 dark:border-slate-850 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-600 dark:text-slate-400">
            <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-150 dark:border-slate-850">
              <tr>
                <th className="px-6 py-4">Diagnostic Variables</th>
                {timelineData.map((s, idx) => (
                  <th key={s.id} className="px-6 py-4">
                    Assessment {idx + 1}
                    <span className="block text-[9px] text-slate-400 font-semibold mt-0.5">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850 font-semibold">
              
              {/* Risk Status */}
              <tr>
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">AI Risk Outcome</td>
                {timelineData.map(s => (
                  <td key={s.id} className="px-6 py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider ${
                      s.result === 'High Risk' 
                        ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20' 
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                    }`}>
                      {s.result}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Confidence */}
              <tr>
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">AI Assessment Confidence</td>
                {timelineData.map(s => (
                  <td key={s.id} className="px-6 py-4 font-bold">
                    {s.confidence}%
                  </td>
                ))}
              </tr>

              {/* Resting BP */}
              <tr>
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">Resting Blood Pressure (mmHg)</td>
                {timelineData.map((s, idx) => (
                  <td key={s.id} className="px-6 py-4">
                    {renderComparisonValue('trestbps', idx)}
                  </td>
                ))}
              </tr>

              {/* Serum Cholesterol */}
              <tr>
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">Serum Cholesterol (mg/dl)</td>
                {timelineData.map((s, idx) => (
                  <td key={s.id} className="px-6 py-4">
                    {renderComparisonValue('chol', idx)}
                  </td>
                ))}
              </tr>

              {/* Max Heart Rate */}
              <tr>
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">Maximum Heart Rate (bpm)</td>
                {timelineData.map((s, idx) => (
                  <td key={s.id} className="px-6 py-4">
                    {renderComparisonValue('thalach', idx)}
                  </td>
                ))}
              </tr>

              {/* ST Depression */}
              <tr>
                <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">ST Depression Oldpeak</td>
                {timelineData.map((s, idx) => (
                  <td key={s.id} className="px-6 py-4">
                    {renderComparisonValue('oldpeak', idx)}
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default Patients;
