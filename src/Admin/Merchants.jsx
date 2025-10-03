import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, Plus, Eye, Edit, Trash2, Store,
    Phone, Mail, MapPin, Star, Package, DollarSign,
    Calendar, User, MoreVertical, Download, Map, X
} from 'lucide-react';
import Layout from '../Components/Layout';
import { GoogleMap, Marker } from '../Components/GoogleMapComponents';
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
    const [showMapModal, setShowMapModal] = useState(false);

    // Calculate map center and zoom based on merchant locations
    const getMapCenterAndZoom = () => {
        const merchantsWithCoords = filteredMerchants.filter(merchant =>
            merchant.operationalInfo?.storeAddress?.coordinates?.latitude &&
            merchant.operationalInfo?.storeAddress?.coordinates?.longitude
        );

        if (merchantsWithCoords.length === 0) {
            // No merchants with coordinates, use Bangalore center
            return {
                center: { lat: 12.9716, lng: 77.5946 },
                zoom: 10
            };
        }

        if (merchantsWithCoords.length === 1) {
            // Single merchant, center on it with closer zoom
            const merchant = merchantsWithCoords[0];
            return {
                center: {
                    lat: parseFloat(merchant.operationalInfo.storeAddress.coordinates.latitude),
                    lng: parseFloat(merchant.operationalInfo.storeAddress.coordinates.longitude)
                },
                zoom: 15
            };
        }

        // Multiple merchants, calculate bounds and center
        let minLat = Infinity, maxLat = -Infinity;
        let minLng = Infinity, maxLng = -Infinity;

        merchantsWithCoords.forEach(merchant => {
            const lat = parseFloat(merchant.operationalInfo.storeAddress.coordinates.latitude);
            const lng = parseFloat(merchant.operationalInfo.storeAddress.coordinates.longitude);

            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLng = Math.min(minLng, lng);
            maxLng = Math.max(maxLng, lng);
        });

        // Calculate center
        const centerLat = (minLat + maxLat) / 2;
        const centerLng = (minLng + maxLng) / 2;

        // Calculate zoom based on bounds
        const latDiff = maxLat - minLat;
        const lngDiff = maxLng - minLng;

        // Simple zoom calculation based on the larger dimension
        const maxDiff = Math.max(latDiff, lngDiff);
        let zoom = 10; // default

        if (maxDiff < 0.01) zoom = 16; // Very close together
        else if (maxDiff < 0.05) zoom = 14; // Close together
        else if (maxDiff < 0.1) zoom = 12; // Medium spread
        else if (maxDiff < 0.5) zoom = 10; // Large spread
        else zoom = 8; // Very spread out

        return {
            center: { lat: centerLat, lng: centerLng },
            zoom: zoom
        };
    };

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
                        operationalInfo: merchant.operationalInfo || null,
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
            case 'hold':
                return 'bg-yellow-100 text-yellow-800';
            case 'banned':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'active':
                return '🟢';
            case 'hold':
                return '�';
            case 'banned':
                return '�';
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
                            onClick={() => setShowMapModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Map size={16} />
                            Merchants Map
                        </button>
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
                                        <option value="hold">Hold</option>
                                        <option value="banned">Banned</option>
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
                                <p className="text-sm font-medium text-gray-600">On Hold</p>
                                <p className="text-2xl font-bold text-yellow-600">
                                    {merchants.filter(m => m.status === 'hold').length}
                                </p>
                            </div>
                            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                <span className="text-yellow-600 font-bold">H</span>
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

            {/* Merchants Map Modal */}
            {showMapModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    <Map size={20} />
                                    Grojet Merchants Map View
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    🟢 Green markers: Merchants with coordinates | 🔴 Red markers: Location not set (edit to add coordinates)
                                </p>
                            </div>
                            <button
                                onClick={() => setShowMapModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6">
                            <div className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200">
                                <GoogleMap
                                    center={getMapCenterAndZoom().center}
                                    zoom={getMapCenterAndZoom().zoom}
                                    style={{ height: '100%', width: '100%' }}
                                >
                                    {filteredMerchants.map((merchant) => {
                                        const hasCoordinates = merchant.operationalInfo?.storeAddress?.coordinates?.latitude && 
                                                              merchant.operationalInfo?.storeAddress?.coordinates?.longitude;

                                        if (hasCoordinates) {
                                            return (
                                                <Marker
                                                    key={merchant.id}
                                                    position={{
                                                        lat: parseFloat(merchant.operationalInfo.storeAddress.coordinates.latitude),
                                                        lng: parseFloat(merchant.operationalInfo.storeAddress.coordinates.longitude)
                                                    }}
                                                    title={merchant.name}
                                                    icon={{
                                                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M20 2C14.48 2 10 6.48 10 12c0 7.74 8.5 16.5 9.5 17.5L20 32l.5-.5C21.5 28.5 30 19.74 30 12c0-5.52-4.48-10-10-10z" fill="red" stroke="white" stroke-width="2"/>
                                                                <circle cx="20" cy="12" r="4" fill="white"/>
                                                            </svg>
                                                        `),
                                                        scaledSize: new window.google.maps.Size(40, 40),
                                                        anchor: new window.google.maps.Point(20, 32)
                                                    }}
                                                    infoContent={`
                                                        <div style="max-width: 280px;">
                                                            <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">${merchant.name}</div>
                                                            <div style="margin-bottom: 4px;"><strong>ID:</strong> ${merchant.merchantId}</div>
                                                            <div style="margin-bottom: 4px;"><strong>Status:</strong> 
                                                                <span style="color: ${merchant.status === 'active' ? '#10B981' : merchant.status === 'hold' ? '#F59E0B' : '#EF4444'}; font-weight: 500;">
                                                                    ${merchant.status}
                                                                </span>
                                                            </div>
                                                            <div style="margin-bottom: 4px;"><strong>Type:</strong> ${merchant.businessType}</div>
                                                            <div style="margin-bottom: 4px;"><strong>Address:</strong> ${merchant.operationalInfo?.storeAddress?.street || 'N/A'}</div>
                                                            <div style="margin-bottom: 4px;"><strong>Phone:</strong> ${merchant.mobile}</div>
                                                            <div style="margin-bottom: 4px;"><strong>Orders:</strong> ${merchant.totalOrders || 0}</div>
                                                            <div style="margin-bottom: 8px;"><strong>Revenue:</strong> ₹${merchant.totalRevenue || 0}</div>
                                                            <div style="font-size: 12px; color: #6B7280;">
                                                                Lat: ${merchant.operationalInfo.storeAddress.coordinates.latitude}, 
                                                                Lng: ${merchant.operationalInfo.storeAddress.coordinates.longitude}
                                                            </div>
                                                        </div>
                                                    `}
                                                />
                                            );
                                        } else {
                                            // Show merchants without coordinates at a default location with a different marker
                                            return (
                                                <Marker
                                                    key={merchant.id}
                                                    position={{
                                                        lat: 12.9716 + (Math.random() - 0.5) * 0.01, // Slight random offset from center
                                                        lng: 77.5946 + (Math.random() - 0.5) * 0.01
                                                    }}
                                                    title={`${merchant.name} (Location not set)`}
                                                    icon={{
                                                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                                            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M20 2C14.48 2 10 6.48 10 12c0 7.74 8.5 16.5 9.5 17.5L20 32l.5-.5C21.5 28.5 30 19.74 30 12c0-5.52-4.48-10-10-10z" fill="#EF4444" stroke="white" stroke-width="2"/>
                                                                <circle cx="20" cy="12" r="4" fill="white"/>
                                                                <text x="20" y="16" text-anchor="middle" font-size="12" fill="#EF4444" font-weight="bold">!</text>
                                                            </svg>
                                                        `),
                                                        scaledSize: new window.google.maps.Size(40, 40),
                                                        anchor: new window.google.maps.Point(20, 32)
                                                    }}
                                                    infoContent={`
                                                        <div style="max-width: 280px;">
                                                            <div style="font-weight: 600; margin-bottom: 8px; color: #1f2937;">${merchant.name}</div>
                                                            <div style="margin-bottom: 4px;"><strong>ID:</strong> ${merchant.merchantId}</div>
                                                            <div style="margin-bottom: 4px;"><strong>Status:</strong> 
                                                                <span style="color: ${merchant.status === 'active' ? '#10B981' : merchant.status === 'hold' ? '#F59E0B' : '#EF4444'}; font-weight: 500;">
                                                                    ${merchant.status}
                                                                </span>
                                                            </div>
                                                            <div style="margin-bottom: 4px;"><strong>Type:</strong> ${merchant.businessType}</div>
                                                            <div style="margin-bottom: 4px;"><strong>Address:</strong> ${merchant.operationalInfo?.storeAddress?.street || 'N/A'}</div>
                                                            <div style="margin-bottom: 4px;"><strong>Phone:</strong> ${merchant.mobile}</div>
                                                            <div style="margin-bottom: 4px;"><strong>Orders:</strong> ${merchant.totalOrders || 0}</div>
                                                            <div style="margin-bottom: 8px;"><strong>Revenue:</strong> ₹${merchant.totalRevenue || 0}</div>
                                                            <div style="background-color: #FEF3C7; padding: 8px; border-radius: 4px; border: 1px solid #F59E0B; margin-top: 8px;">
                                                                <strong style="color: #92400E;">⚠️ Location not set</strong><br/>
                                                                <span style="color: #92400E; font-size: 12px;">Edit merchant to add coordinates</span>
                                                            </div>
                                                        </div>
                                                    `}
                                                />
                                            );
                                        }
                                    })}
                                </GoogleMap>
                            </div>
                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Showing {filteredMerchants.length} merchants on map
                                    {filteredMerchants.filter(m => m.operationalInfo?.storeAddress?.coordinates?.latitude).length > 0 && (
                                        <span className="ml-2 text-green-600">
                                            ({filteredMerchants.filter(m => m.operationalInfo?.storeAddress?.coordinates?.latitude).length} with coordinates)
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowMapModal(false)}
                                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                                >
                                    Close Map
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default Merchants;
