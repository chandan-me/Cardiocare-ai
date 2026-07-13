import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Swal from 'sweetalert2';
import { 
  FaSearch, 
  FaFilter, 
  FaTrashAlt, 
  FaEye, 
  FaDownload, 
  FaFileCsv, 
  FaChevronLeft, 
  FaChevronRight,
  FaHeartbeat,
  FaArrowRight
} from 'react-icons/fa';

const PredictionHistory = () => {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/predictions', {
        params: {
          page,
          limit: 10,
          search,
          result: resultFilter
        }
      });
      setPredictions(response.data.predictions);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Failed to fetch prediction history:', err);
      Swal.fire({
        icon: 'error',
        title: 'Query Failed',
        text: 'Could not load clinical prediction logs. Ensure database is running.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(1);
  }, [resultFilter]); // auto refetch when filter toggles

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchHistory(newPage);
    }
  };

  const handleViewResult = (record) => {
    // Reconstruct inputData from schema properties for the view
    const inputData = {
      trestbps: record.trestbps,
      chol: record.chol,
      thalach: record.thalach,
      cp: record.cp,
      oldpeak: record.oldpeak,
      ca: record.ca,
      thal: record.thal,
      age: record.age,
      gender: record.gender
    };
    navigate('/dashboard/predict/result', { state: { result: record, inputData } });
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: 'Delete Record?',
      text: "You won't be able to revert this! This patient assessment log will be permanently removed.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, delete log'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await api.delete(`/predictions/${id}`);
          Swal.fire({
            title: 'Deleted!',
            text: 'Prediction record removed.',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
          });
          // Refresh list
          fetchHistory(pagination.page);
        } catch (err) {
          console.error(err);
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: 'Could not delete the record. Please try again.',
            confirmButtonColor: '#ef4444'
          });
        }
      }
    });
  };

  const downloadReport = async (record) => {
    setPdfLoadingId(record.id);
    try {
      const response = await api.post('/generate-report', { id: record.id }, { responseType: 'blob' });
      
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `Heart_Disease_Report_${record.patient_name.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Report generation timed out.',
        confirmButtonColor: '#ef4444'
      });
    } finally {
      setPdfLoadingId(null);
    }
  };

  const exportCSV = () => {
    if (predictions.length === 0) {
      Swal.fire({
        icon: 'info',
        title: 'No Data',
        text: 'There are no prediction logs on this page to export.',
        confirmButtonColor: '#0284c7'
      });
      return;
    }

    const headers = ['Date', 'Assessment ID', 'Patient Name', 'Age', 'Gender', 'Result', 'Confidence', 'Blood Pressure', 'Cholesterol', 'Max Heart Rate'];
    const rows = predictions.map(p => [
      new Date(p.created_at).toLocaleDateString(),
      `HRA-${p.id}`,
      p.patient_name,
      p.age,
      p.gender === 1 ? 'Male' : 'Female',
      p.result,
      `${p.confidence}%`,
      p.trestbps,
      p.chol,
      p.thalach
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Cardiac_Risk_Logs_Export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">
            Assessment Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Query, search, filter, and export patient cardiovascular risk logs.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold dark:border-slate-800 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2 cursor-pointer text-sm"
        >
          <FaFileCsv className="h-4.5 w-4.5 text-emerald-500" />
          Export CSV Log
        </button>
      </div>

      {/* Query Bar */}
      <div className="glass-card rounded-2xl p-4 border border-slate-150 dark:border-slate-850 flex flex-col md:flex-row gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <FaSearch />
            </span>
            <input
              type="text"
              placeholder="Search by patient name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-800 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-medical-500/50 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm transition cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Filter Dropdown */}
        <div className="flex items-center gap-2">
          <FaFilter className="text-slate-400 text-sm" />
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-800 text-slate-850 dark:text-slate-150 focus:outline-none focus:ring-2 focus:ring-medical-500/50 text-sm"
          >
            <option value="">All Risk Outcome Statuses</option>
            <option value="Healthy">Healthy Profile Only</option>
            <option value="High Risk">High Risk Only</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-2xl border border-slate-150 dark:border-slate-850 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-150 dark:border-slate-850">
              <tr>
                <th className="px-6 py-4">Assessment Date</th>
                <th className="px-6 py-4">Patient Name</th>
                <th className="px-6 py-4">Age / Gender</th>
                <th className="px-6 py-4 text-center">Diagnostic Result</th>
                <th className="px-6 py-4 text-center">Confidence</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850 font-medium">
              {loading ? (
                // Skeletons
                [1, 2, 3, 4].map(n => (
                  <tr key={n} className="animate-pulse">
                    <td className="px-6 py-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                    <td className="px-6 py-5"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-full w-24 mx-auto"></div></td>
                    <td className="px-6 py-5"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-12 mx-auto"></div></td>
                    <td className="px-6 py-5"><div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-28 ml-auto"></div></td>
                  </tr>
                ))
              ) : predictions.length > 0 ? (
                predictions.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-350">
                      {new Date(record.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-bold">
                      {record.patient_name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {record.age} yrs / {record.gender === 1 ? 'Male' : 'Female'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                        record.result === 'High Risk' 
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}>
                        {record.result}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-800 dark:text-slate-200">
                      {record.confidence}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewResult(record)}
                          title="View Details"
                          className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <FaEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => downloadReport(record)}
                          title="Download PDF"
                          disabled={pdfLoadingId === record.id}
                          className="p-2 rounded-lg border border-slate-200 text-medical-600 hover:bg-sky-50 dark:border-slate-700 dark:text-sky-400 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          {pdfLoadingId === record.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-medical-500 border-t-transparent"></div>
                          ) : (
                            <FaDownload className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          title="Delete Record"
                          className="p-2 rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 dark:border-slate-700 dark:text-rose-400 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <FaTrashAlt className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400 text-xs">
                    No cardiac assessments match your query criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-150 dark:border-slate-850 flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-750 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-850 transition cursor-pointer"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-750 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-850 transition cursor-pointer"
              >
                <FaChevronRight />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default PredictionHistory;
