import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeartbeat, FaArrowLeft } from 'react-icons/fa';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 transition-colors duration-300">
      <div className="glass-card w-full max-w-md rounded-2xl p-8 text-center glow-blue border border-white/40">
        
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-sky-55/10 text-rose-500 dark:bg-slate-800 animate-bounce">
          <FaHeartbeat className="h-10 w-10 text-rose-500" />
        </div>

        <h1 className="font-display font-extrabold text-5xl text-slate-800 dark:text-slate-100 mt-6">
          404
        </h1>
        <h2 className="font-display font-bold text-lg text-slate-700 dark:text-slate-300 mt-2">
          Diagnostic Path Missing
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
          The clinic routing address you requested was not found in our diagnostic directory. Let's redirect you back to active channels.
        </p>

        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-medical-600 to-sky-500 text-white font-bold text-sm shadow-md hover:scale-101 transition cursor-pointer"
          >
            <FaArrowLeft className="h-3.5 w-3.5" />
            Return to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
};

export default NotFound;
