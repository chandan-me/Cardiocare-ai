import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FaHeartbeat, 
  FaSlidersH, 
  FaInfoCircle, 
  FaThermometerHalf, 
  FaUserMinus, 
  FaHeart
} from 'react-icons/fa';

const Simulator = () => {
  const [params, setParams] = useState({
    age: 50,
    sex: 1, // Male
    cp: 1,  // Atypical Angina
    trestbps: 130, // Normal/Elevated
    chol: 220,
    fbs: 0,
    restecg: 1,
    thalach: 150,
    exang: 0,
    oldpeak: 1.0,
    slope: 1,
    ca: 0,
    thal: 2 // Normal
  });

  const [result, setResult] = useState({
    prediction: 'Low Risk',
    confidence: '0.0',
    probability: 0.0,
    loading: false,
    error: null
  });

  // Debounced API updates
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      setResult(prev => ({ ...prev, loading: true, error: null }));
      try {
        const response = await api.post('/predict-quick', params);
        const { prediction, confidence, risk_probability } = response.data;
        
        // Convert risk probability to a float percentage
        const probability = parseFloat(risk_probability || 0) * 100;

        setResult({
          prediction,
          confidence,
          probability: probability > 0 ? probability : parseFloat(confidence || 0),
          loading: false,
          error: null
        });
      } catch (err) {
        console.error('Simulator live query error:', err);
        setResult(prev => ({ 
          ...prev, 
          loading: false, 
          error: 'ML Backend unreachable' 
        }));
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [params]);

  const blockagePercent = Math.min(Math.round(((params.chol - 100) / 300) * 80 + (params.ca * 5)), 99);

  // Color mappings based on risk probability
  const getRiskColor = (prob) => {
    if (prob < 35) return 'text-emerald-500 stroke-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
    if (prob < 70) return 'text-amber-500 stroke-amber-500 bg-amber-50 dark:bg-amber-950/20';
    return 'text-rose-500 stroke-rose-500 bg-rose-50 dark:bg-rose-950/20';
  };

  const getRiskGradient = (prob) => {
    if (prob < 35) return 'from-emerald-500 to-teal-500 shadow-emerald-200 dark:shadow-none';
    if (prob < 70) return 'from-amber-500 to-orange-500 shadow-amber-200 dark:shadow-none';
    return 'from-rose-500 to-pink-600 shadow-rose-200 dark:shadow-none';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FaSlidersH className="text-medical-500" />
          Cardiology Simulator
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Adjust patient physiological parameters in real-time to simulate clinical risk outcomes instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Parameters Sliders Box */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-6">
          <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <FaHeartbeat className="text-medical-500" />
            Patient Clinical Markers
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            
            {/* Age Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                <span>Age: <strong className="text-medical-600 dark:text-medical-400">{params.age} years</strong></span>
                <span className="text-[10px] text-slate-400">20 - 80</span>
              </div>
              <input
                type="range"
                min="20"
                max="80"
                value={params.age}
                onChange={(e) => setParams({ ...params, age: parseInt(e.target.value) })}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
              />
            </div>

            {/* Sex Toggle */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Biological Sex</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setParams({ ...params, sex: 1 })}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${params.sex === 1 ? 'bg-medical-500 text-white border-medical-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                >
                  Male
                </button>
                <button
                  type="button"
                  onClick={() => setParams({ ...params, sex: 0 })}
                  className={`py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${params.sex === 0 ? 'bg-medical-500 text-white border-medical-500' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                >
                  Female
                </button>
              </div>
            </div>

            {/* Resting Blood Pressure Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                <span>Resting Blood Pressure: <strong className="text-medical-600 dark:text-medical-400">{params.trestbps} mmHg</strong></span>
                <span className="text-[10px] text-slate-400">80 - 200</span>
              </div>
              <input
                type="range"
                min="80"
                max="200"
                value={params.trestbps}
                onChange={(e) => setParams({ ...params, trestbps: parseInt(e.target.value) })}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
              />
            </div>

            {/* Cholesterol Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                <span>Serum Cholesterol: <strong className="text-medical-600 dark:text-medical-400">{params.chol} mg/dl</strong></span>
                <span className="text-[10px] text-slate-400">100 - 400</span>
              </div>
              <input
                type="range"
                min="100"
                max="400"
                value={params.chol}
                onChange={(e) => setParams({ ...params, chol: parseInt(e.target.value) })}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
              />
            </div>

            {/* Maximum Heart Rate Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                <span>Max Heart Rate (Thalach): <strong className="text-medical-600 dark:text-medical-400">{params.thalach} bpm</strong></span>
                <span className="text-[10px] text-slate-400">60 - 220</span>
              </div>
              <input
                type="range"
                min="60"
                max="220"
                value={params.thalach}
                onChange={(e) => setParams({ ...params, thalach: parseInt(e.target.value) })}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
              />
            </div>

            {/* Old Peak (ST depression) */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                <span>Oldpeak (ST Depression): <strong className="text-medical-600 dark:text-medical-400">{params.oldpeak.toFixed(1)}</strong></span>
                <span className="text-[10px] text-slate-400">0.0 - 6.0</span>
              </div>
              <input
                type="range"
                min="0"
                max="6"
                step="0.1"
                value={params.oldpeak}
                onChange={(e) => setParams({ ...params, oldpeak: parseFloat(e.target.value) })}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
              />
            </div>

            {/* Chest Pain Type Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Chest Pain Type</label>
              <select
                value={params.cp}
                onChange={(e) => setParams({ ...params, cp: parseInt(e.target.value) })}
                className="w-full py-1.5 px-3 border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500"
              >
                <option value="0">Typical Angina (0)</option>
                <option value="1">Atypical Angina (1)</option>
                <option value="2">Non-anginal Pain (2)</option>
                <option value="3">Asymptomatic (3)</option>
              </select>
            </div>

            {/* Fasting Blood Sugar Selector */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Fasting Blood Sugar &gt; 120 mg/dl</label>
              <select
                value={params.fbs}
                onChange={(e) => setParams({ ...params, fbs: parseInt(e.target.value) })}
                className="w-full py-1.5 px-3 border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500"
              >
                <option value="0">False (&le; 120 mg/dl)</option>
                <option value="1">True (&gt; 120 mg/dl)</option>
              </select>
            </div>

            {/* Resting ECG */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Resting ECG Results</label>
              <select
                value={params.restecg}
                onChange={(e) => setParams({ ...params, restecg: parseInt(e.target.value) })}
                className="w-full py-1.5 px-3 border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500"
              >
                <option value="0">Normal (0)</option>
                <option value="1">ST-T Wave Abnormality (1)</option>
                <option value="2">Left Ventricular Hypertrophy (2)</option>
              </select>
            </div>

            {/* Exercise Angina */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Exercise Induced Angina</label>
              <select
                value={params.exang}
                onChange={(e) => setParams({ ...params, exang: parseInt(e.target.value) })}
                className="w-full py-1.5 px-3 border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500"
              >
                <option value="0">No (0)</option>
                <option value="1">Yes (1)</option>
              </select>
            </div>

            {/* ST Slope */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">ST Segment Slope</label>
              <select
                value={params.slope}
                onChange={(e) => setParams({ ...params, slope: parseInt(e.target.value) })}
                className="w-full py-1.5 px-3 border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500"
              >
                <option value="0">Upsloping (0)</option>
                <option value="1">Flat (1)</option>
                <option value="2">Downsloping (2)</option>
              </select>
            </div>

            {/* Major Vessels (CA) */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Number of Major Vessels (0 - 4)</label>
              <select
                value={params.ca}
                onChange={(e) => setParams({ ...params, ca: parseInt(e.target.value) })}
                className="w-full py-1.5 px-3 border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500"
              >
                <option value="0">0 Vessels Colored</option>
                <option value="1">1 Vessel Colored</option>
                <option value="2">2 Vessels Colored</option>
                <option value="3">3 Vessels Colored</option>
                <option value="4">4 Vessels (Uncertainty)</option>
              </select>
            </div>

            {/* Thalassemia */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-350">Thalassemia Classification (Thal)</label>
              <select
                value={params.thal}
                onChange={(e) => setParams({ ...params, thal: parseInt(e.target.value) })}
                className="w-full py-1.5 px-3 border border-slate-200 dark:border-slate-750 bg-white dark:bg-slate-900 rounded-xl text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500"
              >
                <option value="0">Normal Defect / Unknown (0)</option>
                <option value="1">Fixed Defect (1)</option>
                <option value="2">Normal (2)</option>
                <option value="3">Reversible Defect (3)</option>
              </select>
            </div>

          </div>
        </div>

        {/* Right Side: Risk Outcomes Visual Meter */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Circular Progress Gauge */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 flex flex-col items-center justify-center text-center space-y-6">
            <h4 className="font-display font-bold text-xs text-slate-400 uppercase tracking-widest">
              Live Cardiac Risk
            </h4>

            {/* Circle SVG */}
            <div className="relative h-44 w-44">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  className="stroke-slate-100 dark:stroke-slate-800"
                  strokeWidth="8"
                />
                {/* Progress Ring */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  className={`transition-all duration-300 ${getRiskColor(result.probability).split(' ')[1]}`}
                  strokeWidth="8"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * result.probability) / 100}
                  strokeLinecap="round"
                />
              </svg>

              {/* Text Inside Circle */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">
                  {result.probability.toFixed(1)}%
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                  Probability
                </span>
              </div>
            </div>

            {/* Risk Class Badge */}
            <div className="w-full space-y-1">
              <div className={`py-2 rounded-xl text-white font-display font-extrabold text-sm shadow-md bg-gradient-to-r ${getRiskGradient(result.probability)}`}>
                {result.prediction === 'High Risk' ? 'CRITICAL HIGH RISK' : 'LOW CARDIOVASCULAR RISK'}
              </div>
              <p className="text-[10px] text-slate-400 font-medium pt-1.5">
                *Outputs represent live predictive probability. Keep values normal to lower risk.
              </p>
            </div>
          </div>

          {/* Coronary Artery Plaque Visualizer */}
          <div className="glass-card rounded-2xl p-5 border border-slate-150 dark:border-slate-850 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h4 className="font-display font-bold text-xs text-slate-700 dark:text-slate-350 uppercase tracking-widest flex items-center gap-1.5">
                <FaHeart className="text-rose-500 animate-pulse" />
                Coronary Artery Plaque
              </h4>
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                blockagePercent < 50 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400' 
                  : blockagePercent < 75 
                    ? 'bg-amber-50 text-amber-750 dark:bg-amber-950/20 dark:text-amber-450' 
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455'
              }`}>
                {blockagePercent}% Occluded
              </span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center space-y-2.5 relative overflow-hidden shadow-inner">
              <svg width="100%" height="80" viewBox="0 0 200 80" className="w-full">
                <rect x="0" y="5" width="200" height="70" rx="4" fill="#3b0712" />
                <rect x="0" y="15" width="200" height="50" fill="#991b1b" />
                
                <g className="animate-pulse">
                  <circle cx="20" cy="40" r="4" fill="#ef4444" opacity="0.8" />
                  <circle cx="50" cy="30" r="4" fill="#f87171" opacity="0.6" />
                  <circle cx="50" cy="50" r="4.5" fill="#dc2626" opacity="0.9" />
                  <circle cx="80" cy="25" r="4" fill="#f87171" opacity="0.7" />
                  <circle cx="80" cy="55" r="3.5" fill="#b91c1c" opacity="0.8" />
                  <circle cx="110" cy="32" r="3" fill="#ef4444" opacity="0.6" />
                  <circle cx="110" cy="48" r="4" fill="#f87171" opacity="0.7" />
                  <circle cx="140" cy="38" r="4.5" fill="#dc2626" opacity="0.9" />
                  <circle cx="170" cy="30" r="4" fill="#ef4444" opacity="0.8" />
                  <circle cx="170" cy="50" r="4" fill="#b91c1c" opacity="0.9" />
                </g>

                <path 
                  d={`M 60,15 Q 100,${15 + (blockagePercent / 100) * 22} 140,15 Z`} 
                  fill="#eab308" 
                  stroke="#ca8a04" 
                  strokeWidth="0.8" 
                />
                <path 
                  d={`M 60,65 Q 100,${65 - (blockagePercent / 100) * 22} 140,65 Z`} 
                  fill="#eab308" 
                  stroke="#ca8a04" 
                  strokeWidth="0.8" 
                />

                {blockagePercent > 10 && (
                  <text x="100" y="44" fill="#ffffff" fontSize="6.5" fontWeight="bold" textAnchor="middle" opacity="0.9">
                    {blockagePercent}% Blocked
                  </text>
                )}
              </svg>
              
              <div className="text-[10px] text-center font-medium leading-relaxed">
                {blockagePercent < 50 ? (
                  <span className="text-emerald-450">Mild Plaque accumulation. Normal hemodynamic blood flow.</span>
                ) : blockagePercent < 75 ? (
                  <span className="text-amber-400">Moderate Arterial Stenosis. Consider lipid-lowering therapies.</span>
                ) : (
                  <span className="text-rose-500 font-extrabold animate-pulse">Critical Stenosis! Severe restriction of myocardial blood flow.</span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Guidance Box */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4">
            <h4 className="font-display font-bold text-xs text-slate-700 dark:text-slate-350 uppercase tracking-widest flex items-center gap-1.5">
              <FaInfoCircle className="text-sky-500 h-4 w-4" />
              Physiological Impact Guide
            </h4>
            
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2.5 leading-relaxed">
              <li>
                ⚠️ <strong>Cholesterol</strong>: Levels above 240 mg/dl dramatically escalate vascular stenosis (clogging) probabilities.
              </li>
              <li>
                💓 <strong>Thalach (Max HR)</strong>: Lower achieved maximum heart rates during stress tests indicate impaired cardiac reserve.
              </li>
              <li>
                📈 <strong>Oldpeak (ST Depression)</strong>: Values &gt; 1.5 suggest myocardial ischemia (insufficient blood/oxygen supply to the heart).
              </li>
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Simulator;
