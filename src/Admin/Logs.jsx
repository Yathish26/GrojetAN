import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../Components/Layout';
import * as XLSX from 'xlsx';
import { RotateCw } from 'lucide-react';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatDateTimeDDMMYY = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return { date: '-', time: '' };

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const rawHours = date.getHours();
    const period = rawHours >= 12 ? 'PM' : 'AM';
    const hours12 = rawHours % 12 || 12;
    const hours = String(hours12).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return {
      date: `${day}/${month}/${year}`,
      time: `${hours}:${minutes}:${seconds} ${period}`,
    };
  };

  const extractVersion = (log) => {
    if (log?.version) return log.version;

    const message = log?.message || '';
    const match = message.match(/Admin\s+([Vv][\w.-]+)/);
    return match?.[1] || '-';
  };

  const formatMessageForDisplay = (message) => {
    const safeMessage = (message || '').toString();

    // For product audit logs, push product name to the next line to avoid a very wide message column.
    return safeMessage
      .replace(/(Added\s+product-)(?!\n)/i, '$1\n')
      .replace(/(Edited\s+product-)(?!\n)/i, '$1\n');
  };

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/logs`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        const mappedLogs = (data.logs || []).map((log) => {
          const formattedTimestamp = formatDateTimeDDMMYY(log.timestamp);

          return {
            id: log._id,
            timestamp: `${formattedTimestamp.date}${formattedTimestamp.time ? `, ${formattedTimestamp.time}` : ''}`,
            timestampDate: formattedTimestamp.date,
            timestampTime: formattedTimestamp.time,
            level: log.level,
            message: log.message,
            user: log.user || 'system',
            platform: log.platform || 'web',
            version: extractVersion(log)
          };
        });
        setLogs(mappedLogs);
        setError('');
      } else {
        const errorData = await response.json().catch(() => ({}));
        setError(errorData.message || 'Failed to fetch logs');
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Unable to fetch logs. Please try again.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportExcel = () => {
    const rows = logs.map((log) => ({
      Timestamp: log.timestampTime ? `${log.timestampDate} ${log.timestampTime}` : log.timestampDate,
      User: log.user,
      Platform: log.platform,
      Message: log.message,
      Level: log.level,
      Version: log.version,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 24 },
      { wch: 20 },
      { wch: 14 },
      { wch: 45 },
      { wch: 10 },
      { wch: 10 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs');
    XLSX.writeFile(workbook, `system-logs-${Date.now()}.xlsx`);
  }

  return (
    <Layout title="Logs">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
                <p className="mt-1 text-sm text-gray-500">View, search, and export system logs.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchLogs}
                  disabled={loading}
                  className="inline-flex items-center justify-center w-9 h-9 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400 transition-colors disabled:opacity-60"
                  aria-label="Refresh logs"
                  title="Refresh logs"
                >
                  <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={handleExportExcel}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                >
                  Export to Excel
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
              <span className="ml-3 text-gray-600 font-medium">Loading logs…</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          ) : logs.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-6 text-sm text-gray-500">
              No logs found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="w-40 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="w-36 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                    <th className="w-[12rem] px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Version</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{log.timestampDate}</div>
                        {log.timestampTime && (
                          <div className="text-xs font-semibold text-black-500">{log.timestampTime}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.user}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.platform}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 align-top">
                        <div className="max-w-[12rem] whitespace-pre-line break-words">{formatMessageForDisplay(log.message)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                          log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                          log.level === 'INFO' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Logs;