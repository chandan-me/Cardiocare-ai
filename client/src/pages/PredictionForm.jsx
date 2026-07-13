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
  FaArrowRight,
  FaRegFileAlt,
  FaUpload,
  FaBrain,
  FaFileDownload
} from 'react-icons/fa';

const PredictionForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('demographics');
  
  // Intake intelligence hub
  const [intakeMode, setIntakeMode] = useState('notes'); // 'notes' or 'ocr'
  const [rawNotes, setRawNotes] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);

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

  const handleDownloadTemplate = async () => {
    try {
      Swal.fire({
        title: 'Generating Template...',
        text: 'Preparing your clinical PDF checklist.',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const response = await api.get('/download-template', {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Cardiocare_Intake_Checklist_Template.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      Swal.close();
    } catch (err) {
      console.error('Failed to download template:', err);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: err.response?.data?.error || 'Could not download the clinical template. Please check connection.'
      });
    }
  };

  const handleOCRUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire('File Too Large', 'Please select an image smaller than 2MB.', 'error');
      return;
    }

    setOcrLoading(true);
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const base64Data = uploadEvent.target.result;
      const mimeType = file.type;
      
      try {
        Swal.fire({
          title: 'Reading Lab Report Scan...',
          text: 'Gemini Multimodal is analyzing the document image.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await api.post('/predict-ocr', { 
          image: base64Data, 
          mimeType 
        });

        Swal.close();
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
            title: 'OCR Scan Completed',
            text: 'Extracted credentials and 11 cardiac parameters into the form below.',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        }
      } catch (err) {
        Swal.close();
        console.error('OCR Extraction error:', err);
        Swal.fire('OCR Parsing Failed', 'Could not read parameters from the image. Ensure the text is clear.', 'error');
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveOffline = (data) => {
    const offlineList = JSON.parse(localStorage.getItem('offline_predictions') || '[]');
    const newOffline = {
      ...data,
      id: `offline-${Date.now()}`,
      created_at: new Date().toISOString(),
      result: 'Pending (Offline)',
      confidence: '0.0',
      isOffline: true
    };
    
    offlineList.push(newOffline);
    localStorage.setItem('offline_predictions', JSON.stringify(offlineList));

    Swal.fire({
      icon: 'info',
      title: 'Offline Mode Active',
      text: 'Cardiac risk screening cached locally. It will auto-sync to the database once connection is restored.',
      confirmButtonText: 'View History Logs'
    }).then(() => {
      navigate('/dashboard/history');
    });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    
    // Check if offline
    if (!navigator.onLine) {
      handleSaveOffline(data);
      setLoading(false);
      return;
    }

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
      navigate('/dashboard/predict/result', { state: { result: response.data, inputData: data } });
    } catch (err) {
      Swal.close();
      
      // Offline fallback on network error
      if (err.message === 'Network Error' || !err.response) {
        handleSaveOffline(data);
      } else {
        const errorMessage = err.response?.data?.error || 'Diagnostic evaluation failed.';
        Swal.fire({
          icon: 'error',
          title: 'Evaluation Failed',
          text: errorMessage,
          confirmButtonColor: '#ef4444'
        });
      }
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

      {/* AI Patient Intake Intelligence Hub */}
      <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <FaBrain className="text-medical-500 animate-pulse h-4 w-4" />
            Clinical Intake Intelligence Hub
          </h3>
          
          {/* Mode Tabs */}
          <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setIntakeMode('notes')}
              className={`px-3 py-1 rounded-md cursor-pointer transition ${intakeMode === 'notes' ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 shadow-sm' : 'text-slate-450'}`}
            >
              Paste Notes
            </button>
            <button
              type="button"
              onClick={() => setIntakeMode('ocr')}
              className={`px-3 py-1 rounded-md cursor-pointer transition ${intakeMode === 'ocr' ? 'bg-white dark:bg-slate-900 text-slate-850 dark:text-slate-100 shadow-sm' : 'text-slate-450'}`}
            >
              Upload Document Scan (OCR)
            </button>
          </div>
        </div>

        {/* Tab A: Paste Notes */}
        {intakeMode === 'notes' && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Paste raw clinician notes or intake summaries. The AI will parse details and auto-fill the forms instantly.
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
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Extracting...
                  </>
                ) : (
                  'Extract Variables'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Tab B: Upload Scan (OCR) */}
        {intakeMode === 'ocr' && (
          <div className="space-y-3">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Upload a picture of a laboratory report, ECG read-sheet, or medical slip. Gemini Multimodal will extract the cardiac parameters directly.
            </p>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800 gap-2">
              <span className="text-[10px] text-slate-550 dark:text-slate-400 font-bold leading-normal">Need an intake checklist? Print the standard templated clinical slip.</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-655 text-white font-bold rounded-lg text-[9px] cursor-pointer transition flex items-center gap-1 shrink-0 self-stretch sm:self-auto justify-center"
              >
                <FaFileDownload /> Download PDF Form
              </button>
            </div>
            <div className="flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-850 rounded-xl p-5 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition cursor-pointer relative group">
              <input
                type="file"
                accept="image/*"
                onChange={handleOCRUpload}
                disabled={ocrLoading}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="text-center space-y-2">
                <FaUpload className="mx-auto h-6 w-6 text-slate-400 group-hover:text-medical-500 transition" />
                <span className="block text-xs font-bold text-slate-700 dark:text-slate-350">
                  {ocrLoading ? 'Scanning Document...' : 'Choose Lab Report Scan Image'}
                </span>
                <span className="block text-[9px] text-slate-400">JPEG, PNG, or GIF up to 2MB</span>
              </div>
            </div>
          </div>
        )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Chest Pain Type (cp) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Chest Pain Type
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('cp')}
              >
                <option value="0">Typical Angina (0)</option>
                <option value="1">Atypical Angina (1)</option>
                <option value="2">Non-Anginal Pain (2)</option>
                <option value="3">Asymptomatic (3)</option>
              </select>
            </div>

            {/* Resting Blood Pressure (trestbps) */}
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
                  required: 'Blood pressure is required',
                  min: { value: 50, message: 'Minimum BP is 50' },
                  max: { value: 250, message: 'Maximum BP is 250' }
                })}
              />
              {errors.trestbps && <p className="text-xs text-red-500 font-semibold">{errors.trestbps.message}</p>}
            </div>

            {/* Serum Cholesterol (chol) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Serum Cholesterol (mg/dl)
              </label>
              <input
                type="number"
                placeholder="e.g. 233"
                className={`w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/50 transition-all ${
                  errors.chol ? 'border-red-500' : 'border-slate-200 dark:border-slate-750'
                }`}
                {...register('chol', { 
                  required: 'Cholesterol is required',
                  min: { value: 50, message: 'Minimum cholesterol is 50' },
                  max: { value: 600, message: 'Maximum cholesterol is 600' }
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
                <option value="0">False (Normal Sugar)</option>
                <option value="1">True (Elevated Sugar)</option>
              </select>
            </div>
          </div>
        )}

        {/* TAB 3: Diagnostic Labs */}
        {activeTab === 'labs' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
            {/* Resting ECG (restecg) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Resting Electrocardiographic Results
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('restecg')}
              >
                <option value="0">Normal (0)</option>
                <option value="1">ST-T Wave Abnormality (1)</option>
                <option value="2">Left Ventricular Hypertrophy (2)</option>
              </select>
            </div>

            {/* Max Heart Rate (thalach) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Maximum Heart Rate Achieved (bpm)
              </label>
              <input
                type="number"
                placeholder="e.g. 150"
                className={`w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/50 transition-all ${
                  errors.thalach ? 'border-red-500' : 'border-slate-200 dark:border-slate-750'
                }`}
                {...register('thalach', { 
                  required: 'Max heart rate is required',
                  min: { value: 60, message: 'Minimum HR is 60' },
                  max: { value: 220, message: 'Maximum HR is 220' }
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
                <option value="0">No (0)</option>
                <option value="1">Yes (1)</option>
              </select>
            </div>

            {/* Old Peak (oldpeak) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                ST Depression Oldpeak (induced by exercise relative to rest)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 1.0"
                className={`w-full px-4 py-3 rounded-xl border bg-white/50 dark:bg-slate-850 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500/50 transition-all ${
                  errors.oldpeak ? 'border-red-500' : 'border-slate-200 dark:border-slate-750'
                }`}
                {...register('oldpeak', { 
                  required: 'Oldpeak is required',
                  min: { value: 0.0, message: 'Minimum oldpeak is 0.0' },
                  max: { value: 10.0, message: 'Maximum oldpeak is 10.0' }
                })}
              />
              {errors.oldpeak && <p className="text-xs text-red-500 font-semibold">{errors.oldpeak.message}</p>}
            </div>

            {/* ST Slope (slope) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Slope of the Peak Exercise ST Segment
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('slope')}
              >
                <option value="0">Upsloping (0)</option>
                <option value="1">Flat (1)</option>
                <option value="2">Downsloping (2)</option>
              </select>
            </div>

            {/* Vessels (ca) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Number of Major Vessels Colored by Flourosopy (0-4)
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('ca')}
              >
                <option value="0">0 Vessels Colored</option>
                <option value="1">1 Vessel Colored</option>
                <option value="2">2 Vessels Colored</option>
                <option value="3">3 Vessels Colored</option>
                <option value="4">4 Vessels (Uncertainty)</option>
              </select>
            </div>

            {/* Thalassemia (thal) */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                Thalassemia Classification (Thal)
              </label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-850 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500/50"
                {...register('thal')}
              >
                <option value="0">Normal Defect / Unknown (0)</option>
                <option value="1">Fixed Defect (1)</option>
                <option value="2">Normal (2)</option>
                <option value="3">Reversable Defect (3)</option>
              </select>
            </div>
          </div>
        )}

        {/* Tab Navigation buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (activeTab === 'labs') setActiveTab('vitals');
              else if (activeTab === 'vitals') setActiveTab('demographics');
            }}
            disabled={activeTab === 'demographics'}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-850 text-slate-650 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer select-none"
          >
            Back
          </button>
          
          {activeTab !== 'labs' ? (
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'demographics') setActiveTab('vitals');
                else if (activeTab === 'vitals') setActiveTab('labs');
              }}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              Continue <FaArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-medical-600 to-sky-500 hover:from-medical-700 hover:to-sky-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition active:scale-98 shadow-md hover:shadow-medical-100 dark:hover:shadow-none cursor-pointer"
            >
              {loading ? 'Running AI Assessment...' : 'Run Diagnostics'}
            </button>
          )}
        </div>

      </form>

    </div>
  );
};

export default PredictionForm;
