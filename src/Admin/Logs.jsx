import React, { useState, useEffect } from 'react';
import Layout from '../Components/Layout';

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate fetching logs
    const fetchLogs = async () => {
      setLoading(true);
      // Dummy data
      const dummyLogs = [
        { id: 1, timestamp: '2026-03-04 10:00:00', level: 'INFO', message: 'User logged in', user: 'admin@example.com' },
        { id: 2, timestamp: '2026-03-04 09:45:00', level: 'WARN', message: 'Failed login attempt', user: 'unknown' },
        { id: 3, timestamp: '2026-03-04 09:30:00', level: 'ERROR', message: 'Database connection failed', user: 'system' },
        { id: 4, timestamp: '2026-03-04 09:15:00', level: 'INFO', message: 'Order processed', user: 'merchant@example.com' },
        { id: 5, timestamp: '2026-03-04 09:00:00', level: 'DEBUG', message: 'Cache cleared', user: 'system' },
      ];
      setTimeout(() => {
        setLogs(dummyLogs);
        setLoading(false);
      }, 1000); // Simulate delay
    };
    fetchLogs();
  }, []);

  return (
    <Layout title="Logs">
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">System Logs</h2>
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.timestamp}
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
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {log.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.user}
                      </td>
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