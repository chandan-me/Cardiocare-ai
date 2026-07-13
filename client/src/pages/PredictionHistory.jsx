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
  FaArrowRight,
  FaSortAmountDown
} from 'react-icons/fa';

const PredictionHistory = () => {
  const navigate = useNavigate();
  const [predictions, setPredictions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [resultFilter, setResultFilter] = useState('');
  const [ageFilter, setAgeFilter] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');
  
  const [loading, setLoading] = useState(true);
  const [pdfLoadingId, setPdfLoadingId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchHistory = async (page = 1) => {
    setLoading(true);
    try {
      const response = await api.get('/predictions', {
        params: {
          page,
          limit: 10,
          search: debouncedSearch,
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
  }, [debouncedSearch, resultFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchHistory(newPage);
    }
  };

  const handleViewResult = (record) => {
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

  const exportBatchCSV = async () => {
    try {
      // Fetch up to 10000 records to do a true full batch database export
      const response = await api.get('/predictions', {
        params: { page: 1, limit: 10000, search: debouncedSearch, result: resultFilter }
      });
      
      const allLogs = response.data.predictions || [];
      if (allLogs.length === 0) {
        Swal.fire('No Data', 'There are no prediction logs to export.', 'info');
        return;
      }

      const headers = [
        'Date', 
        'Assessment ID', 
        'Patient Name', 
        'Age', 
        'Gender', 
        'Result', 
        'Confidence', 
        'Resting Blood Pressure (mmHg)', 
        'Cholesterol (mg/dl)', 
        'Max Heart Rate (bpm)'
      ];
      
      const rows = allLogs.map(p => [
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
      link.setAttribute("download", `Cardiac_Risk_Database_Export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      Swal.fire({
        icon: 'success',
        title: 'Export Successful',
        text: `Exported ${allLogs.length} diagnostic logs to CSV.`,
        timer: 1500,
        showConfirmButton: false,
        toast: true,
        position: 'top-end'
      });
    } catch (err) {
      console.error('Batch export failure:', err);
      Swal.fire('Export Failed', 'Unable to retrieve clinical history records.', 'error');
    }
  };

  // Process list with client-side sort & age filters for high responsiveness
  const getProcessedPredictions = () => {
    let processed = [...predictions];

    // Age band filter
    if (ageFilter) {
      processed = processed.filter(p => {
        if (ageFilter === 'under40') return p.age < 40;
        if (ageFilter === '40to49') return p.age >= 40 && p.age < 50;
        if (ageFilter === '50to59') return p.age >= 50 && p.age < 60;
        if (ageFilter === 'above60') return p.age >= 60;
        return true;
      });
    }

    // Sort mappings
    processed.sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'date_asc') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'conf_desc') return parseFloat(b.confidence) - parseFloat(a.confidence);
      if (sortBy === 'conf_asc') return parseFloat(a.confidence) - parseFloat(b.confidence);
      return 0;
    });

    return processed;
  };

  const processedList = getProcessedPredictions();

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-2xl text-slate-800 dark:text-slate-100">
            Assessment Logs
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Query, search, filter, and batch export patient cardiovascular risk logs.
          </p>
        </div>

        <button
          onClick={exportBatchCSV}
          className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold dark:border-slate-800 dark:bg-slate-850 dark:text-slate-200 dark:hover:bg-slate-800 transition flex items-center justify-center gap-2 cursor-pointer text-sm shadow-sm"
        >
          <FaFileCsv className="h-4.5 w-4.5 text-emerald-500" />
          Batch Export CSV
        </button>
      </div>

      {/* Advanced Query & Filter Bar */}
      <div className="glass-card rounded-2xl p-5 border border-slate-150 dark:border-slate-850 space-y-4">
        
        {/* Search Input Row */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
            <FaSearch className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by patient name (updates live)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-800 text-slate-800 dark:text-slate-150 focus:outline-none focus:ring-1 focus:ring-medical-500 text-xs"
          />
        </div>

        {/* Filters Selectors Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Outcome Filter */}
          <div className="flex items-center gap-2">
            <FaFilter className="text-slate-400 text-xs shrink-0" />
            <select
              value={resultFilter}
              onChange={(e) => setResultFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-155 focus:outline-none focus:ring-1 focus:ring-medical-500"
            >
              <option value="">All Risk Outcomes</option>
              <option value="Healthy">Healthy Group</option>
              <option value="High Risk">High Risk Cases</option>
            </select>
          </div>

          {/* Age Group Filter */}
          <div className="flex items-center gap-2">
            <FaFilter className="text-slate-400 text-xs shrink-0" />
            <select
              value={ageFilter}
              onChange={(e) => setAgeFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-155 focus:outline-none focus:ring-1 focus:ring-medical-500"
            >
              <option value="">All Age Brackets</option>
              <option value="under40">Under 40 years</option>
              <option value="40to49">40 to 49 years</option>
              <option value="50to59">50 to 59 years</option>
              <option value="above60">60 years +</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2">
            <FaSortAmountDown className="text-slate-400 text-xs shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-white/50 dark:border-slate-750 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-155 focus:outline-none focus:ring-1 focus:ring-medical-500"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="conf_desc">Confidence: Highest</option>
              <option value="conf_asc">Confidence: Lowest</option>
            </select>
          </div>

        </div>
      </div>

      {/* Data Table */}
      <div className="glass-card rounded-2xl border border-slate-150 dark:border-slate-850 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs text-slate-500 dark:text-slate-400">
            <thead className="bg-slate-50/50 dark:bg-slate-800/40 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-slate-150 dark:border-slate-850">
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
                [1, 2, 3, 4].map(n => (
                  <tr key={n} className="animate-pulse">
                    <td className="px-6 py-5"><div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-24"></div></td>
                    <td className="px-6 py-5"><div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-32"></div></td>
                    <td className="px-6 py-5"><div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                    <td className="px-6 py-5"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-24 mx-auto"></div></td>
                    <td className="px-6 py-5"><div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-12 mx-auto"></div></td>
                    <td className="px-6 py-5"><div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-28 ml-auto"></div></td>
                  </tr>
                ))
              ) : processedList.length > 0 ? (
                processedList.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-slate-605 dark:text-slate-350">
                      {new Date(record.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-slate-900 dark:text-slate-100 font-bold">
                      {record.patient_name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-semibold">
                      {record.age} yrs / {record.gender === 1 ? 'Male' : 'Female'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        record.result === 'High Risk' 
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' 
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'
                      }`}>
                        {record.result}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-805 dark:text-slate-200">
                      {record.confidence}%
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleViewResult(record)}
                          title="View Details"
                          className="p-1.5 rounded-lg border border-slate-250 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-350 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <FaEye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => downloadReport(record)}
                          title="Download PDF"
                          disabled={pdfLoadingId === record.id}
                          className="p-1.5 rounded-lg border border-slate-250 text-medical-600 hover:bg-sky-50 dark:border-slate-700 dark:text-sky-400 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          {pdfLoadingId === record.id ? (
                            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-medical-500 border-t-transparent"></div>
                          ) : (
                            <FaDownload className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          title="Delete Record"
                          className="p-1.5 rounded-lg border border-slate-250 text-rose-550 hover:bg-rose-50 dark:border-slate-700 dark:text-rose-455 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          <FaTrashAlt className="h-3.5 w-3.5" />
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
          <div className="px-6 py-4 border-t border-slate-150 dark:border-slate-850 flex items-center justify-between text-[11px] font-bold text-slate-450">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-750 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-850 transition cursor-pointer"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-750 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-850 transition cursor-pointer"
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
