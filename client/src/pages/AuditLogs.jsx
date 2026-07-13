import React, { useEffect, useState } from 'react';
import { FaUserShield, FaHistory, FaSearch, FaFilter, FaLock, FaExclamationTriangle } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const AuditLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const fetchLogs = async () => {
      try {
        const response = await api.get('/audit-logs');
        setLogs(response.data);
      } catch (err) {
        console.error('Failed to load audit logs:', err);
        Swal.fire({
          icon: 'error',
          title: 'Load Error',
          text: err.response?.data?.error || 'Could not load HIPAA audit logs from server.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [user]);

  // Authorization check
  if (user?.role !== 'admin') {
    return (
      <div className="max-w-xl mx-auto mt-12 p-8 text-center glass-card border border-rose-150 dark:border-rose-900 rounded-2xl space-y-4">
        <FaLock className="mx-auto h-12 w-12 text-rose-500 animate-bounce" />
        <h2 className="font-display font-extrabold text-lg text-slate-800 dark:text-slate-100">
          Access Denied
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          This workspace contains restricted HIPAA system audit logs. Only system administrators can view the access trails.
        </p>
      </div>
    );
  }

  // Formatting date
  const formatDate = (isoString) => {
    return new Date(isoString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Badges color mapping
  const getActionBadge = (action) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900';
      case 'PREDICTION_RUN':
        return 'bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400 border border-sky-100 dark:border-sky-900';
      case 'PREDICTION_DELETE':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-455 border border-rose-100 dark:border-rose-900';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.user_email.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesFilter = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FaUserShield className="text-sky-600 dark:text-sky-400" />
            Clinician Action Audits
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Secure, immutable logging trail auditing clinic operations, logins, and diagnosis predictions.
          </p>
        </div>
      </div>

      {/* Filters Hub */}
      <div className="glass-card rounded-2xl p-4 border border-slate-150 dark:border-slate-850 flex flex-col sm:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
          <input
            type="text"
            placeholder="Search by clinician name, email, or audit details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 dark:text-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
          <FaFilter className="text-slate-400 text-xs shrink-0" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full sm:w-auto p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none dark:text-slate-200"
          >
            <option value="ALL">All Actions</option>
            <option value="LOGIN">Clinic Logins Only</option>
            <option value="PREDICTION_RUN">Diagnostic Runs Only</option>
            <option value="PREDICTION_DELETE">Record Deletions Only</option>
          </select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="glass-card rounded-2xl border border-slate-150 dark:border-slate-850 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-12 space-y-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent"></div>
            <span className="text-xs text-slate-450 font-bold">Decrypting audit trail logs...</span>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 dark:text-slate-500 space-y-2">
            <FaHistory className="mx-auto h-8 w-8 opacity-40" />
            <h4 className="font-bold text-xs">No Audit Logs Found</h4>
            <p className="text-[10px]">No action records match your active search terms or filtering.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-850/50 border-b border-slate-150 dark:border-slate-800 text-slate-450 font-bold uppercase tracking-wider">
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Clinician Profile</th>
                  <th className="px-5 py-3">Security Action</th>
                  <th className="px-5 py-3">Transaction Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-650 dark:text-slate-350 font-semibold">
                {filteredLogs.map((log) => {
                  let parsedDetails = {};
                  try {
                    parsedDetails = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
                  } catch (e) {
                    parsedDetails = { raw: log.details };
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/10 transition">
                      <td className="px-5 py-3.5 text-slate-450 whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{log.user_name}</div>
                        <div className="text-[10px] text-slate-450">{log.user_email}</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 max-w-sm">
                        <div className="bg-slate-50 dark:bg-slate-850 p-2 rounded-lg text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 overflow-x-auto">
                          {Object.entries(parsedDetails).map(([key, val]) => (
                            <div key={key} className="flex gap-1.5">
                              <span className="text-slate-400 font-bold">{key}:</span>
                              <span>{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AuditLogs;
