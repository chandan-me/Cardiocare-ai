import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
  FaArrowLeft, 
  FaDownload, 
  FaExclamationCircle, 
  FaCheckCircle, 
  FaAppleAlt, 
  FaRunning, 
  FaBriefcaseMedical, 
  FaExclamationTriangle, 
  FaHome,
  FaFilePdf,
  FaRegHeart  
} from 'react-icons/fa';

const PredictionResult = () => {
  const location = useLocation();
  const [downloading, setDownloading] = useState(false);
  
  const stateData = location.state;
  if (!stateData || !stateData.result) {
    return (
      <div className="max-w-md mx-auto text-center py-12 space-y-4">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-amber-500 dark:bg-amber-950/20 dark:text-amber-400">
          <FaExclamationTriangle className="h-8 w-8" />
        </div>
        <h2 className="font-display font-bold text-xl text-slate-800 dark:text-slate-100">No Assessment Loaded</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Please submit a patient risk assessment form to see clinical outcomes.
        </p>
        <Link to="/dashboard/predict" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-medical-500 text-white font-semibold hover:bg-medical-600 transition">
          <FaArrowLeft className="h-4 w-4" /> Back to Form
        </Link>
      </div>
    );
  }

  const { result, inputData } = stateData;
  const isHighRisk = result.result === 'High Risk';

  const downloadReport = async () => {
    setDownloading(true);
    try {
      const response = await api.post('/generate-report', { id: result.id }, { responseType: 'blob' });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Heart_Disease_Report_${result.patient_name.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileURL);

      Swal.fire({
        icon: 'success',
        title: 'Report Downloaded',
        text: 'The cardiac risk assessment PDF has been saved.',
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (err) {
      console.error('PDF download error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Could not render PDF report at this time.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setDownloading(false);
    }
  };

  // Helper to parse Gemini recommendation markdown into structured objects
  const parseRecommendations = (text) => {
    if (!text) return [];
    
    // We expect sections defined by ### (e.g. ### Lifestyle Tips or ### **Lifestyle Tips**)
    const sections = [];
    const parts = text.split(/###\s+/);
    
    parts.forEach(part => {
      if (!part.trim()) return;
      const lines = part.split('\n');
      const rawTitle = lines[0].replace(/\*\*|:/g, '').trim();
      const rawContent = lines.slice(1).join('\n').trim();
      
      let title = rawTitle;
      let icon = FaHome;
      let colorClass = 'bg-sky-50 text-sky-600 dark:bg-sky-950/30 dark:text-sky-400 border-sky-100 dark:border-sky-900/50';
      
      if (title.toLowerCase().includes('lifestyle')) {
        title = 'Lifestyle Modifications';
        icon = FaHome;
        colorClass = 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 border-blue-100 dark:border-blue-900/50';
      } else if (title.toLowerCase().includes('diet')) {
        title = 'Dietary Guidelines';
        icon = FaAppleAlt;
        colorClass = 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50';
      } else if (title.toLowerCase().includes('exercise')) {
        title = 'Exercise & Physical Activity';
        icon = FaRunning;
        colorClass = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50';
      } else if (title.toLowerCase().includes('medical')) {
        title = 'Clinical Follow-ups';
        icon = FaBriefcaseMedical;
        colorClass = 'bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400 border-purple-100 dark:border-purple-900/50';
      } else if (title.toLowerCase().includes('emergency') || title.toLowerCase().includes('warning')) {
        title = 'CRITICAL WARNINGS';
        icon = FaExclamationTriangle;
        colorClass = 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400 border-red-200 dark:border-red-900/50';
      }
      
      // Split content into clean list items
      const items = rawContent
        .split('\n')
        .map(line => line.trim().replace(/^\s*-\s*|\*\*/g, '').trim())
        .filter(line => line.length > 0);
        
      sections.push({ title, icon, colorClass, items });
    });
    
    return sections;
  };

  const adviceSections = parseRecommendations(result.recommendations);

  // SVG Gauge calculations
  const confidence = result.confidence;
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">
            Risk Analysis Assessment
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Patient ID: HRA-{result.id?.toString().padStart(5, '0')} | Completed on {new Date(result.created_at || Date.now()).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/dashboard/predict"
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition text-sm flex items-center justify-center gap-2"
          >
            <FaArrowLeft className="h-4 w-4" />
            New Assessment
          </Link>

          <button
            onClick={downloadReport}
            disabled={downloading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-medical-600 to-sky-500 text-white font-bold text-sm shadow-md hover:scale-101 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {downloading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
            ) : (
              <>
                <FaDownload className="h-4 w-4" />
                Download PDF Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Score Cards + Clinical metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Outcome Card */}
        <div className={`glass-card rounded-2xl p-6 border ${
          isHighRisk ? 'border-red-200 glow-red' : 'border-emerald-200 glow-blue'
        } md:col-span-1 flex flex-col items-center text-center justify-center`}>
          
          <div className="mb-4">
            {isHighRisk ? (
              <FaExclamationCircle className="h-16 w-16 text-rose-500 animate-pulse" />
            ) : (
              <FaCheckCircle className="h-16 w-16 text-emerald-500" />
            )}
          </div>

          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Diagnostic Outcome
          </span>
          <h2 className={`font-display text-3xl font-extrabold mt-1 ${
            isHighRisk ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
          }`}>
            {result.result === 'High Risk' ? 'High Risk' : 'Healthy Profile'}
          </h2>

          {/* SVG Progress Circle */}
          <div className="relative mt-8 flex items-center justify-center">
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className={isHighRisk ? "stroke-rose-500" : "stroke-emerald-500"}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-slate-800 dark:text-slate-100">
              <span className="font-display font-extrabold text-2xl">{confidence}%</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Confidence</span>
            </div>
          </div>
        </div>

        {/* Clinical Inputs Table */}
        <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-800 md:col-span-2 space-y-4">
          <h3 className="font-display font-bold text-md text-slate-800 dark:text-slate-200">
            Clinical Diagnostic Parameters
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Patient Name</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{result.patient_name}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Age / Sex</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {result.age} yrs / {result.gender === 1 ? 'Male' : 'Female'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Resting Blood Pressure</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{inputData?.trestbps} mmHg</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Serum Cholesterol</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{inputData?.chol} mg/dl</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Max Heart Rate</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{inputData?.thalach} bpm</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Chest Pain Type (CP)</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Type {inputData?.cp}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">ST Depression (Oldpeak)</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{inputData?.oldpeak}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Major Vessels (CA)</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{inputData?.ca}</p>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <span className="text-slate-400">Thalassemia Status</span>
              <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">Class {inputData?.thal}</p>
            </div>
          </div>
        </div>

      </div>

      {/* AI Recommendations Section */}
      <div className="glass-card rounded-2xl p-8 border border-slate-150 dark:border-slate-800 space-y-6">
        <div>
          <h3 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FaRegHeart className="text-rose-500 animate-pulse-heart" />
            AI Heart Health Recommendations
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Structured lifestyle guidelines custom generated for the patient profile.
          </p>
        </div>

        {adviceSections.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {adviceSections.map((sec, idx) => (
              <div 
                key={idx} 
                className={`p-6 rounded-2xl border ${sec.colorClass} flex flex-col gap-4 ${
                  sec.title.includes('WARNINGS') ? 'md:col-span-2 border-red-300 shadow-sm' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-800 shadow-sm">
                    <sec.icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-display font-extrabold text-sm uppercase tracking-wide">
                    {sec.title}
                  </h4>
                </div>

                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300 pl-1">
                  {sec.items.map((item, key) => (
                    <li key={key} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-600 flex-shrink-0" />
                      <span className="leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-slate-50 dark:bg-slate-850 rounded-xl text-center text-slate-400 text-xs">
            No recommendations generated. Run prediction again.
          </div>
        )}
      </div>

    </div>
  );
};

export default PredictionResult;
