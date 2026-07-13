import React, { useState } from 'react';
import { 
  FaBookMedical, 
  FaHeartbeat, 
  FaInfoCircle, 
  FaExternalLinkAlt, 
  FaCalculator, 
  FaHeart,
  FaWeight
} from 'react-icons/fa';

const Toolkit = () => {
  const [activeTab, setActiveTab] = useState('ranges');
  
  // Interactive Target Heart Rate Calculator State
  const [calcAge, setCalcAge] = useState(45);
  const [calcRestingHr, setCalcRestingHr] = useState(70);
  
  // BMI State
  const [weight, setWeight] = useState(75); // kg
  const [height, setHeight] = useState(175); // cm

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FaBookMedical className="text-medical-500" />
          Clinical Reference Toolkit
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Medical guidelines, standard physiological vital range sheets, and clinical utility calculators.
        </p>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('ranges')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'ranges' ? 'border-medical-500 text-medical-600 dark:text-medical-400' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650'}`}
        >
          Reference Vitals Ranges
        </button>
        <button
          onClick={() => setActiveTab('guidelines')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'guidelines' ? 'border-medical-500 text-medical-600 dark:text-medical-400' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650'}`}
        >
          Clinical Guidelines
        </button>
        <button
          onClick={() => setActiveTab('calculators')}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${activeTab === 'calculators' ? 'border-medical-500 text-medical-600 dark:text-medical-400' : 'border-transparent text-slate-400 dark:text-slate-500 hover:text-slate-650'}`}
        >
          Utility Calculators
        </button>
      </div>

      {/* Tab 1: Reference Ranges */}
      {activeTab === 'ranges' && (
        <div className="space-y-6">
          {/* Blood Pressure Table */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-450">
                  <tr>
                    <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-450">Normal</td>
                    <td className="py-3">&lt; 120</td>
                    <td className="py-3">and &lt; 80</td>
                    <td className="py-3 text-slate-400">Encourage healthy lifestyle choices.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-amber-500">Elevated</td>
                    <td className="py-3">120 - 129</td>
                    <td className="py-3">and &lt; 80</td>
                    <td className="py-3 text-slate-400">Recommend non-pharmacologic therapy.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-orange-500">Stage 1 Hypertension</td>
                    <td className="py-3">130 - 139</td>
                    <td className="py-3">or 80 - 89</td>
                    <td className="py-3 text-slate-400">Assess ASCVD risk; consider medication if risk is high.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-rose-500">Stage 2 Hypertension</td>
                    <td className="py-3">&ge; 140</td>
                    <td className="py-3">or &ge; 90</td>
                    <td className="py-3 text-slate-400">Prescribe combination drug therapies; regular tracking.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Cholesterol Table */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4">
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
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-450">
                  <tr>
                    <td className="py-3 font-semibold text-emerald-600 dark:text-emerald-450">Desirable</td>
                    <td className="py-3">&lt; 200</td>
                    <td className="py-3">Optimal level; lower risk of cardiovascular disease.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-amber-500">Borderline High</td>
                    <td className="py-3">200 - 239</td>
                    <td className="py-3">Moderate elevation; diet adjustment advised.</td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-rose-500">High Risk</td>
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
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FaInfoCircle className="text-medical-500" />
              Major Cardiological Societies Guidelines
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-150">AHA / ACC Primary Prevention Guidelines</span>
                  <a href="https://www.ahajournals.org/doi/10.1161/CIR.0000000000000678" target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:underline flex items-center gap-1">
                    Read AHA Link <FaExternalLinkAlt className="h-2 w-2" />
                  </a>
                </div>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                  Focuses on non-pharmacological risk assessments (lifestyle counseling, physical activity, dietary patterns) as the foundation of cardiovascular disease prevention. Strongly advises prescribing statins for high-cholesterol adults age 40-75.
                </p>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-150">ESC Cardiovascular Prevention Guidelines</span>
                  <a href="https://academic.oup.com/eurheartj/article/42/34/3227/6358470" target="_blank" rel="noreferrer" className="text-[10px] text-sky-500 hover:underline flex items-center gap-1">
                    Read ESC Link <FaExternalLinkAlt className="h-2 w-2" />
                  </a>
                </div>
                <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed">
                  Applies the SCORE2 and SCORE2-OP algorithms to estimate 10-year risk of cardiovascular disease events in European regions. Highlights distinct thresholds depending on demographic age bands and country-specific baselines.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Utility Calculators */}
      {activeTab === 'calculators' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Target Heart Rate Calculator */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FaCalculator className="text-medical-500" />
              Target Heart Rate Zone
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
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
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
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

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs space-y-2 mt-4 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Estimated Max HR:</span>
                  <span className="font-bold">{maxHeartRate} bpm</span>
                </div>
                <div className="flex justify-between text-medical-600 dark:text-medical-400 font-bold border-t border-slate-200 dark:border-slate-800 pt-2">
                  <span>Target Zone (50%-85%):</span>
                  <span>{targetLower} - {targetUpper} bpm</span>
                </div>
              </div>
            </div>
          </div>

          {/* Body Mass Index (BMI) Calculator */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FaWeight className="text-medical-500" />
              BMI Clinical Index
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
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
                <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
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

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl text-xs space-y-2 mt-4 text-slate-700 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Calculated BMI:</span>
                  <span className="font-bold">{bmiVal} kg/m²</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2 font-bold">
                  <span>Weight Category:</span>
                  <span className={getBmiCategory(parseFloat(bmiVal)).color}>
                    {getBmiCategory(parseFloat(bmiVal)).label}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Toolkit;
