import React from 'react';
import { useAuth } from '../context/AuthContext';
import { FaMoon, FaSun, FaDesktop, FaInfoCircle } from 'react-icons/fa';

const Settings = () => {
  const { darkMode, toggleDarkMode } = useAuth();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">
          Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Customize UI layouts, theme selections, and clinical system properties.
        </p>
      </div>

      {/* Settings Panel */}
      <div className="glass-card rounded-2xl p-8 border border-slate-150 dark:border-slate-850 space-y-6">
        
        {/* Appearance Section */}
        <div className="space-y-4">
          <h3 className="font-display font-bold text-md text-slate-800 dark:text-slate-200">
            Interface Customization
          </h3>
          
          <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-850">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">Theme Selection</span>
              <p className="text-xs text-slate-400 mt-0.5">Toggle between clean light and dark medical screens.</p>
            </div>
            
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-850 transition cursor-pointer text-xs font-semibold"
            >
              {darkMode ? (
                <>
                  <FaSun className="text-amber-500" />
                  Light Mode
                </>
              ) : (
                <>
                  <FaMoon className="text-slate-400" />
                  Dark Mode
                </>
              )}
            </button>
          </div>
        </div>

        {/* System Diagnostics Info */}
        <div className="space-y-4 pt-6 border-t border-slate-150 dark:border-slate-850">
          <h3 className="font-display font-bold text-md text-slate-800 dark:text-slate-200">
            System Diagnostics
          </h3>

          <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/30 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/20 dark:text-sky-400 text-xs flex gap-3 leading-relaxed">
            <FaInfoCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Automated Risk Predictor v1.2.0</span>
              <p className="mt-1">
                The ML backend matches predictions on a Random Forest Classifier trained against historical cardiac parameters. Ensure that the Python Flask API is continuously listening on port 5001.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Settings;
