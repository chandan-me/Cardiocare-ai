import React, { useState, useEffect, useRef } from 'react';
import { 
  FaBookMedical, 
  FaHeartbeat, 
  FaInfoCircle, 
  FaExternalLinkAlt, 
  FaCalculator, 
  FaHeart,
  FaWeight,
  FaRegHeart
} from 'react-icons/fa';

const Toolkit = () => {
  const [activeTab, setActiveTab] = useState('ranges');
  
  // Target Heart Rate Calculator State
  const [calcAge, setCalcAge] = useState(45);
  const [calcRestingHr, setCalcRestingHr] = useState(70);
  
  // BMI State
  const [weight, setWeight] = useState(75); 
  const [height, setHeight] = useState(175); 

  // Heart Age State
  const [actualAge, setActualAge] = useState(45);
  const [sex, setSex] = useState('male');
  const [systolicBp, setSystolicBp] = useState(135);
  const [cholValue, setCholValue] = useState(220);
  const [smoker, setSmoker] = useState(false);
  const [diabetic, setDiabetic] = useState(false);

  // ECG Simulator State
  const [ecgBpm, setEcgBpm] = useState(75);
  const [rhythmType, setRhythmType] = useState('normal'); // 'normal', 'st_elevation', 'lvh'
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Calculate HR Zones (Karvonen Formula)
  const maxHeartRate = 220 - calcAge;
  const heartRateReserve = maxHeartRate - calcRestingHr;
  const targetLower = Math.round(heartRateReserve * 0.5 + calcRestingHr);
  const targetUpper = Math.round(heartRateReserve * 0.85 + calcRestingHr);

  // Calculate BMI
  const heightMeters = height / 100;
  const bmiVal = (weight / (heightMeters * heightMeters)).toFixed(1);
  
  const getBmiCategory = (val) => {
    if (val < 18.5) return { label: 'Underweight', color: 'text-amber-500' };
    if (val < 25) return { label: 'Normal weight', color: 'text-emerald-500' };
    if (val < 30) return { label: 'Overweight', color: 'text-orange-500' };
    return { label: 'Obese', color: 'text-rose-500' };
  };

  // Heart Age Calculator (Heuristic vascular aging based on Framingham risk weights)
  const calculateHeartAge = () => {
    let baseAge = actualAge;
    
    // BP contribution
    if (systolicBp >= 140) baseAge += 6;
    else if (systolicBp >= 130) baseAge += 3;
    else if (systolicBp < 120) baseAge -= 1;

    // Cholesterol contribution
    if (cholValue >= 240) baseAge += 5;
    else if (cholValue >= 200) baseAge += 2;
    else if (cholValue < 160) baseAge -= 1;

    // Lifestyle switches
    if (smoker) baseAge += 4;
    if (diabetic) baseAge += 5;

    // Gender adjustments
    if (sex === 'female') {
      baseAge -= 1; // standard demographic offset
    }

    return Math.max(actualAge - 5, Math.round(baseAge));
  };

  const heartAge = calculateHeartAge();
  const heartAgeDiff = heartAge - actualAge;

  // ECG Rhythm Generator drawing onto HTML5 canvas
  useEffect(() => {
    if (activeTab !== 'ecg') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width;
    let height = canvas.height;
    let xTrace = 0;
    
    // Grid parameters
    const gridSize = 15;
    
    // Animation trace arrays
    const tracePoints = new Array(width).fill(height / 2);

    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.08)'; // clinical pink gridlines
      ctx.lineWidth = 0.5;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    };

    // Synthesize P-QRS-T complexes based on active heart rhythm selections
    const generateECGValue = (t) => {
      // Calculate beat cycle width based on Bpm
      const cycleLength = (60 / ecgBpm) * 60; // frame cycles per beat (assumed 60fps)
      const phase = t % cycleLength;
      
      const baseline = height / 2;

      // Peak parameters based on active rhythm type selections
      let qVal = -8;
      let rVal = 65; 
      let sVal = -20;
      let tOffset = 0; 
      let stElev = 0; 

      if (rhythmType === 'st_elevation') {
        stElev = 18; // elevated ST segment line
        tOffset = 8;
      } else if (rhythmType === 'lvh') {
        rVal = 85;   // massive R wave amplitude
        sVal = -45;  // deep reciprocal S waves
      }

      // 1. Isoelectric baseline
      if (phase < cycleLength * 0.1) return baseline;

      // 2. P-wave
      if (phase >= cycleLength * 0.1 && phase < cycleLength * 0.2) {
        const pPhase = (phase - cycleLength * 0.1) / (cycleLength * 0.1);
        return baseline - Math.sin(pPhase * Math.PI) * 6;
      }

      // 3. PR Interval segment
      if (phase >= cycleLength * 0.2 && phase < cycleLength * 0.3) return baseline;

      // 4. Q-wave
      if (phase >= cycleLength * 0.3 && phase < cycleLength * 0.33) {
        const qPhase = (phase - cycleLength * 0.3) / (cycleLength * 0.03);
        return baseline - (qPhase * qVal);
      }

      // 5. R-wave peak
      if (phase >= cycleLength * 0.33 && phase < cycleLength * 0.37) {
        const rPhase = (phase - cycleLength * 0.33) / (cycleLength * 0.04);
        return baseline - qVal - (rPhase * (rVal - qVal));
      }

      // 6. S-wave drop
      if (phase >= cycleLength * 0.37 && phase < cycleLength * 0.42) {
        const sPhase = (phase - cycleLength * 0.37) / (cycleLength * 0.05);
        return baseline - rVal + (sPhase * (rVal - sVal));
      }

      // 7. ST segment interval
      if (phase >= cycleLength * 0.42 && phase < cycleLength * 0.52) {
        const stPhase = (phase - cycleLength * 0.42) / (cycleLength * 0.1);
        return baseline - sVal - (stPhase * (sVal + stElev));
      }

      // 8. T-wave recovery
      if (phase >= cycleLength * 0.52 && phase < cycleLength * 0.65) {
        const tPhase = (phase - cycleLength * 0.52) / (cycleLength * 0.13);
        return baseline - stElev - Math.sin(tPhase * Math.PI) * (14 + tOffset);
      }

      // 9. Isoelectric baseline return
      return baseline;
    };

    let time = 0;
    const animate = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      drawGrid();

      // Shift traces
      const val = generateECGValue(time);
      tracePoints.push(val);
      tracePoints.shift();

      // Render traces lines
      ctx.strokeStyle = '#ef4444'; // glowing medical red line
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, tracePoints[0]);

      for (let i = 1; i < width; i++) {
        ctx.lineTo(i, tracePoints[i]);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; // reset shadow

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [activeTab, ecgBpm, rhythmType]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FaBookMedical className="text-medical-500" />
          Clinical Reference Toolkit
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Medical guidelines, vital reference ranges, interactive ECG simulator, and clinical calculators.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold">
        <button
          onClick={() => setActiveTab('ranges')}
          className={`pb-3 px-4 transition-all border-b-2 cursor-pointer ${activeTab === 'ranges' ? 'border-medical-500 text-medical-600 dark:text-medical-400' : 'border-transparent text-slate-450 hover:text-slate-650'}`}
        >
          Reference Vitals Ranges
        </button>
        <button
          onClick={() => setActiveTab('guidelines')}
          className={`pb-3 px-4 transition-all border-b-2 cursor-pointer ${activeTab === 'guidelines' ? 'border-medical-500 text-medical-600 dark:text-medical-400' : 'border-transparent text-slate-450 hover:text-slate-650'}`}
        >
          Clinical Guidelines
        </button>
        <button
          onClick={() => setActiveTab('calculators')}
          className={`pb-3 px-4 transition-all border-b-2 cursor-pointer ${activeTab === 'calculators' ? 'border-medical-500 text-medical-600 dark:text-medical-400' : 'border-transparent text-slate-450 hover:text-slate-650'}`}
        >
          Utility Calculators
        </button>
        <button
          onClick={() => setActiveTab('ecg')}
          className={`pb-3 px-4 transition-all border-b-2 cursor-pointer ${activeTab === 'ecg' ? 'border-medical-500 text-medical-600 dark:text-medical-400' : 'border-transparent text-slate-450 hover:text-slate-650'}`}
        >
          ECG Rhythm Simulator
        </button>
      </div>

      {/* Tab 1: Reference Ranges */}
      {activeTab === 'ranges' && (
        <div className="space-y-6 animate-fade-in">
          {/* Blood Pressure Table */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4 shadow-sm">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
              Blood Pressure Classifications (AHA 2017 Guidelines)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5">Systolic BP (mmHg)</th>
                    <th className="py-2.5">Diastolic BP (mmHg)</th>
                    <th className="py-2.5">Clinical Action Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-450 font-semibold">
                  <tr>
                    <td className="py-3 font-bold text-emerald-600 dark:text-emerald-450">Normal</td>
                    <td className="py-3">&lt; 120</td>
                    <td className="py-3">and &lt; 80</td>
                    <td className="py-3 text-slate-400">Encourage healthy lifestyle choices.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-amber-500">Elevated</td>
                    <td className="py-3">120 - 129</td>
                    <td className="py-3">and &lt; 80</td>
                    <td className="py-3 text-slate-400">Recommend non-pharmacologic therapy.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-orange-500">Stage 1 Hypertension</td>
                    <td className="py-3">130 - 139</td>
                    <td className="py-3">or 80 - 89</td>
                    <td className="py-3 text-slate-400">Assess ASCVD risk; consider medication if risk is high.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-rose-500">Stage 2 Hypertension</td>
                    <td className="py-3">&ge; 140</td>
                    <td className="py-3">or &ge; 90</td>
                    <td className="py-3 text-slate-400">Prescribe combination drug therapies; regular tracking.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cholesterol Table */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4 shadow-sm">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
              Serum Cholesterol Levels (Adult Reference Ranges)
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-2.5">Category</th>
                    <th className="py-2.5">Total Cholesterol (mg/dl)</th>
                    <th className="py-2.5">Clinical Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-450 font-semibold">
                  <tr>
                    <td className="py-3 font-bold text-emerald-600 dark:text-emerald-450">Desirable</td>
                    <td className="py-3">&lt; 200</td>
                    <td className="py-3">Optimal level; lower risk of cardiovascular disease.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-amber-500">Borderline High</td>
                    <td className="py-3">200 - 239</td>
                    <td className="py-3">Moderate elevation; diet adjustment advised.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-bold text-rose-500">High Risk</td>
                    <td className="py-3">&ge; 240</td>
                    <td className="py-3">Double the risk of stroke or coronary heart failure.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Guidelines */}
      {activeTab === 'guidelines' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4 shadow-sm">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FaInfoCircle className="text-medical-500" />
              Major Cardiological Societies Guidelines
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-150">AHA / ACC Primary Prevention Guidelines</span>
                  <a href="https://www.ahajournals.org/doi/10.1161/CIR.0000000000000678" target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:underline flex items-center gap-1 font-bold">
                    Read AHA Link <FaExternalLinkAlt className="h-2 w-2" />
                  </a>
                </div>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                  Focuses on non-pharmacological risk assessments (lifestyle counseling, physical activity, dietary patterns) as the foundation of cardiovascular disease prevention. Strongly advises prescribing statins for high-cholesterol adults age 40-75.
                </p>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-150">ESC Cardiovascular Prevention Guidelines</span>
                  <a href="https://academic.oup.com/eurheartj/article/42/34/3227/6358470" target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:underline flex items-center gap-1 font-bold">
                    Read ESC Link <FaExternalLinkAlt className="h-2 w-2" />
                  </a>
                </div>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-semibold">
                  Applies the SCORE2 and SCORE2-OP algorithms to estimate 10-year risk of cardiovascular disease events in European regions. Highlights distinct thresholds depending on demographic age bands and country-specific baselines.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Utility Calculators */}
      {activeTab === 'calculators' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Target Heart Rate Calculator */}
            <div className="glass-card rounded-2xl p-5 border border-slate-150 dark:border-slate-850 space-y-4 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                  <FaCalculator className="text-medical-500" />
                  Heart Rate Zone
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                      <span>Age: <strong>{calcAge} years</strong></span>
                    </div>
                    <input
                      type="range"
                      min="18"
                      max="90"
                      value={calcAge}
                      onChange={(e) => setCalcAge(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                      <span>Resting HR: <strong>{calcRestingHr} bpm</strong></span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="120"
                      value={calcRestingHr}
                      onChange={(e) => setCalcRestingHr(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] space-y-2 mt-4 text-slate-700 dark:text-slate-300 font-semibold">
                <div className="flex justify-between">
                  <span>Estimated Max HR:</span>
                  <span className="font-bold">{maxHeartRate} bpm</span>
                </div>
                <div className="flex justify-between text-medical-600 dark:text-sky-400 font-bold border-t border-slate-200 dark:border-slate-800 pt-2">
                  <span>Target (50%-85%):</span>
                  <span>{targetLower}-{targetUpper} bpm</span>
                </div>
              </div>
            </div>

            {/* BMI Calculator */}
            <div className="glass-card rounded-2xl p-5 border border-slate-150 dark:border-slate-850 space-y-4 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                  <FaWeight className="text-medical-500" />
                  BMI Index
                </h3>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                      <span>Weight: <strong>{weight} kg</strong></span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="160"
                      value={weight}
                      onChange={(e) => setWeight(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                      <span>Height: <strong>{height} cm</strong></span>
                    </div>
                    <input
                      type="range"
                      min="120"
                      max="220"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value))}
                      className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] space-y-2 mt-4 text-slate-700 dark:text-slate-300 font-semibold">
                <div className="flex justify-between">
                  <span>Calculated BMI:</span>
                  <span className="font-bold">{bmiVal} kg/m²</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-bold">
                  <span>Category:</span>
                  <span className={getBmiCategory(parseFloat(bmiVal)).color}>
                    {getBmiCategory(parseFloat(bmiVal)).label}
                  </span>
                </div>
              </div>
            </div>

            {/* Vascular Heart Age Calculator */}
            <div className="glass-card rounded-2xl p-5 border border-slate-150 dark:border-slate-850 space-y-4 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                  <FaHeart className="text-rose-500 animate-pulse" />
                  Vascular Heart Age
                </h3>

                <div className="space-y-2.5 text-[10px] font-semibold text-slate-700 dark:text-slate-350">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block mb-0.5 text-slate-450 font-bold">Real Age: {actualAge} yrs</span>
                      <input
                        type="range"
                        min="30"
                        max="85"
                        value={actualAge}
                        onChange={(e) => setActualAge(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-lg accent-medical-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="block mb-0.5 text-slate-450 font-bold">Systolic BP: {systolicBp}</span>
                      <input
                        type="range"
                        min="90"
                        max="180"
                        value={systolicBp}
                        onChange={(e) => setSystolicBp(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-lg accent-medical-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block mb-0.5 text-slate-450 font-bold">Cholesterol: {cholValue}</span>
                      <input
                        type="range"
                        min="130"
                        max="300"
                        value={cholValue}
                        onChange={(e) => setCholValue(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-lg accent-medical-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="block mb-0.5 text-slate-450 font-bold">Biological Sex</span>
                      <select
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-750 dark:bg-slate-800 text-[10px]"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={smoker} onChange={(e) => setSmoker(e.target.checked)} className="accent-medical-500" />
                      <span>Smoker</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={diabetic} onChange={(e) => setDiabetic(e.target.checked)} className="accent-medical-500" />
                      <span>Diabetic</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] space-y-2 mt-4 text-slate-705 dark:text-slate-300 font-bold">
                <div className="flex justify-between">
                  <span>Vascular Heart Age:</span>
                  <span className={`font-extrabold ${heartAgeDiff > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{heartAge} years</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-semibold text-[10px] text-slate-500">
                  <span>Relative Status:</span>
                  <span>
                    {heartAgeDiff > 0 
                      ? `⚠️ Heart is ${heartAgeDiff} years older` 
                      : `✅ Heart is ${Math.abs(heartAgeDiff)} years younger`}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 4: ECG Rhythm Simulator */}
      {activeTab === 'ecg' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div>
                <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <FaHeartbeat className="text-rose-500 animate-pulse-heart" />
                  ECG Trace Rhythm Visualizer
                </h3>
                <p className="text-[11px] text-slate-400">
                  Interactive real-time sinus grid tracing normal cardiac cycles vs ST and LVH parameters.
                </p>
              </div>

              {/* Rhythm Selector controls */}
              <div className="flex gap-2 text-[10px] font-bold">
                <button
                  onClick={() => setRhythmType('normal')}
                  className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${rhythmType === 'normal' ? 'bg-slate-800 text-white border-slate-850' : 'bg-white text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'}`}
                >
                  Normal Sinus
                </button>
                <button
                  onClick={() => setRhythmType('st_elevation')}
                  className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${rhythmType === 'st_elevation' ? 'bg-slate-800 text-white border-slate-850' : 'bg-white text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'}`}
                >
                  ST Elevation
                </button>
                <button
                  onClick={() => setRhythmType('lvh')}
                  className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${rhythmType === 'lvh' ? 'bg-slate-800 text-white border-slate-850' : 'bg-white text-slate-650 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'}`}
                >
                  Left Ventricular Hypertrophy (LVH)
                </button>
              </div>
            </div>

            {/* Simulated Traces screen */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-inner bg-white">
              <canvas 
                ref={canvasRef} 
                width="800" 
                height="220" 
                className="w-full h-56 block"
              />
            </div>

            {/* Heart Rate speed modifier */}
            <div className="max-w-xs space-y-1">
              <div className="flex justify-between text-xs font-bold text-slate-550">
                <span>Simulator Heart Rate (BPM):</span>
                <span className="text-rose-500">{ecgBpm} bpm</span>
              </div>
              <input
                type="range"
                min="50"
                max="150"
                value={ecgBpm}
                onChange={(e) => setEcgBpm(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Toolkit;
