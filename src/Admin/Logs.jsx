import React, { useState, useEffect } from 'react';
import Layout from '../Components/Layout';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch logs immediately without artificial delay
    const dummyLogs = [
      { id: 1, timestamp: '2026-03-04 10:00:00', level: 'INFO', message: 'User logged in', user: 'admin@example.com' },
      { id: 2, timestamp: '2026-03-04 09:45:00', level: 'WARN', message: 'Failed login attempt', user: 'unknown' },
      { id: 3, timestamp: '2026-03-04 09:30:00', level: 'ERROR', message: 'Database connection failed', user: 'system' },
      { id: 4, timestamp: '2026-03-04 09:15:00', level: 'INFO', message: 'Order processed', user: 'merchant@example.com' },
      { id: 5, timestamp: '2026-03-04 09:00:00', level: 'DEBUG', message: 'Cache cleared', user: 'system' },
    ];
    setLogs(dummyLogs);
    setLoading(false);
  }, []);

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportText = () => {
    const text = logs.map(log => `${log.timestamp} [${log.level}] ${log.user}: ${log.message}`).join('\n')
    downloadFile(text, `system-logs-${Date.now()}.txt`, 'text/plain')
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
              <button
                onClick={handleExportText}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
              >
                Export to TXT
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
              <span className="ml-3 text-gray-600 font-medium">Loading logs…</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.timestamp}</td>
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
                      <td className="px-6 py-4 text-sm text-gray-900">{log.message}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.user}</td>
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