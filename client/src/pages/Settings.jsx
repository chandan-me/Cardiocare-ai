import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
  FaMoon, 
  FaSun, 
  FaInfoCircle, 
  FaLock, 
  FaEye, 
  FaEyeSlash, 
  FaKey, 
  FaDesktop, 
  FaGlobe, 
  FaMapMarkerAlt 
} from 'react-icons/fa';

const Settings = () => {
  const { darkMode, toggleDarkMode, logout } = useAuth();
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Simulated Sessions List
  const [sessions, setSessions] = useState([
    { id: 1, device: 'Chrome Browser on Windows 11', ip: '122.172.84.195', location: 'Bengaluru, India', current: true },
    { id: 2, device: 'Vercel Edge Function Sync Service', ip: '34.201.8.11', location: 'Washington D.C., USA', current: false }
  ]);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      Swal.fire('Error', 'Please fill in all fields.', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      Swal.fire('Error', 'New passwords do not match.', 'error');
      return;
    }

    if (newPassword.length < 6) {
      Swal.fire('Error', 'New password must be at least 6 characters.', 'error');
      return;
    }

    setSaving(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword
      });

      Swal.fire({
        icon: 'success',
        title: 'Password Updated',
        text: 'Your security password has been changed successfully.',
        timer: 2000,
        showConfirmButton: false
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password change error:', err);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.response?.data?.error || 'Failed to change password. Check your current password.'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = (id) => {
    Swal.fire({
      title: 'Revoke Session?',
      text: 'This will instantly log that device out of Cardiocare AI.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, revoke session'
    }).then((result) => {
      if (result.isConfirmed) {
        setSessions(sessions.filter(s => s.id !== id));
        Swal.fire('Revoked', 'Session has been successfully terminated.', 'success');
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Customize UI layouts, theme selections, and clinical system security.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Side: Fast Customizations */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-6">
            
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-200 pb-2 border-b border-slate-100 dark:border-slate-800">
              Preferences
            </h3>
            
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-slate-700 dark:text-slate-350 text-xs">Interface Theme</span>
              <button
                onClick={toggleDarkMode}
                className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-xs font-semibold"
              >
                {darkMode ? (
                  <>
                    <span className="flex items-center gap-2">
                      <FaSun className="text-amber-500" />
                      Light Mode
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Active</span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-2">
                      <FaMoon className="text-indigo-400" />
                      Dark Mode
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Active</span>
                  </>
                )}
              </button>
            </div>

            <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/20 text-sky-700 dark:border-sky-900/40 dark:bg-sky-950/10 dark:text-sky-400 text-[11px] leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <FaInfoCircle className="h-3.5 w-3.5" />
                <span>Cardiocare Core v1.2.0</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Password Security & Sessions */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Security Password Change Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <FaLock className="text-medical-500" />
              Update Account Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Current Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                    <FaKey className="h-3.5 w-3.5" />
                  </span>
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2 text-xs border border-slate-200 dark:border-slate-750 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
                  >
                    {showCurrent ? <FaEyeSlash className="h-4.5 w-4.5" /> : <FaEye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              {/* Grid: New and Confirm Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <FaLock className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type={showNew ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 text-xs border border-slate-200 dark:border-slate-750 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(!showNew)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
                    >
                      {showNew ? <FaEyeSlash className="h-4.5 w-4.5" /> : <FaEye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Confirm New Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                      <FaLock className="h-3.5 w-3.5" />
                    </span>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Retype new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 text-xs border border-slate-200 dark:border-slate-750 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-medical-500 focus:border-medical-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 cursor-pointer"
                    >
                      {showConfirm ? <FaEyeSlash className="h-4.5 w-4.5" /> : <FaEye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-medical-500 hover:bg-medical-600 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-medical-100 dark:hover:shadow-none active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Updating Password...' : 'Change Password'}
                </button>
              </div>

            </form>
          </div>

          {/* Active Sessions Card */}
          <div className="glass-card rounded-2xl p-6 border border-slate-150 dark:border-slate-850 space-y-4">
            <h3 className="font-display font-bold text-sm text-slate-800 dark:text-slate-100 pb-2 border-b border-slate-100 dark:border-slate-800">
              Active Security Sessions
            </h3>

            <div className="space-y-3">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="flex items-center justify-between p-3.5 bg-slate-50/40 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FaDesktop className="text-slate-400 h-5 w-5" />
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800 dark:text-slate-150">{session.device}</span>
                        {session.current && (
                          <span className="px-1.5 py-0.5 text-[8px] font-extrabold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100 rounded dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1"><FaGlobe className="h-3 w-3" /> {session.ip}</span>
                        <span className="flex items-center gap-1"><FaMapMarkerAlt className="h-3 w-3" /> {session.location}</span>
                      </div>
                    </div>
                  </div>

                  {!session.current && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      className="px-2.5 py-1 text-[10px] font-bold text-rose-500 hover:text-rose-600 rounded bg-rose-50 hover:bg-rose-100 border border-rose-100/50 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/50 transition cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Settings;
