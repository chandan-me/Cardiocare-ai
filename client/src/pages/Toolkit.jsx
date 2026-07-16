import React, { useState, useEffect, useRef } from 'react';
import { 
  FaBookMedical, 
  FaHeartbeat, 
  FaInfoCircle, 
  FaExternalLinkAlt, 
  FaCalculator, 
  FaHeart,
  FaWeight,
  FaRegHeart,
  FaFileDownload,
  FaVials
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

  // Framingham 10-Year CVD State
  const [fage, setFage] = useState(45);
  const [fsex, setFsex] = useState('male');
  const [fchol, setFchol] = useState(210);
  const [fhdl, setFhdl] = useState(45);
  const [fsbp, setFsbp] = useState(130);
  const [ftreated, setFtreated] = useState(false);
  const [fsmoker, setFsmoker] = useState(false);
  const [fdiabetic, setFdiabetic] = useState(false);

  // ECG Simulator State
  const [ecgBpm, setEcgBpm] = useState(75);
  const [rhythmType, setRhythmType] = useState('normal'); 
  const [prInterval, setPrInterval] = useState(0.15); // fraction of cycle
  const [qrsDuration, setQrsDuration] = useState(0.05); // fraction of cycle
  const [qtInterval, setQtInterval] = useState(0.35); // fraction of cycle
  
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

  // Heart Age Calculator (Heuristic vascular aging)
  const calculateHeartAge = () => {
    let baseAge = actualAge;
    if (systolicBp >= 140) baseAge += 6;
    else if (systolicBp >= 130) baseAge += 3;
    else if (systolicBp < 120) baseAge -= 1;

    if (cholValue >= 240) baseAge += 5;
    else if (cholValue >= 200) baseAge += 2;
    else if (cholValue < 160) baseAge -= 1;

    if (smoker) baseAge += 4;
    if (diabetic) baseAge += 5;
    if (sex === 'female') baseAge -= 1;

    return Math.max(actualAge - 5, Math.round(baseAge));
  };

  const heartAge = calculateHeartAge();
  const heartAgeDiff = heartAge - actualAge;

  // Framingham 10-Year Cardiovascular Disease Risk Score calculation
  const calculateFramingham = () => {
    let pts = 0;
    
    // 1. Age points
    if (fsex === 'male') {
      if (fage >= 30 && fage <= 34) pts += 0;
      else if (fage >= 35 && fage <= 39) pts += 2;
      else if (fage >= 40 && fage <= 44) pts += 5;
      else if (fage >= 45 && fage <= 49) pts += 7;
      else if (fage >= 50 && fage <= 54) pts += 8;
      else if (fage >= 55 && fage <= 59) pts += 10;
      else if (fage >= 60 && fage <= 64) pts += 11;
      else if (fage >= 65 && fage <= 69) pts += 12;
      else if (fage >= 70 && fage <= 74) pts += 14;
      else pts += 15;
    } else {
      if (fage >= 30 && fage <= 34) pts += 0;
      else if (fage >= 35 && fage <= 39) pts += 2;
      else if (fage >= 40 && fage <= 44) pts += 4;
      else if (fage >= 45 && fage <= 49) pts += 5;
      else if (fage >= 50 && fage <= 54) pts += 7;
      else if (fage >= 55 && fage <= 59) pts += 8;
      else if (fage >= 60 && fage <= 64) pts += 9;
      else if (fage >= 65 && fage <= 69) pts += 10;
      else if (fage >= 70 && fage <= 74) pts += 12;
      else pts += 13;
    }

    // 2. Cholesterol points
    if (fchol >= 280) pts += 4;
    else if (fchol >= 240) pts += 3;
    else if (fchol >= 200) pts += 2;
    else if (fchol >= 160) pts += 1;

    // 3. HDL points
    if (fhdl < 35) pts += 2;
    else if (fhdl >= 35 && fhdl <= 44) pts += 1;
    else if (fhdl >= 45 && fhdl <= 59) pts += 0;
    else pts -= 1;

    // 4. Systolic BP points
    if (ftreated) {
      if (fsbp >= 160) pts += 3;
      else if (fsbp >= 140) pts += 2;
      else if (fsbp >= 130) pts += 2;
      else if (fsbp >= 120) pts += 1;
    } else {
      if (fsbp >= 160) pts += 2;
      else if (fsbp >= 140) pts += 1;
      else if (fsbp >= 130) pts += 1;
      else if (fsbp >= 120) pts += 0;
    }

    // 5. Smoker
    if (fsmoker) pts += (fage < 50 ? 4 : fage < 70 ? 2 : 1);

    // 6. Diabetes
    if (fdiabetic) pts += (fsex === 'male' ? 3 : 4);

    // Map points to risk percentage
    let risk = 0;
    if (fsex === 'male') {
      if (pts <= 0) risk = 1;
      else if (pts <= 4) risk = 2;
      else if (pts <= 6) risk = 3;
      else if (pts <= 8) risk = 5;
      else if (pts === 9) risk = 6;
      else if (pts === 10) risk = 8;
      else if (pts === 11) risk = 10;
      else if (pts === 12) risk = 12;
      else if (pts === 13) risk = 15;
      else if (pts === 14) risk = 18;
      else if (pts === 15) risk = 22;
      else if (pts === 16) risk = 27;
      else risk = 30; 
    } else {
      if (pts <= 0) risk = 1;
      else if (pts <= 4) risk = 2;
      else if (pts <= 6) risk = 3;
      else if (pts <= 8) risk = 4;
      else if (pts === 9) risk = 5;
      else if (pts === 10) risk = 6;
      else if (pts === 11) risk = 8;
      else if (pts === 12) risk = 10;
      else if (pts === 13) risk = 12;
      else if (pts === 14) risk = 15;
      else if (pts === 15) risk = 18;
      else if (pts === 16) risk = 22;
      else if (pts === 17) risk = 27;
      else risk = 30; 
    }

    return { points: pts, risk };
  };

  const { points: fPoints, risk: fRisk } = calculateFramingham();

  // ECG Rhythm Generator drawing onto HTML5 canvas with custom wave intervals
  useEffect(() => {
    if (activeTab !== 'ecg') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width;
    let height = canvas.height;
    
    const gridSize = 15;
    const tracePoints = new Array(width).fill(height / 2);

    const drawGrid = () => {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.08)'; 
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

    const generateECGValue = (t) => {
      const cycleLength = (60 / ecgBpm) * 60; 
      const phase = t % cycleLength;
      const baseline = height / 2;

      let qVal = -8;
      let rVal = 65; 
      let sVal = -20;
      let tOffset = 0; 
      let stElev = 0; 

      if (rhythmType === 'st_elevation') {
        stElev = 18; 
        tOffset = 8;
      } else if (rhythmType === 'lvh') {
        rVal = 85;   
        sVal = -45;  
      }

      // Dynamic phases based on sliders
      const pStart = cycleLength * 0.05;
      const pEnd = cycleLength * 0.15;
      const prEnd = cycleLength * (0.15 + (prInterval - 0.15)); 
      
      const qStart = prEnd;
      const qEnd = qStart + cycleLength * (qrsDuration * 0.2);
      const rEnd = qEnd + cycleLength * (qrsDuration * 0.3);
      const sEnd = rEnd + cycleLength * (qrsDuration * 0.5);
      
      const stEnd = sEnd + cycleLength * 0.08;
      const tEnd = stEnd + cycleLength * (qtInterval * 0.7);

      if (phase < pStart) return baseline;

      // P-wave
      if (phase >= pStart && phase < pEnd) {
        const pPhase = (phase - pStart) / (pEnd - pStart);
        return baseline - Math.sin(pPhase * Math.PI) * 6;
      }

      // PR segment
      if (phase >= pEnd && phase < qStart) return baseline;

      // Q-wave
      if (phase >= qStart && phase < qEnd) {
        const qPhase = (phase - qStart) / (qEnd - qStart);
        return baseline - (qPhase * qVal);
      }

      // R-wave
      if (phase >= qEnd && phase < rEnd) {
        const rPhase = (phase - qEnd) / (rEnd - qEnd);
        return baseline - qVal - (rPhase * (rVal - qVal));
      }

      // S-wave
      if (phase >= rEnd && phase < sEnd) {
        const sPhase = (phase - rEnd) / (sEnd - rEnd);
        return baseline - rVal + (sPhase * (rVal - sVal));
      }

      // ST segment
      if (phase >= sEnd && phase < stEnd) {
        const stPhase = (phase - sEnd) / (stEnd - sEnd);
        return baseline - sVal - (stPhase * (sVal + stElev));
      }

      // T-wave
      if (phase >= stEnd && phase < tEnd) {
        const tPhase = (phase - stEnd) / (tEnd - stEnd);
        return baseline - stElev - Math.sin(tPhase * Math.PI) * (14 + tOffset);
      }

      return baseline;
    };

    let time = 0;
    const animate = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      drawGrid();

      const val = generateECGValue(time);
      tracePoints.push(val);
      tracePoints.shift();

      ctx.strokeStyle = '#ef4444'; 
      ctx.lineWidth = 2.2;
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.4)';
      ctx.beginPath();
      ctx.moveTo(0, tracePoints[0]);

      for (let i = 1; i < width; i++) {
        ctx.lineTo(i, tracePoints[i]);
      }
      ctx.stroke();
      ctx.shadowBlur = 0; 

      time++;
      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [activeTab, ecgBpm, rhythmType, prInterval, qrsDuration, qtInterval]);

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
      <div className="flex border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold overflow-x-auto whitespace-nowrap scrollbar-none">
        <button
          onClick={() => setActiveTab('ranges')}
          className={`pb-3 px-4 transition-all border-b-2 cursor-pointer shrink-0 ${activeTab === 'ranges' ? 'border-medical-500 text-medical-600 dark:text-medical-400' : 'border-transparent text-slate-450 hover:text-slate-655'}`}
        >
          Reference Vitals Ranges
        </button>
        <button
          onClick={() => setActiveTab('guidelines')}
          className={`pb-3 px-4 transition-all border-b-2 cursor-pointer shrink-0 ${activeTab === 'guidelines' ? 'border-medical-500 text-medical-600 dark:text-medical-400' : 'border-transparent text-slate-450 hover:text-slate-655'}`}
        >
          Clinical Guidelines
        </button>
        <button
          onClick={() => setActiveTab('calculators')}
          className={`pb-3 px-4 transition-all border-b-2 cursor-pointer shrink-0 ${activeTab === 'calculators' ? 'border-medical-500 text-medical-600 dark:text-medical-400' : 'border-transparent text-slate-450 hover:text-slate-655'}`}
        >
          Utility Calculators
        </button>
        <button
          onClick={() => setActiveTab('ecg')}
          className={`pb-3 px-4 transition-all border-b-2 cursor-pointer shrink-0 ${activeTab === 'ecg' ? 'border-medical-500 text-medical-600 dark:text-medical-400' : 'border-transparent text-slate-450 hover:text-slate-655'}`}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
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
                  <FaHeart className="text-rose-500" />
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
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-semibold text-[10px] text-slate-555">
                  <span>Relative Status:</span>
                  <span>
                    {heartAgeDiff > 0 
                      ? `⚠️ Heart is ${heartAgeDiff} years older` 
                      : `✅ Heart is ${Math.abs(heartAgeDiff)} years younger`}
                  </span>
                </div>
              </div>
            </div>

            {/* Framingham 10-Year Cardiovascular Disease Risk Score Calculator */}
            <div className="glass-card rounded-2xl p-5 border border-slate-150 dark:border-slate-850 space-y-4 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-3">
                  <FaVials className="text-sky-505" />
                  Framingham 10-Year CVD Risk
                </h3>

                <div className="space-y-2 text-[9px] font-semibold text-slate-700 dark:text-slate-350">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="block mb-0.5 text-slate-450 font-bold">Age: {fage} yrs</span>
                      <input
                        type="range"
                        min="30"
                        max="79"
                        value={fage}
                        onChange={(e) => setFage(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-lg accent-medical-500 cursor-pointer"
                      />
                    </div>
                    <div>
                      <span className="block mb-0.5 text-slate-450 font-bold">Systolic BP: {fsbp}</span>
                      <input
                        type="range"
                        min="90"
                        max="200"
                        value={fsbp}
                        onChange={(e) => setFsbp(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-lg accent-medical-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <span className="block mb-0.5 text-slate-450 font-bold">HDL Chol: {fhdl}</span>
                      <input
                        type="range"
                        min="20"
                        max="100"
                        value={fhdl}
                        onChange={(e) => setFhdl(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-lg accent-medical-500 cursor-pointer"
                      />
                    </div>
                    <div className="col-span-1">
                      <span className="block mb-0.5 text-slate-450 font-bold">Total Chol: {fchol}</span>
                      <input
                        type="range"
                        min="100"
                        max="400"
                        value={fchol}
                        onChange={(e) => setFchol(parseInt(e.target.value))}
                        className="w-full h-1 bg-slate-200 dark:bg-slate-850 rounded-lg accent-medical-500 cursor-pointer"
                      />
                    </div>
                    <div className="col-span-1">
                      <span className="block mb-0.5 text-slate-450 font-bold">Sex</span>
                      <select
                        value={fsex}
                        onChange={(e) => setFsex(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-200 dark:border-slate-750 dark:bg-slate-800 text-[10px]"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-1 font-bold">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={ftreated} onChange={(e) => setFtreated(e.target.checked)} className="accent-medical-500" />
                      <span>BP Treated</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={fsmoker} onChange={(e) => setFsmoker(e.target.checked)} className="accent-medical-500" />
                      <span>Smoker</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input type="checkbox" checked={fdiabetic} onChange={(e) => setFdiabetic(e.target.checked)} className="accent-medical-500" />
                      <span>Diabetic</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 rounded-xl text-[11px] space-y-2 mt-4 text-slate-705 dark:text-slate-300 font-bold">
                <div className="flex justify-between">
                  <span>CVD 10-Year Risk:</span>
                  <span className={`font-extrabold ${fRisk >= 20 ? 'text-rose-500' : fRisk >= 10 ? 'text-amber-500' : 'text-emerald-500'}`}>{fRisk}%</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-semibold text-[10px] text-slate-555">
                  <span>Risk Category:</span>
                  <span>
                    {fRisk >= 20 
                      ? '🔴 High Risk (>20%)' 
                      : fRisk >= 10 
                        ? '🟡 Intermediate (10%-20%)' 
                        : '🟢 Low Risk (<10%)'}
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
                  className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${rhythmType === 'normal' ? 'bg-slate-800 text-white border-slate-850' : 'bg-white text-slate-655 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'}`}
                >
                  Normal Sinus
                </button>
                <button
                  onClick={() => setRhythmType('st_elevation')}
                  className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${rhythmType === 'st_elevation' ? 'bg-slate-800 text-white border-slate-850' : 'bg-white text-slate-655 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'}`}
                >
                  ST Elevation
                </button>
                <button
                  onClick={() => setRhythmType('lvh')}
                  className={`px-3 py-1.5 rounded-lg border transition cursor-pointer ${rhythmType === 'lvh' ? 'bg-slate-800 text-white border-slate-850' : 'bg-white text-slate-655 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300'}`}
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

            {/* Rhythm Parameters Sliders Block */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pt-3.5 border-t border-slate-100 dark:border-slate-800">
              {/* Heart Rate */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-550">
                  <span>Heart Rate:</span>
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

              {/* PR Interval */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-550">
                  <span>PR Interval:</span>
                  <span className="text-sky-500">{(prInterval * 1000).toFixed(0)} ms</span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.25"
                  step="0.01"
                  value={prInterval}
                  onChange={(e) => setPrInterval(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
                />
              </div>

              {/* QRS Duration */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-550">
                  <span>QRS Duration:</span>
                  <span className="text-emerald-500">{(qrsDuration * 1000).toFixed(0)} ms</span>
                </div>
                <input
                  type="range"
                  min="0.02"
                  max="0.12"
                  step="0.01"
                  value={qrsDuration}
                  onChange={(e) => setQrsDuration(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
                />
              </div>

              {/* QT Interval */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-550">
                  <span>QT Interval:</span>
                  <span className="text-purple-500">{(qtInterval * 1000).toFixed(0)} ms</span>
                </div>
                <input
                  type="range"
                  min="0.20"
                  max="0.55"
                  step="0.01"
                  value={qtInterval}
                  onChange={(e) => setQtInterval(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-500"
                />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Toolkit;
