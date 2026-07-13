import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
  FaUser, 
  FaHeartbeat, 
  FaVials, 
  FaHeart,
  FaFileMedicalAlt,
  FaArrowRight
} from 'react-icons/fa';

const PredictionForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('demographics');

  const [rawNotes, setRawNotes] = useState('');
  const [extracting, setExtracting] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      patient_name: '',
      age: '',
      gender: '1',
      cp: '0',
      trestbps: '',
      chol: '',
      fbs: '0',
      restecg: '0',
      thalach: '',
      exang: '0',
      oldpeak: '',
      slope: '1',
      ca: '0',
      thal: '2'
    }
  });

  const handleExtractWithAI = async () => {
    if (!rawNotes.trim() || extracting) return;
    setExtracting(true);

    try {
      const response = await api.post('/predict-extract', { notes: rawNotes });
      const ext = response.data.extracted;

      if (ext) {
        setValue('patient_name', ext.patient_name || '');
        setValue('age', ext.age?.toString() || '');
        setValue('gender', ext.sex?.toString() || '1');
        setValue('cp', ext.cp?.toString() || '0');
        setValue('trestbps', ext.trestbps?.toString() || '');
        setValue('chol', ext.chol?.toString() || '');
        setValue('fbs', ext.fbs?.toString() || '0');
        setValue('restecg', ext.restecg?.toString() || '0');
        setValue('thalach', ext.thalach?.toString() || '');
        setValue('exang', ext.exang?.toString() || '0');
        setValue('oldpeak', ext.oldpeak?.toString() || '');
        setValue('slope', ext.slope?.toString() || '1');
        setValue('ca', ext.ca?.toString() || '0');
        setValue('thal', ext.thal?.toString() || '2');

        Swal.fire({
          icon: 'success',
          title: 'Extraction Completed',
          text: 'Patient parameters have been extracted and loaded into the tabs below.',
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      }
    } catch (err) {
      console.error('Failed to extract patient notes:', err);
      Swal.fire({
        icon: 'error',
        title: 'Extraction Failed',
        text: 'Could not extract clinical parameters. Verify backend server connections.'
      });
    } finally {
      setExtracting(false);
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      Swal.fire({
        title: 'Running AI Diagnostics...',
        text: 'Analyzing clinical metrics and generating recommendations.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await api.post('/predict', data);
      
      Swal.close();
      
      // Navigate to the results page, passing the prediction details in route state
      navigate('/dashboard/predict/result', { state: { result: response.data, inputData: data } });

    } catch (err) {
      Swal.close();
      const errorMessage = err.response?.data?.error || 'Diagnostic evaluation failed. Ensure the ML backend is online.';
      Swal.fire({
        icon: 'error',
        title: 'Evaluation Failed',
        text: errorMessage,
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'demographics', label: '1. Demographics', icon: FaUser },
    { id: 'vitals', label: '2. Cardiac Vitals', icon: FaHeartbeat },
    { id: 'labs', label: '3. Diagnostic Labs', icon: FaVials }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <FaFileMedicalAlt className="text-medical-500 h-7 w-7" />
          Cardiac Risk Screening Form
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Complete the medical parameters below. Fields will be validated to run predictions.
        </p>
      </div>

      {/* AI Patient Notes Assistant (Optional) */}
      <div className="glass-card rounded-2xl p-5 border border-slate-150 dark:border-slate-850 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-medical-500 animate-ping shrink-0"></span>
          ✨ AI Patient Notes Assistant (Optional)
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Paste unstructured patient clinical notes or intake transcripts. The AI will extract variables and auto-fill the forms instantly.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            placeholder="e.g. Patient John presents with atypical angina. He is 54 years old. Resting BP is 135, serum cholesterol is 210. Maximum heart rate is 140. ECG shows left ventricular hypertrophy..."
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            className="flex-1 min-h-[70px] p-3 text-xs rounded-xl border border-slate-200 bg-white dark:border-slate-750 dark:bg-slate-900 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-medical-500 resize-y"
          />
          <button
            type="button"
            onClick={handleExtractWithAI}
            disabled={extracting || !rawNotes.trim()}
            className="px-4 py-3 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-650 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer self-stretch sm:self-end"
          >
            {extracting ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Extracting...
              </>
            ) : (
              'Extract Variables'
            )}
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-200 dark:border-slate-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 font-semibold text-sm transition-colors cursor-pointer ${
              activeTab === tab.id
                ? 'border-medical-500 text-medical-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-850 dark:hover:text-slate-350'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form Container */}
      <form onSubmit={handleSubmit(onSubmit)} className="glass-card rounded-2xl p-8 border border-slate-150 dark:border-slate-800 space-y-6">
        
        {/* TAB 1: Demographics */}
        {activeTab === 'demographics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Patient Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Patient Full Name
              </label>
              <input
                type="text"
                placeholder="Jane Doe"
                className={`w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/50 transition-all ${
                  errors.patient_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-750'
                }`}
                {...register('patient_name', { required: 'Patient name is required' })}
              />
              {errors.patient_name && <p className="text-xs text-red-500 font-semibold">{errors.patient_name.message}</p>}
            </div>

            {/* Patient Age */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Age (Years)
              </label>
              <input
                type="number"
                placeholder="e.g. 54"
                className={`w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/50 transition-all ${
                  errors.age ? 'border-red-500' : 'border-slate-200 dark:border-slate-750'
                }`}
                {...register('age', { 
                  required: 'Age is required', 
                  min: { value: 1, message: 'Minimum age is 1' },
                  max: { value: 120, message: 'Maximum age is 120' }
                })}
              />
              {errors.age && <p className="text-xs text-red-500 font-semibold">{errors.age.message}</p>}
            </div>

            {/* Gender */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Biological Sex
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('gender')}
              >
                <option value="1">Male</option>
                <option value="0">Female</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 2: Vitals */}
        {activeTab === 'vitals' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chest Pain Type (cp) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Chest Pain Type
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('cp')}
              >
                <option value="0">Typical Angina (Squeezing, heavy discomfort)</option>
                <option value="1">Atypical Angina (Sharp, brief discomfort)</option>
                <option value="2">Non-Anginal Pain (Traced to respiratory/digestive)</option>
                <option value="3">Asymptomatic (No typical cardiac pain reported)</option>
              </select>
            </div>

            {/* Resting BP (trestbps) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Resting Blood Pressure (mmHg)
              </label>
              <input
                type="number"
                placeholder="e.g. 130"
                className={`w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/50 transition-all ${
                  errors.trestbps ? 'border-red-500' : 'border-slate-200 dark:border-slate-750'
                }`}
                {...register('trestbps', {
                  required: 'Resting BP is required',
                  min: { value: 50, message: 'Minimum is 50 mmHg' },
                  max: { value: 300, message: 'Maximum is 300 mmHg' }
                })}
              />
              {errors.trestbps && <p className="text-xs text-red-500 font-semibold">{errors.trestbps.message}</p>}
            </div>

            {/* Max Heart Rate (thalach) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Maximum Heart Rate (bpm)
              </label>
              <input
                type="number"
                placeholder="e.g. 150"
                className={`w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/50 transition-all ${
                  errors.thalach ? 'border-red-500' : 'border-slate-200 dark:border-slate-750'
                }`}
                {...register('thalach', {
                  required: 'Max heart rate is required',
                  min: { value: 50, message: 'Minimum is 50 bpm' },
                  max: { value: 250, message: 'Maximum is 250 bpm' }
                })}
              />
              {errors.thalach && <p className="text-xs text-red-500 font-semibold">{errors.thalach.message}</p>}
            </div>

            {/* Exercise Angina (exang) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Exercise Induced Angina
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('exang')}
              >
                <option value="0">No (Angina not triggered by mild exercise)</option>
                <option value="1">Yes (Physical load causes chest pressure)</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 3: Labs */}
        {activeTab === 'labs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cholesterol (chol) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Serum Cholesterol (mg/dl)
              </label>
              <input
                type="number"
                placeholder="e.g. 220"
                className={`w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/50 transition-all ${
                  errors.chol ? 'border-red-500' : 'border-slate-200 dark:border-slate-750'
                }`}
                {...register('chol', {
                  required: 'Cholesterol level is required',
                  min: { value: 50, message: 'Minimum is 50 mg/dl' },
                  max: { value: 600, message: 'Maximum is 600 mg/dl' }
                })}
              />
              {errors.chol && <p className="text-xs text-red-500 font-semibold">{errors.chol.message}</p>}
            </div>

            {/* Fasting Blood Sugar (fbs) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Fasting Blood Sugar &gt; 120 mg/dl
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('fbs')}
              >
                <option value="0">False (Fasting blood sugar &lt;= 120 mg/dl)</option>
                <option value="1">True (Fasting blood sugar &gt; 120 mg/dl)</option>
              </select>
            </div>

            {/* Rest ECG (restecg) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Resting Electrocardiographic Results
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('restecg')}
              >
                <option value="0">Normal ECG tracing</option>
                <option value="1">ST-T Wave Abnormality (T wave inversions / ST elevations)</option>
                <option value="2">Left Ventricular Hypertrophy (Est. by Estes' criteria)</option>
              </select>
            </div>

            {/* Old Peak (oldpeak) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                ST Depression (Oldpeak ST)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 1.8"
                className={`w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/50 transition-all ${
                  errors.oldpeak ? 'border-red-500' : 'border-slate-200 dark:border-slate-750'
                }`}
                {...register('oldpeak', {
                  required: 'ST depression metric is required',
                  min: { value: 0.0, message: 'Minimum is 0.0' },
                  max: { value: 10.0, message: 'Maximum is 10.0' }
                })}
              />
              {errors.oldpeak && <p className="text-xs text-red-500 font-semibold">{errors.oldpeak.message}</p>}
            </div>

            {/* Slope (slope) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Slope of Peak Exercise ST
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('slope')}
              >
                <option value="0">Upsloping (Typical healthy performance)</option>
                <option value="1">Flat (Signs of reduced coronary circulation)</option>
                <option value="2">Downsloping (High indicator of ischemia)</option>
              </select>
            </div>

            {/* CA (ca) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Number of Major Vessels Colored (CA)
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('ca')}
              >
                <option value="0">0 vessels colored by fluoroscopy</option>
                <option value="1">1 major vessel</option>
                <option value="2">2 major vessels</option>
                <option value="3">3 major vessels</option>
                <option value="4">4 major vessels</option>
              </select>
            </div>

            {/* Thal (thal) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Thalassemia (Thal) Status
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('thal')}
              >
                <option value="1">Normal (No thalassemia markers)</option>
                <option value="2">Fixed Defect (Steady, non-expanding perfusion defect)</option>
                <option value="3">Reversible Defect (Defect expands during stress and returns to normal)</option>
                <option value="0">Other / Unregistered</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab Navigation Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-slate-150 dark:border-slate-750">
          <div>
            {activeTab !== 'demographics' && (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'labs') setActiveTab('vitals');
                  else if (activeTab === 'vitals') setActiveTab('demographics');
                }}
                className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-sm"
              >
                Back
              </button>
            )}
          </div>

          <div>
            {activeTab !== 'labs' ? (
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'demographics') setActiveTab('vitals');
                  else if (activeTab === 'vitals') setActiveTab('labs');
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-semibold hover:bg-slate-900 transition flex items-center gap-2 cursor-pointer text-sm"
              >
                Next Step
                <FaArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-medical-600 to-rose-500 text-white font-bold shadow-lg shadow-medical-500/10 hover:shadow-rose-500/10 hover:scale-101 transition flex items-center gap-2 cursor-pointer text-sm"
              >
                Run Risk Analysis
                <FaHeart className="h-4 w-4 animate-pulse" />
              </button>
            )}
          </div>
        </div>

      </form>
    </div>
  );
};

export default PredictionForm;
