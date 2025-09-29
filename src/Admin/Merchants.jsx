import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, Plus, Eye, Edit, Trash2, Store,
    Phone, Mail, MapPin, Star, Package, DollarSign,
    Calendar, User, MoreVertical, Download
} from 'lucide-react';
import Layout from '../Components/Layout';
import toast from 'react-hot-toast';

const Merchants = () => {
    const navigate = useNavigate();
    const [merchants, setMerchants] = useState([]);
    const [filteredMerchants, setFilteredMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [currentSearch, setCurrentSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMerchants, setTotalMerchants] = useState(0);

    // Fetch merchants from API with search and filters
    const fetchMerchants = async (page = 1, search = '', status = 'all', businessType = 'all') => {
        try {
            setLoading(true);

            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '20'
            });

            if (search && search.trim()) {
                params.append('search', search.trim());
            }

            if (status && status !== 'all') {
                params.append('status', status);
            }

            if (businessType && businessType !== 'all') {
                params.append('businessType', businessType);
            }

            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores?${params}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    // Transform API data to match component expectations
                    const transformedMerchants = data.merchants.map(merchant => ({
                        id: merchant.id,
                        merchantId: merchant.merchantId,
                        name: merchant.displayName,
                        email: merchant.email,
                        phone: merchant.mobile,
                        businessType: merchant.businessType,
                        category: getCategoryFromBusinessType(merchant.businessType),
                        address: merchant.city ? `${merchant.city}, India` : 'Address not available',
                        status: merchant.status,
                        rating: 0, // Will be calculated from reviews later
                        totalOrders: merchant.totalOrders,
                        totalRevenue: merchant.totalRevenue,
                        joinDate: merchant.registrationDate ? new Date(merchant.registrationDate).toISOString().split('T')[0] : 'N/A',
                        profileImage: null,
                        brandingInfo: merchant.brandingInfo || null,
                        documents: {
                            gst: null,
                            fssai: null,
                            pan: null
                        }
                    }));

                    setMerchants(transformedMerchants);
                    setFilteredMerchants(transformedMerchants);
                    setTotalPages(data.pagination.totalPages);
                    setTotalMerchants(data.pagination.total);
                    setCurrentPage(page);
                } else {
                    throw new Error(data.message || 'Failed to fetch merchants');
                }
            } else {
                throw new Error('Failed to fetch merchants');
            }
        } catch (error) {
            console.error('Error fetching merchants:', error);
            toast.error(error.message || 'Failed to load merchants');
            // Set empty array on error
            setMerchants([]);
            setFilteredMerchants([]);
        } finally {
            setLoading(false);
        }
    };

    // Handle search
    const handleSearch = () => {
        setCurrentSearch(searchInput);
        setCurrentPage(1);
        fetchMerchants(1, searchInput, statusFilter, categoryFilter);
    };

    // Handle filter changes
    const handleStatusFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        setCurrentPage(1);
        fetchMerchants(1, currentSearch, newStatus, categoryFilter);
    };

    const handleCategoryFilterChange = (newCategory) => {
        setCategoryFilter(newCategory);
        setCurrentPage(1);
        fetchMerchants(1, currentSearch, statusFilter, newCategory);
    };

    // Handle page change
    const handlePageChange = (page) => {
        fetchMerchants(page, currentSearch, statusFilter, categoryFilter);
    };

    // Helper function to map business type to category
    const getCategoryFromBusinessType = (businessType) => {
        const categoryMap = {
            'sole_proprietor': 'Retail',
            'partnership': 'Retail',
            'pvt_ltd': 'Retail',
            'llp': 'Retail',
            'trust': 'Retail',
            'society': 'Retail',
            'other': 'Other'
        };
        return categoryMap[businessType] || 'Other';
    };

    useEffect(() => {
        fetchMerchants();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            case 'pending_verification':
                return 'bg-yellow-100 text-yellow-800';
            case 'suspended':
                return 'bg-orange-100 text-orange-800';
            case 'closed':
                return 'bg-gray-100 text-gray-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return '🟢';
            case 'inactive':
                return '🔴';
            case 'pending_verification':
                return '🟡';
            case 'suspended':
                return '🟠';
            case 'closed':
                return '⚫';
            default:
                return '⚪';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount || 0);
    };

    const exportMerchants = () => {
        // Create CSV content
        const headers = ['Merchant ID', 'Name', 'Email', 'Phone', 'Business Type', 'Status', 'City', 'Total Orders', 'Total Revenue', 'Join Date'];
        const csvContent = [
            headers.join(','),
            ...filteredMerchants.map(merchant => [
                merchant.merchantId,
                `"${merchant.name}"`,
                merchant.email,
                merchant.phone,
                merchant.businessType,
                merchant.status,
                `"${merchant.address}"`,
                merchant.totalOrders,
                merchant.totalRevenue,
                merchant.joinDate
            ].join(','))
        ].join('\n');

        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `merchants_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Layout title="Merchants">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Merchants</h1>
                        <p className="text-gray-600">Manage and monitor all merchant accounts</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={exportMerchants}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                            <Download size={16} />
                            Export
                        </button>
                        <button
                            onClick={() => navigate('/merchants/add')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                            <Plus size={16} />
                            Add Merchant
                        </button>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search merchants by name, email, phone, or ID..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Search Button */}
                        <button
                            onClick={handleSearch}
                            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Search size={16} />
                            Search
                        </button>

                        {/* Filters Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200"
                        >
                            <Filter size={16} />
                            Filters
                        </button>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => handleStatusFilterChange(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="pending_verification">Pending Verification</option>
                                        <option value="suspended">Suspended</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                                    <select
                                        value={categoryFilter}
                                        onChange={(e) => handleCategoryFilterChange(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="all">All Types</option>
                                        <option value="sole_proprietor">Sole Proprietor</option>
                                        <option value="partnership">Partnership</option>
                                        <option value="pvt_ltd">Private Limited</option>
                                        <option value="llp">LLP</option>
                                        <option value="trust">Trust</option>
                                        <option value="society">Society</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Merchants</p>
                                <p className="text-2xl font-bold text-gray-900">{totalMerchants}</p>
                            </div>
                            <Store className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Active Merchants</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {merchants.filter(m => m.status === 'active').length}
                                </p>
                            </div>
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-green-600 font-bold">A</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pending Verification</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {merchants.filter(m => m.status === 'pending_verification').length}
                                </p>
                            </div>
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="text-yellow-600 font-bold">P</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(merchants.reduce((sum, m) => sum + m.totalRevenue, 0))}
                                </p>
                            </div>
                            <DollarSign className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Merchants List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Merchants ({filteredMerchants.length})
                        </h2>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            <span className="ml-2 text-gray-600">Loading merchants...</span>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Merchant
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Contact
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Business Type
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Performance
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredMerchants.length === 0 ? (
                                            <tr>
                                                <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                    No merchants found matching your criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredMerchants.map((merchant) => (
                                                <tr key={merchant.id} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
                                                                {merchant.brandingInfo?.logoUrl ? (
                                                                    <img
                                                                        src={merchant.brandingInfo.logoUrl}
                                                                        alt={`${merchant.name} logo`}
                                                                        className="w-full h-full object-cover rounded-full"
                                                                        onError={(e) => {
                                                                            e.target.style.display = 'none';
                                                                            e.target.nextSibling.style.display = 'block';
                                                                        }}
                                                                    />
                                                                ) : null}
                                                                <Store className="w-5 h-5 text-green-600" style={{ display: merchant.brandingInfo?.logoUrl ? 'none' : 'block' }} />
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">
                                                                    {merchant.name}
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    ID: {merchant.merchantId}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 flex items-center gap-1">
                                                            <Mail className="w-4 h-4" />
                                                            {merchant.email}
                                                        </div>
                                                        <div className="text-sm text-gray-500 flex items-center gap-1">
                                                            <Phone className="w-4 h-4" />
                                                            {merchant.phone}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-900">{merchant.businessType}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(merchant.status)}`}>
                                                            {getStatusIcon(merchant.status)} {merchant.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {merchant.totalOrders} orders
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {formatCurrency(merchant.totalRevenue)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            onClick={() => navigate(`/merchants/${merchant.id}`)}
                                                            className="text-green-600 cursor-pointer hover:text-green-900"
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                    <div className="text-sm text-gray-700">
                                        Showing page {currentPage} of {totalPages}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Previous
                                        </button>
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`px-3 py-1 border rounded-md text-sm ${pageNum === currentPage
                                                        ? 'bg-green-600 text-white border-green-600'
                                                        : 'border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        })}
                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                        >
                                            Next
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default Merchants;
