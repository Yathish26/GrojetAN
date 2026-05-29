
import React, { useEffect, useState } from 'react';
import Layout from '../Components/Layout';

// Helper to format date to dd/mm/yy hh:mm:ss AM/PM
function formatDate(dateStr) {
  if (!dateStr) return '';
  const dateObj = new Date(dateStr);
  const dd = String(dateObj.getDate()).padStart(2, '0');
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const yy = String(dateObj.getFullYear()).slice(-2);
  let hours = dateObj.getHours();
  const min = String(dateObj.getMinutes()).padStart(2, '0');
  const ss = String(dateObj.getSeconds()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hh = String(hours).padStart(2, '0');
  return `${dd}/${mm}/${yy} ${hh}:${min}:${ss} ${ampm}`;
}

const AttendanceReport = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);


  // Date filter state
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Fetch data (optionally with date filter)
  const fetchData = async (from, to) => {
    setLoading(true);
    try {
      let url = `${import.meta.env.VITE_SERVER}/attendance/report/all`;
      if (from && to) {
        url += `?from=${from}&to=${to}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRows(data);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, []);

  // Export CSV
  const handleExport = async () => {
    await fetchData(fromDate, toDate);
    // Convert rows to CSV
    const csvRows = [
      ['Employee', 'Punch In', 'Punch Out', 'Hours', 'Status'],
      ...rows.map(row => [
        row.employee,
        formatDate(row.punchIn),
        formatDate(row.punchOut),
        row.hours,
        row.status
      ])
    ];
    const csvContent = csvRows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${fromDate || 'all'}_${toDate || 'all'}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Layout title="Attendance Report">
      {/* Date filter and export */}
      <div className="flex flex-wrap gap-4 items-end mt-6 mb-4">
        <div>
          <label className="block text-sm font-medium mb-1">From Date</label>
          <input
            type="date"
            className="border px-2 py-1 rounded"
            value={fromDate}
            onChange={e => setFromDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">To Date</label>
          <input
            type="date"
            className="border px-2 py-1 rounded"
            value={toDate}
            onChange={e => setToDate(e.target.value)}
          />
        </div>
        <button
          className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded"
          onClick={handleExport}
          disabled={!fromDate || !toDate}
        >
          Export
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-neutral-200 rounded-lg">
          <thead>
            <tr className="bg-neutral-100">
              <th className="px-6 py-3 text-left border-b font-semibold whitespace-nowrap">Employee</th>
              <th className="px-6 py-3 text-left border-b font-semibold whitespace-nowrap">Punch In</th>
              <th className="px-6 py-3 text-left border-b font-semibold whitespace-nowrap">Punch Out</th>
              <th className="px-6 py-3 text-left border-b font-semibold whitespace-nowrap">Hours</th>
              <th className="px-6 py-3 text-left border-b font-semibold whitespace-nowrap">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-6">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-6">No records found.</td></tr>
            ) : rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-neutral-50">
                <td className="px-6 py-3 border-b whitespace-nowrap">{row.employee}</td>
                <td className="px-6 py-3 border-b whitespace-nowrap">{formatDate(row.punchIn)}</td>
                <td className="px-6 py-3 border-b whitespace-nowrap">{formatDate(row.punchOut)}</td>
                <td className="px-6 py-3 border-b whitespace-nowrap">{row.hours}</td>
                <td className="px-6 py-3 border-b whitespace-nowrap">{row.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
};

export default AttendanceReport;
