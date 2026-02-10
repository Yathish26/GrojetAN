import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, Plus, Eye, Edit, Trash2, ChefHat,
    Phone, Mail, MapPin, Star, Package, DollarSign,
    Calendar, User, MoreVertical, Download
} from 'lucide-react';
import Layout from '../Components/Layout';
import toast from 'react-hot-toast';

const Eateries = () => {
    const navigate = useNavigate();
    const [eateries, setEateries] = useState([]);
    const [filteredEateries, setFilteredEateries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [checkingUser, setCheckingUser] = useState(true);
    const [redirecting, setRedirecting] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [currentSearch, setCurrentSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEateries, setTotalEateries] = useState(0);
    const [stats, setStats] = useState({
        totalEateries: 0,
        openEateries: 0,
        activeEateries: 0,
        totalRevenue: 0
    });

    // Fetch eateries from API with search and filters
    const fetchEateries = async (page = 1, search = '', status = 'all') => {
        try {
            setLoading(true);

            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '10'
            });

            if (search && search.trim()) {
                params.append('search', search.trim());
            }

            if (status && status !== 'all') {
                params.append('status', status);
            }

            // For now, we'll use the same merchant-stores endpoint but filter for eateries
            // You can modify this to use a specific eateries endpoint when available
            params.append('storeType', 'Restaurant');

            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores?${params}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.tokenValid === false) {
                    navigate('/login', { replace: true });
                    return;
                }
                if (data.success) {
                    const transformedEateries = data.merchants.map(eatery => ({
                        id: eatery.id,
                        merchantId: eatery.merchantId,
                        name: eatery.displayName,
                        email: eatery.email,
                        phone: eatery.mobile,
                        address: eatery.city ? `${eatery.city}, India` : 'Address not available',
                        status: eatery.status,
                        storeStatus: eatery.storeStatus,
                        rating: eatery.rating || 0,
                        totalOrders: eatery.totalOrders,
                        totalRevenue: eatery.totalRevenue,
                        todaysOrders: eatery.todaysOrders || 0,
                        todaysRevenue: eatery.todaysRevenue || 0,
                        joinDate: eatery.registrationDate ? new Date(eatery.registrationDate).toISOString().split('T')[0] : 'N/A',
                        profileImage: null,
                        brandingInfo: eatery.brandingInfo || null,
                        operationalInfo: eatery.operationalInfo || null,
                        cuisine: eatery.operationalInfo?.cuisineType || 'Various',
                        deliveryTime: eatery.operationalInfo?.deliveryTime || '30-45 mins'
                    }));

                    setEateries(transformedEateries);
                    setFilteredEateries(transformedEateries);
                    setStats({
                        totalEateries: data.stats.totalMerchants,
                        openEateries: data.stats.openMerchants,
                        activeEateries: data.stats.activeMerchants,
                        totalRevenue: data.stats.totalRevenue
                    });
                    setTotalPages(data.pagination.totalPages);
                    setTotalEateries(data.pagination.total);
                    setCurrentPage(page);
                } else {
                    throw new Error(data.message || 'Failed to fetch eateries');
                }
            } else {
                throw new Error('Failed to fetch eateries');
            }
        } catch (error) {
            console.error('Error fetching eateries:', error);
            toast.error(error.message || 'Failed to load eateries');
            setEateries([]);
            setFilteredEateries([]);
            setStats({
                totalEateries: 0,
                openEateries: 0,
                activeEateries: 0,
                totalRevenue: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        try {
            setCheckingUser(true);
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
            if (response.status === 401) {
                setRedirecting(true);
                navigate('/login', { replace: true });
                return;
            }
            const data = await response.json();
            if (data.tokenValid === false) {
                setRedirecting(true);
                navigate('/login', { replace: true });
                return;
            }
            if (response.ok && data.admin) {
                setCurrentUser(data.admin);
            } else {
                setRedirecting(true);
                navigate('/login', { replace: true });
                return;
            }
        } catch (err) {
            console.error('Failed to fetch current user', err);
            setRedirecting(true);
            navigate('/login', { replace: true });
            return;
        } finally {
            setCheckingUser(false);
        }
    };

    // Handle search
    const handleSearch = () => {
        setCurrentSearch(searchInput);
        setCurrentPage(1);
        fetchEateries(1, searchInput, statusFilter);
    };

    // Handle filter changes
    const handleStatusFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        setCurrentPage(1);
        fetchEateries(1, currentSearch, newStatus);
    };

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
        fetchEateries(page, currentSearch, statusFilter);
    };

    // Export eateries
    const exportEateries = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/export/eateries`, {
                method: 'GET',
                credentials: 'include',
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'eateries.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast.success('Eateries exported successfully');
            } else {
                throw new Error('Failed to export eateries');
            }
        } catch (error) {
            console.error('Error exporting eateries:', error);
            toast.error('Failed to export eateries');
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchEateries();
        }
    }, [currentUser]);

    if (checkingUser) {
        return (
            <Layout title="Eateries">
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
            </Layout>
        );
    }

    if (!currentUser) {
        return (
            <Layout title="Eateries">
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
                        <p className="text-gray-600">You don't have permission to access this page.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Eateries">
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div className="hidden md:flex items-center space-x-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Eateries</h1>
                                    <p className="mt-1 text-sm text-gray-500">Manage and monitor all eatery accounts</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={exportEateries}
                                    disabled={loading}
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full mr-2"></div>
                                    ) : (
                                        <Download size={16} className="mr-2" />
                                    )}
                                    {loading ? 'Exporting...' : 'Export'}
                                </button>
                                <button
                                    onClick={() => navigate('/eateries/add')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                >
                                    <Plus size={16} className="mr-2" />
                                    Add Eatery
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <ChefHat className="h-6 w-6 text-gray-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Eateries</dt>
                                            <dd className="text-lg font-medium text-gray-900">{stats.totalEateries}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <Package className="h-6 w-6 text-green-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Open Eateries</dt>
                                            <dd className="text-lg font-medium text-gray-900">{stats.openEateries}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <User className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Active Eateries</dt>
                                            <dd className="text-lg font-medium text-gray-900">{stats.activeEateries}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white overflow-hidden shadow rounded-lg">
                            <div className="p-5">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <DollarSign className="h-6 w-6 text-yellow-400" />
                                    </div>
                                    <div className="ml-5 w-0 flex-1">
                                        <dl>
                                            <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                                            <dd className="text-lg font-medium text-gray-900">₹{stats.totalRevenue?.toLocaleString() || 0}</dd>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filters */}
                    <div className="bg-white shadow rounded-lg mb-6">
                        <div className="px-4 py-5 sm:p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex-1 max-w-lg">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Search className="h-5 w-5 text-gray-400" />
                                        </div>
                                        <input
                                            type="text"
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                                            placeholder="Search eateries by name, email, or phone..."
                                            value={searchInput}
                                            onChange={(e) => setSearchInput(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleSearch}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        Search
                                    </button>
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        <Filter className="h-4 w-4 mr-2" />
                                        Filters
                                    </button>
                                </div>
                            </div>

                            {showFilters && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                            <select
                                                value={statusFilter}
                                                onChange={(e) => handleStatusFilterChange(e.target.value)}
                                                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md"
                                            >
                                                <option value="all">All Status</option>
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="banned">Banned</option>
                                                <option value="hold">On Hold</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Eateries List */}
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                <span className="ml-2 text-gray-600">Loading eateries...</span>
                            </div>
                        ) : filteredEateries.length === 0 ? (
                            <div className="text-center py-12">
                                <ChefHat className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No eateries found</h3>
                                <p className="mt-1 text-sm text-gray-500">Get started by adding a new eatery.</p>
                                <div className="mt-6">
                                    <button
                                        onClick={() => navigate('/eateries/add')}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        <Plus className="h-5 w-5 mr-2" />
                                        Add Eatery
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {filteredEateries.map((eatery) => (
                                    <li key={eatery.id}>
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                            <ChefHat className="h-6 w-6 text-gray-600" />
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="flex items-center">
                                                            <h4 className="text-sm font-medium text-gray-900">{eatery.name}</h4>
                                                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                                eatery.status === 'active' ? 'bg-green-100 text-green-800' :
                                                                eatery.status === 'inactive' ? 'bg-gray-100 text-gray-800' :
                                                                eatery.status === 'banned' ? 'bg-red-100 text-red-800' :
                                                                'bg-yellow-100 text-yellow-800'
                                                            }`}>
                                                                {eatery.status}
                                                            </span>
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            <div className="flex items-center">
                                                                <Mail className="h-4 w-4 mr-1" />
                                                                {eatery.email}
                                                            </div>
                                                            <div className="flex items-center mt-1">
                                                                <Phone className="h-4 w-4 mr-1" />
                                                                {eatery.phone}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => navigate(`/eateries/${eatery.id}`)}
                                                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        View
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/eateries/${eatery.id}/edit`)}
                                                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                                    >
                                                        <Edit className="h-4 w-4 mr-1" />
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-500">Cuisine:</span>
                                                    <span className="ml-1 font-medium">{eatery.cuisine}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Rating:</span>
                                                    <span className="ml-1 font-medium flex items-center">
                                                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                                        {eatery.rating.toFixed(1)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Orders:</span>
                                                    <span className="ml-1 font-medium">{eatery.totalOrders}</span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-500">Revenue:</span>
                                                    <span className="ml-1 font-medium">₹{eatery.totalRevenue?.toLocaleString() || 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6 rounded-lg shadow">
                            <div className="flex-1 flex justify-between sm:hidden">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-sm text-gray-700">
                                        Showing <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> to{' '}
                                        <span className="font-medium">{Math.min(currentPage * 10, totalEateries)}</span> of{' '}
                                        <span className="font-medium">{totalEateries}</span> results
                                    </p>
                                </div>
                                <div>
                                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Previous</span>
                                            ‹
                                        </button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                            if (pageNum > totalPages) return null;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                                        pageNum === currentPage
                                                            ? 'z-10 bg-green-50 border-green-500 text-green-600'
                                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <span className="sr-only">Next</span>
                                            ›
                                        </button>
                                    </nav>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Eateries;