import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Wallet,
  BarChart3,
  RefreshCw,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';
import * as XLSX from 'xlsx';

export default function GigWallet() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('7days');
  const [gigWorkers, setGigWorkers] = useState([]);
  const [walletStats, setWalletStats] = useState({
    totalBalance: 0,
    totalEarnings: 0,
    totalWithdrawals: 0,
    activeWorkers: 0
  });
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch current admin profile
        const profileResponse = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, {
          credentials: 'include',
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setCurrentUser(profileData.admin);
        } else {
          setRedirecting(true);
          navigate('/login');
          return;
        }

        // Fetch gig wallet data (dummy data for now)
        await fetchGigWalletData();

      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load gig wallet data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const fetchGigWalletData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/gig-wallet`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch gig wallet data');
      }

      const data = await response.json();

      if (data.success) {
        setWalletStats(data.walletStats);
        setGigWorkers(data.gigWorkers);
        setTransactions(data.transactions);
      } else {
        throw new Error(data.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Failed to fetch gig wallet data:', error);
      toast.error('Failed to load gig wallet data');
    }
  };

  const handleRefresh = () => {
    fetchGigWalletData();
    toast.success('Data refreshed');
  };

  const exportToExcel = () => {
    if (!gigWorkers || gigWorkers.length === 0) {
      toast.error('No data to export');
      return;
    }

    const data = gigWorkers.map((worker, index) => ({
      'S.No': index + 1,
      'Agent ID': worker.agentId || 'N/A',
      'Name': worker.name || 'N/A',
      'Phone': worker.phone || 'N/A',
      'Balance (₹)': worker.balance || 0,
      'Total Earnings (₹)': worker.earnings || 0,
      'Total Withdrawals (₹)': worker.withdrawals || 0,
      'Status': worker.status || 'N/A',
      'Is Gig Worker': worker.isGig ? 'Yes' : 'No',
      'Last Online': worker.lastOnline ? new Date(worker.lastOnline).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }) : 'N/A'
    }));

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 8 },  // S.No
      { wch: 12 }, // Agent ID
      { wch: 20 }, // Name
      { wch: 15 }, // Phone
      { wch: 15 }, // Balance
      { wch: 18 }, // Total Earnings
      { wch: 18 }, // Total Withdrawals
      { wch: 10 }, // Status
      { wch: 15 }, // Is Gig Worker
      { wch: 20 }  // Last Online
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Gig Workers');

    // Generate filename with current date
    const currentDate = new Date().toISOString().split('T')[0];
    const fileName = `Gig_Workers_${currentDate}.xlsx`;

    // Save file
    XLSX.writeFile(wb, fileName);

    toast.success('Excel file exported successfully!');
  };

  if (loading) {
    return (
      <Layout title="Gig Wallet">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="animate-spin h-8 w-8 text-green-600" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Gig Wallet">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Gig Wallet">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">Gig Wallet Management</h1>
            <p className="text-neutral-600">Manage gig worker earnings and withdrawals</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Balance</p>
                <p className="text-2xl font-bold text-neutral-900">₹{walletStats.totalBalance.toLocaleString()}</p>
              </div>
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Total Withdrawals</p>
                <p className="text-2xl font-bold text-neutral-900">₹{walletStats.totalWithdrawals.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-600">Active Workers</p>
                <p className="text-2xl font-bold text-neutral-900">{walletStats.activeWorkers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Gig Workers Table */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">Gig Workers</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Withdrawals</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Last Online</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {gigWorkers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{worker.name}</div>
                        <div className="text-sm text-neutral-500">{worker.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">₹{worker.balance}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">₹{worker.withdrawals}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        worker.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {worker.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {worker.lastOnline ? (() => {
                        const date = new Date(worker.lastOnline);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = String(date.getFullYear()).slice(-2);
                        const hours = date.getHours();
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        return `${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
                      })() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-6 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">Recent Transactions</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Worker</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{transaction.workerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.type === 'earning'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-900">₹{transaction.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">
                      {transaction.createdAt ? (() => {
                        const date = new Date(transaction.createdAt);
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = String(date.getFullYear()).slice(-2);
                        const hours = date.getHours();
                        const minutes = String(date.getMinutes()).padStart(2, '0');
                        const ampm = hours >= 12 ? 'PM' : 'AM';
                        const displayHours = hours % 12 || 12;
                        return `${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
                      })() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        {transaction.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}