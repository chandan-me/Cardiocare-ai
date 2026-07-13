import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
  FaUser, 
  FaEnvelope, 
  FaShieldAlt, 
  FaHospital, 
  FaStethoscope, 
  FaIdCard, 
  FaCamera, 
  FaTrashAlt, 
  FaCheckCircle, 
  FaLock, 
  FaChartLine,
  FaPhone,
  FaEdit,
  FaSave,
  FaTimes
} from 'react-icons/fa';

const Profile = () => {
  const { user, updateProfile } = useAuth();
  const [stats, setStats] = useState({ total: 0, highRisk: 0, avgConfidence: 0 });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    institution: '',
    specialization: '',
    license: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        institution: user.institution || '',
        specialization: user.specialization || '',
        license: user.license || ''
      });
    }
  }, [user]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/predictions', {
          params: { page: 1, limit: 1000 }
        });
        const preds = response.data.predictions || [];
        const total = preds.length;
        const highRisk = preds.filter(p => p.result === 'High Risk').length;
        const totalConfidence = preds.reduce((acc, p) => acc + parseFloat(p.confidence || 0), 0);
        const avgConfidence = total > 0 ? (totalConfidence / total).toFixed(1) : 0;
        
        setStats({ total, highRisk, avgConfidence });
      } catch (err) {
        console.error('Error calculating profile stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Please select an image smaller than 1.5MB.'
      });
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const base64Data = uploadEvent.target.result;
      try {
        await api.put('/auth/avatar', { avatar: base64Data });
        updateProfile({ avatar: base64Data });
        
        Swal.fire({
          icon: 'success',
          title: 'Avatar Updated',
          text: 'Your profile picture has been updated.',
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });
      } catch (err) {
        console.error('Failed to upload avatar:', err);
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: 'Server error while saving avatar.'
        });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = async () => {
    Swal.fire({
      title: 'Remove Profile Picture?',
      text: 'This will reset your avatar back to the default initials logo.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.put('/auth/avatar', { avatar: null });
          updateProfile({ avatar: null });
          Swal.fire({
            icon: 'success',
            title: 'Avatar Removed',
            text: 'Your profile picture has been removed.',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
        } catch (err) {
          console.error('Failed to remove avatar:', err);
          Swal.fire({
            icon: 'error',
            title: 'Action Failed',
            text: 'Could not remove profile picture.'
          });
        }
      }
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      Swal.fire('Error', 'Name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      const response = await api.put('/auth/profile', formData);
      updateProfile(response.data.user);
      setIsEditing(false);

      Swal.fire({
        icon: 'success',
        title: 'Profile Updated',
        text: 'Your clinical details have been saved successfully.',
        timer: 1800,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (err) {
      console.error('Failed to save profile:', err);
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.error || 'Server error while saving profile details.'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">
          User Profile
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your clinical user credentials and application access details.
        </p>
      </div>

      {/* Main Profile Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Avatar & Main Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 flex flex-col items-center text-center space-y-4">
            
            {/* Avatar Container with Hover Upload */}
            <div className="relative group">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Profile" 
                  className="h-24 w-24 rounded-full object-cover ring-4 ring-medical-100 dark:ring-slate-800 shadow-lg"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-medical-500 to-sky-500 text-white flex items-center justify-center font-display font-extrabold text-4xl ring-4 ring-medical-100 dark:ring-slate-800 shadow-lg">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              )}
              
              {/* Overlay on hover */}
              <label 
                htmlFor="avatar-upload-input"
                className="absolute inset-0 bg-black/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-250 cursor-pointer text-[10px] font-bold"
              >
                <FaCamera className="h-5 w-5 mb-1" />
                <span>UPLOAD</span>
              </label>

              <input 
                type="file" 
                id="avatar-upload-input"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={uploading}
              />
            </div>

            <div className="space-y-1">
              <h2 className="font-display font-bold text-lg text-slate-800 dark:text-slate-100">{user?.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>

            <div className="flex flex-col gap-2 w-full items-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/50">
                <FaShieldAlt className="h-3 w-3" />
                {user?.role === 'admin' ? 'Administrator' : 'Clinical User'}
              </div>

              {user?.avatar && (
                <button
                  onClick={handleRemoveAvatar}
                  className="mt-2 text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition active:scale-95"
                >
                  <FaTrashAlt className="h-3 w-3" />
                  Remove Photo
                </button>
              )}
            </div>
          </div>

          {/* Quick Statistics Widget */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <FaChartLine className="text-medical-500" />
              Clinical Performance
            </h3>
            
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="block text-xl font-extrabold text-slate-800 dark:text-slate-150">
                  {loading ? '...' : stats.total}
                </span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Total</span>
              </div>
              <div className="bg-rose-50 dark:bg-rose-950/10 p-2.5 rounded-xl border border-rose-100 dark:border-rose-900/20">
                <span className="block text-xl font-extrabold text-rose-600 dark:text-rose-400">
                  {loading ? '...' : stats.highRisk}
                </span>
                <span className="text-[10px] text-rose-400 font-bold uppercase tracking-tight text-center">Risk</span>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-950/10 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                <span className="block text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {loading ? '...' : stats.avgConfidence}%
                </span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-tight">Avg Conf</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Account Details & Permissions */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Account Details Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100">
                Account Information
              </h3>
              
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <FaEdit className="h-3 w-3" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-medical-500 text-white hover:bg-medical-600 transition flex items-center gap-1 cursor-pointer"
                  >
                    <FaSave className="h-3 w-3" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: user?.name || '',
                        phone: user?.phone || '',
                        institution: user?.institution || '',
                        specialization: user?.specialization || '',
                        license: user?.license || ''
                      });
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
                  >
                    <FaTimes className="h-3 w-3" />
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Full Name */}
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <FaUser className="text-slate-400 shrink-0" />
                <div className="flex flex-col w-full">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Full Name</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full mt-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500"
                      required
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-slate-150 mt-0.5 text-xs">{user?.name}</span>
                  )}
                </div>
              </div>

              {/* Email (Always Read-Only) */}
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 opacity-70">
                <FaEnvelope className="text-slate-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Email Address</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-150 mt-0.5 text-xs">{user?.email}</span>
                </div>
              </div>

              {/* Phone Number */}
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <FaPhone className="text-slate-400 shrink-0" />
                <div className="flex flex-col w-full">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Phone Number</span>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full mt-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-slate-150 mt-0.5 text-xs">{user?.phone || 'Not Configured'}</span>
                  )}
                </div>
              </div>

              {/* Institution */}
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <FaHospital className="text-slate-400 text-base shrink-0" />
                <div className="flex flex-col w-full">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Institution</span>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="e.g. St. John's Medical Center"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full mt-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-slate-150 mt-0.5 text-xs">{user?.institution || 'Not Configured'}</span>
                  )}
                </div>
              </div>

              {/* Clinical Specialization */}
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <FaStethoscope className="text-slate-400 text-base shrink-0" />
                <div className="flex flex-col w-full">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Clinical Specialization</span>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="e.g. Cardiology Department"
                      value={formData.specialization}
                      onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                      className="w-full mt-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-slate-150 mt-0.5 text-xs">{user?.specialization || 'Not Configured'}</span>
                  )}
                </div>
              </div>

              {/* Practitioner License */}
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <FaIdCard className="text-slate-400 text-base shrink-0" />
                <div className="flex flex-col w-full">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Practitioner License</span>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="e.g. MCI-408922"
                      value={formData.license}
                      onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                      className="w-full mt-1 px-2 py-1 text-xs border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500"
                    />
                  ) : (
                    <span className="font-semibold text-slate-800 dark:text-slate-150 mt-0.5 text-xs">{user?.license || 'Not Configured'}</span>
                  )}
                </div>
              </div>

              {/* System Role (Always Read-Only) */}
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 opacity-70">
                <FaShieldAlt className="text-slate-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">System Role</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-150 mt-0.5 text-xs capitalize">{user?.role || 'User'}</span>
                </div>
              </div>
            </form>
          </div>

          {/* System Permissions Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 pb-3 border-b border-slate-100 dark:border-slate-800">
              System Access Permissions
            </h3>

            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/35 dark:bg-slate-800/20 text-xs">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-350">Run Cardiac Risk Screenings</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 uppercase">Allowed</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/35 dark:bg-slate-800/20 text-xs">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-350">Access Clinical Assessment Records</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 uppercase">Allowed</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/35 dark:bg-slate-800/20 text-xs">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-500" />
                  <span className="font-semibold text-slate-700 dark:text-slate-350">Generate Gemini AI Recommendations</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 uppercase">Allowed</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/35 dark:bg-slate-800/20 text-xs">
                <div className="flex items-center gap-2">
                  {user?.role === 'admin' ? (
                    <FaCheckCircle className="text-emerald-500" />
                  ) : (
                    <FaLock className="text-slate-400" />
                  )}
                  <span className={`font-semibold ${user?.role === 'admin' ? 'text-slate-700 dark:text-slate-350' : 'text-slate-400 dark:text-slate-500'}`}>
                    Delete Assessment Records
                  </span>
                </div>
                {user?.role === 'admin' ? (
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/20 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 uppercase">Allowed</span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase">Restricted</span>
                )}
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Profile;
