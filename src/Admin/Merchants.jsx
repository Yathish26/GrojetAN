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
    const [storeStatusFilter, setStoreStatusFilter] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMerchants, setTotalMerchants] = useState(0);
    const [showMapModal, setShowMapModal] = useState(false);
    const [allMerchantsForMap, setAllMerchantsForMap] = useState([]);
    const [loadingMap, setLoadingMap] = useState(false);
    const [stats, setStats] = useState({
        totalMerchants: 0,
        openMerchants: 0,
        activeMerchants: 0,
        holdMerchants: 0,
        bannedMerchants: 0,
        totalRevenue: 0
    });

    // Calculate map center and zoom based on merchant locations
    const getMapCenterAndZoom = () => {
        // Use all merchants for map view, filtered merchants for other calculations
        const merchantsToUse = showMapModal ? allMerchantsForMap : filteredMerchants;
        const merchantsWithCoords = merchantsToUse.filter(merchant =>
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
    const fetchMerchants = async (page = 1, search = '', status = 'all', storeStatus = 'all') => {
        try {
            setLoading(true);

            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: '5'
            });

            if (search && search.trim()) {
                params.append('search', search.trim());
            }

            if (status && status !== 'all') {
                params.append('status', status);
            }

            if (storeStatus && storeStatus !== 'all') {
                params.append('storeStatus', storeStatus === 'Open' ? 'open' : 'close');
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
                if (data.tokenValid === false) {
                    navigate('/login', { replace: true });
                    return;
                }
                if (data.success) {
                    console.log('API Response:', data); // Debug log
                    // Transform API data to match component expectations
                    const transformedMerchants = data.merchants.map(merchant => ({
                        id: merchant.id,
                        merchantId: merchant.merchantId,
                        name: merchant.displayName,
                        email: merchant.email,
                        phone: merchant.mobile,
                        address: merchant.city ? `${merchant.city}, India` : 'Address not available',
                        status: merchant.status,
                        storeStatus: merchant.storeStatus,
                        rating: merchant.rating || 0, // Rating from backend
                        totalOrders: merchant.totalOrders,
                        totalRevenue: merchant.totalRevenue,
                        todaysOrders: merchant.todaysOrders || 0,
                        todaysRevenue: merchant.todaysRevenue || 0,
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
                    setStats(data.stats);
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
            setStats({
                totalMerchants: 0,
                openMerchants: 0,
                activeMerchants: 0,
                holdMerchants: 0,
                bannedMerchants: 0,
                totalRevenue: 0
            });
        } finally {
            setLoading(false);
        }
    };

    // Fetch all merchants for map view
    const fetchAllMerchantsForMap = async () => {
        try {
            setLoadingMap(true);

            // Fetch all merchants with a high limit (set to 10000 to get all)
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores?page=1&limit=10000`, {
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
                    // Transform API data to match component expectations
                    const transformedMerchants = data.merchants.map(merchant => ({
                        id: merchant.id,
                        merchantId: merchant.merchantId,
                        name: merchant.displayName,
                        email: merchant.email,
                        phone: merchant.mobile,
                        address: merchant.city ? `${merchant.city}, India` : 'Address not available',
                        status: merchant.status,
                        storeStatus: merchant.storeStatus,
                        rating: merchant.rating || 0, // Rating from backend
                        totalOrders: merchant.totalOrders,
                        totalRevenue: merchant.totalRevenue,
                        todaysOrders: merchant.todaysOrders || 0,
                        todaysRevenue: merchant.todaysRevenue || 0,
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

                    setAllMerchantsForMap(transformedMerchants);
                } else {
                    throw new Error(data.message || 'Failed to fetch merchants for map');
                }
            } else {
                throw new Error('Failed to fetch merchants for map');
            }
        } catch (error) {
            console.error('Error fetching merchants for map:', error);
            toast.error(error.message || 'Failed to load merchants for map');
            setAllMerchantsForMap([]);
        } finally {
            setLoadingMap(false);
        }
    };

    // Handle search
    const handleSearch = () => {
        setCurrentSearch(searchInput);
        setCurrentPage(1);
        fetchMerchants(1, searchInput, statusFilter, storeStatusFilter);
    };

    // Handle filter changes
    const handleStatusFilterChange = (newStatus) => {
        setStatusFilter(newStatus);
        setCurrentPage(1);
        fetchMerchants(1, currentSearch, newStatus, storeStatusFilter);
    };

    const handleStoreStatusFilterChange = (newStoreStatus) => {
        setStoreStatusFilter(newStoreStatus);
        setCurrentPage(1);
        fetchMerchants(1, currentSearch, statusFilter, newStoreStatus);
    };

    // Handle page change
    const handlePageChange = (page) => {
        fetchMerchants(page, currentSearch, statusFilter, storeStatusFilter);
    };

    useEffect(() => {
        fetchMerchants(1, '', 'all', 'all');
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Open':
                return 'bg-green-100 text-green-800';
            case 'Closed':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-blue-100 text-blue-800';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Open':
                return '🟢';
            case 'Closed':
                return '🔴';
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

    const exportMerchants = async () => {
        try {
            setLoading(true);

            // Fetch all merchants data from backend
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/export/all`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch export data');
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Export failed');
            }

            const merchants = result.data;

            if (merchants.length === 0) {
                toast.error('No merchants found to export');
                return;
            }

            // Create CSV headers - all fields except password
            const headers = [
                'Merchant ID', 'Display Name', 'Website', 'Established Year',
                'Owner Full Name', 'Owner Mobile', 'Owner Alternate Mobile', 'Owner Email',
                'Account Number', 'IFSC Code', 'Bank Name', 'Branch Name', 'Account Holder Name',
                'Store Street', 'Store City', 'Store State', 'Store Pincode', 'Store Country', 'Store Landmark', 'Store Latitude', 'Store Longitude',
                'Opening Time', 'Closing Time', 'Store Type', 'Delivery Type',
                'Logo URL', 'Banner URL', 'Tagline', 'Store Description', 'Facebook URL', 'Instagram URL', 'Twitter URL', 'WhatsApp URL', 'Google Business URL',
                'Documents Link', 'Store Banner',
                'Commission Percentage', 'Commission Minimum Settlement',
                'Status', 'Store Status',
                'Rating', 'Total Ratings', 'Total Orders', 'Completed Orders', 'Cancelled Orders', 'Total Revenue', 'Average Order Value', 'Response Time',
                'Registration Date', 'Last Login', 'Updated At',
                'Device Platform', 'Device Name', 'Last Device Login'
            ];

            // Create CSV content
            const csvContent = [
                headers.join(','),
                ...merchants.map(merchant => [
                    `"${merchant.merchantId}"`,
                    `"${merchant.displayName}"`,
                    `"${merchant.website}"`,
                    `"${merchant.establishedYear}"`,
                    `"${merchant.ownerFullName}"`,
                    `"${merchant.ownerMobile}"`,
                    `"${merchant.ownerAlternateMobile}"`,
                    `"${merchant.ownerEmail}"`,
                    `"${merchant.accountNumber}"`,
                    `"${merchant.ifscCode}"`,
                    `"${merchant.bankName}"`,
                    `"${merchant.branchName}"`,
                    `"${merchant.accountHolderName}"`,
                    `"${merchant.storeStreet}"`,
                    `"${merchant.storeCity}"`,
                    `"${merchant.storeState}"`,
                    `"${merchant.storePincode}"`,
                    `"${merchant.storeCountry}"`,
                    `"${merchant.storeLandmark}"`,
                    `"${merchant.storeLatitude}"`,
                    `"${merchant.storeLongitude}"`,
                    `"${merchant.openingTime}"`,
                    `"${merchant.closingTime}"`,
                    `"${merchant.storeType}"`,
                    `"${merchant.deliveryType}"`,
                    `"${merchant.logoUrl}"`,
                    `"${merchant.bannerUrl}"`,
                    `"${merchant.tagline}"`,
                    `"${merchant.storeDescription}"`,
                    `"${merchant.facebookUrl}"`,
                    `"${merchant.instagramUrl}"`,
                    `"${merchant.twitterUrl}"`,
                    `"${merchant.whatsappUrl}"`,
                    `"${merchant.googleBusinessUrl}"`,
                    `"${merchant.documentsLink}"`,
                    `"${merchant.storeBanner}"`,
                    `"${merchant.commissionPercentage}"`,
                    `"${merchant.commissionMinimumSettlement}"`,
                    `"${merchant.status}"`,
                    `"${merchant.storeStatus}"`,
                    `"${merchant.rating}"`,
                    `"${merchant.totalRatings}"`,
                    `"${merchant.totalOrders}"`,
                    `"${merchant.completedOrders}"`,
                    `"${merchant.cancelledOrders}"`,
                    `"${merchant.totalRevenue}"`,
                    `"${merchant.averageOrderValue}"`,
                    `"${merchant.responseTime}"`,
                    `"${merchant.registrationDate}"`,
                    `"${merchant.lastLogin}"`,
                    `"${merchant.updatedAt}"`,
                    `"${merchant.devicePlatform}"`,
                    `"${merchant.deviceName}"`,
                    `"${merchant.lastDeviceLogin}"`
                ].join(','))
            ].join('\n');

            // Create and download the file
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `all_merchants_export_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Successfully exported ${merchants.length} merchants`);

        } catch (error) {
            console.error('Export error:', error);
            toast.error('Failed to export merchants data');
        } finally {
            setLoading(false);
        }
    };

    const forceCloseAllMerchants = async () => {
        if (!confirm('Are you sure you want to force close all open merchant shops? This action cannot be undone.')) {
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/force-close-all`, {
                method: 'PUT',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (data.tokenValid === false) {
                navigate('/login', { replace: true });
                return;
            }

            if (response.ok) {
                if (data.success) {
                    toast.success(data.message || 'All open merchant shops have been closed');
                    // Refresh the merchants list
                    fetchMerchants(1, currentSearch, statusFilter, storeStatusFilter);
                } else {
                    throw new Error(data.message || 'Failed to force close merchants');
                }
            } else {
                throw new Error('Failed to force close merchants');
            }
        } catch (error) {
            console.error('Force close error:', error);
            toast.error(error.message || 'Failed to force close merchants');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Merchants">
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-gray-900">Merchants</h1>
                                    <p className="mt-1 text-sm text-gray-500">Manage and monitor all merchant accounts</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        setShowMapModal(true);
                                        fetchAllMerchantsForMap();
                                    }}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                >
                                    <Map size={16} className="mr-2" />
                                    Merchants Map
                                </button>
                                <button
                                    onClick={exportMerchants}
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
                                    onClick={forceCloseAllMerchants}
                                    disabled={loading}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {loading ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-red-300 border-t-red-100 rounded-full mr-2"></div>
                                    ) : (
                                        <X size={16} className="mr-2" />
                                    )}
                                    {loading ? 'Closing...' : 'Force Close All'}
                                </button>
                                <button
                                    onClick={() => navigate('/merchants/add')}
                                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                >
                                    <Plus size={16} className="mr-2" />
                                    Add Merchant
                                </button>
                            </div>
                        </div>
                    </div>

          {/* Search and Filters */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Search className="w-6 h-6" />
                Search & Filters
              </h2>
            </div>
            <div className="p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="flex gap-4">
                  <div className="flex-1 max-w-lg">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search merchants by name, email, or ID..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleSearch}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  >
                    <Search size={16} className="mr-2" />
                    Search
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filters:</span>
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Account Status:</span>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    {[
                      { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                      { key: 'active', label: 'Active', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                      { key: 'hold', label: 'Hold', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                      { key: 'banned', label: 'Banned', color: 'bg-red-100 text-red-700 hover:bg-red-200' }
                    ].map(({ key, label, color }) => (
                      <button
                        key={key}
                        onClick={() => handleStatusFilterChange(key)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          statusFilter === key
                            ? color.replace('hover:', '')
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        } ${key !== 'all' ? 'border-l border-gray-300' : ''}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Store Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Store Status:</span>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    {[
                      { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                      { key: 'Open', label: 'Open', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                      { key: 'Closed', label: 'Closed', color: 'bg-red-100 text-red-700 hover:bg-red-200' }
                    ].map(({ key, label, color }) => (
                      <button
                        key={key}
                        onClick={() => handleStoreStatusFilterChange(key)}
                        className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                          storeStatusFilter === key
                            ? color.replace('hover:', '')
                            : 'bg-white text-gray-600 hover:bg-gray-50'
                        } ${key !== 'all' ? 'border-l border-gray-300' : ''}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                {(statusFilter !== 'all' || storeStatusFilter !== 'all' || searchInput) && (
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setStoreStatusFilter('all');
                      setSearchInput('');
                      setCurrentSearch('');
                      setCurrentPage(1);
                      fetchMerchants(1, '', 'all', 'all');
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    <X size={16} className="mr-1" />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Total Merchants</p>
                                        <p className="text-3xl font-bold text-white">{stats.totalMerchants}</p>
                                    </div>
                                    <Store className="w-8 h-8 text-blue-200" />
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-600">All registered merchants in the system</p>
                            </div>
                        </div>
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Open Merchants</p>
                                        <p className="text-3xl font-bold text-white">{stats.openMerchants}</p>
                                    </div>
                                    <div className="w-8 h-8 bg-blue-200 flex items-center justify-center rounded-lg">
                                        <span className="text-blue-700 font-bold text-sm">O</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-600">Merchants currently open for business</p>
                            </div>
                        </div>
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">On Hold</p>
                                        <p className="text-3xl font-bold text-white">{stats.holdMerchants}</p>
                                    </div>
                                    <div className="w-8 h-8 bg-blue-200 flex items-center justify-center rounded-lg">
                                        <span className="text-blue-700 font-bold text-sm">H</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-600">Merchants with accounts on hold</p>
                            </div>
                        </div>
                        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-blue-100 uppercase tracking-wide">Total Revenue</p>
                                        <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                                    </div>
                                    <DollarSign className="w-8 h-8 text-blue-200" />
                                </div>
                            </div>
                            <div className="p-6">
                                <p className="text-sm text-gray-600">Total revenue generated by all merchants</p>
                            </div>
                        </div>
                    </div>

                    {/* Merchants List */}
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-8">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                                <Package className="w-6 h-6" />
                                Merchants ({filteredMerchants.length})
                            </h2>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin h-8 w-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                                <span className="ml-3 text-gray-600 font-medium">Loading merchants...</span>
                            </div>
                        ) : (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Merchant
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Contact
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Today's Performance
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {filteredMerchants.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Store className="w-12 h-12 text-gray-300" />
                                                            <p className="text-lg font-medium">No merchants found</p>
                                                            <p className="text-sm">Try adjusting your search criteria</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredMerchants.map((merchant) => (
                                                    <tr key={merchant.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="flex items-center">
                                                                <div className="w-12 h-12 bg-green-100 flex items-center justify-center overflow-hidden rounded-lg">
                                                                    {merchant.brandingInfo?.logoUrl ? (
                                                                        <img
                                                                            src={merchant.brandingInfo.logoUrl}
                                                                            alt={`${merchant.name} logo`}
                                                                            className="w-full h-full object-cover"
                                                                            onError={(e) => {
                                                                                e.target.style.display = 'none';
                                                                                e.target.nextSibling.style.display = 'block';
                                                                            }}
                                                                        />
                                                                    ) : null}
                                                                    <Store className="w-6 h-6 text-green-600" style={{ display: merchant.brandingInfo?.logoUrl ? 'none' : 'block' }} />
                                                                </div>
                                                                <div className="ml-4">
                                                                    <div className="text-sm font-semibold text-gray-900">
                                                                        {merchant.name}
                                                                    </div>
                                                                    <div className="text-sm text-gray-500 font-mono">
                                                                        ID: {merchant.merchantId}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm text-gray-900 flex items-center gap-2 mb-1">
                                                                <Mail className="w-4 h-4 text-gray-400" />
                                                                {merchant.email}
                                                            </div>
                                                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                                                <Phone className="w-4 h-4 text-gray-400" />
                                                                {merchant.phone}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(merchant.storeStatus)}`}>
                                                                {getStatusIcon(merchant.storeStatus)} {merchant.storeStatus}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <div className="text-sm font-semibold text-gray-900">
                                                                {merchant.todaysOrders} orders today
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {formatCurrency(merchant.todaysRevenue)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap">
                                                            <button
                                                                onClick={() => navigate(`/merchants/${merchant.id}`)}
                                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                                            >
                                                                <Eye size={14} className="mr-1.5" />
                                                                View Details
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden p-6">
                                {filteredMerchants.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                        <p className="text-lg font-medium text-gray-500">No merchants found</p>
                                        <p className="text-sm text-gray-400">Try adjusting your search criteria</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredMerchants.map((merchant) => (
                                            <div key={merchant.id} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-14 h-14 bg-green-100 flex items-center justify-center overflow-hidden flex-shrink-0 rounded-lg">
                                                        {merchant.brandingInfo?.logoUrl ? (
                                                            <img
                                                                src={merchant.brandingInfo.logoUrl}
                                                                alt={`${merchant.name} logo`}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.style.display = 'none';
                                                                    e.target.nextSibling.style.display = 'block';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <Store className="w-7 h-7 text-green-600" style={{ display: merchant.brandingInfo?.logoUrl ? 'none' : 'block' }} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between mb-2">
                                                            <div className="flex-1 min-w-0">
                                                                <h3 className="text-base font-semibold text-gray-900 truncate">
                                                                    {merchant.name}
                                                                </h3>
                                                                <p className="text-sm text-gray-500 font-mono">ID: {merchant.merchantId}</p>
                                                            </div>
                                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ml-2 flex-shrink-0 ${getStatusColor(merchant.storeStatus)}`}>
                                                                {getStatusIcon(merchant.storeStatus)} {merchant.storeStatus}
                                                            </span>
                                                        </div>

                                                        <div className="space-y-2 mb-3">
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Mail className="w-4 h-4 text-gray-400" />
                                                                <span className="truncate">{merchant.email}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                                <Phone className="w-4 h-4 text-gray-400" />
                                                                <span>{merchant.phone}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                                            <div className="text-sm text-gray-600">
                                                                <span className="font-medium">{merchant.todaysOrders}</span> orders • <span className="font-medium">{formatCurrency(merchant.todaysRevenue)}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => navigate(`/merchants/${merchant.id}`)}
                                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                                            >
                                                                <Eye size={14} className="mr-1.5" />
                                                                View
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Pagination */}
                            {(() => {
                                console.log('Pagination check:', { totalPages, totalMerchants: stats.totalMerchants });
                                return (totalPages > 1 || stats.totalMerchants > 10) && (
                                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-4">
                                        <div className="text-sm text-gray-700 font-medium">
                                            Showing page <span className="font-semibold">{currentPage}</span> of <span className="font-semibold">{totalPages}</span> ({stats.totalMerchants} total merchants)
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handlePageChange(currentPage - 1)}
                                                disabled={currentPage === 1}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Previous
                                            </button>
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                                                return (
                                                    <button
                                                        key={pageNum}
                                                        onClick={() => handlePageChange(pageNum)}
                                                        className={`inline-flex items-center px-3 py-2 border shadow-sm text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors ${
                                                            pageNum === currentPage
                                                                ? 'border-green-500 bg-green-50 text-green-700'
                                                                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {pageNum}
                                                    </button>
                                                );
                                            })}
                                            <button
                                                onClick={() => handlePageChange(currentPage + 1)}
                                                disabled={currentPage * 5 >= totalMerchants}
                                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()}
                        </>
                    )}
                    </div>
            </div>

            {/* Merchants Map Modal */}
            {showMapModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden rounded-lg">
                        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                            <div className="flex items-center justify-between">
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                                        <Map size={24} />
                                        <span className="truncate">Grojet Merchants Map View</span>
                                    </h2>
                                    <p className="text-sm text-blue-100 mt-1">
                                        🟢 Green markers: Merchants with coordinates | 🔴 Red markers: Location not set
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowMapModal(false)}
                                    className="p-2 hover:bg-blue-500 rounded-lg ml-4 flex-shrink-0 transition-colors"
                                >
                                    <X size={20} className="text-white" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            {loadingMap ? (
                                <div className="flex items-center justify-center py-12 h-[60vh]">
                                    <div className="text-center">
                                        <div className="animate-spin h-10 w-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto mb-4"></div>
                                        <span className="text-gray-600 font-medium">Loading all merchants for map...</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-[60vh] w-full overflow-hidden border-2 border-gray-200 rounded-lg shadow-sm">
                                    <GoogleMap
                                        center={getMapCenterAndZoom().center}
                                        zoom={getMapCenterAndZoom().zoom}
                                        style={{ height: '100%', width: '100%' }}
                                    >
                                        {allMerchantsForMap.map((merchant) => {
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
                                                                    <span style="color: ${merchant.storeStatus === 'Open' ? '#10B981' : merchant.storeStatus === 'Closed' ? '#EF4444' : '#6B7280'}; font-weight: 500;">
                                                                        ${merchant.storeStatus}
                                                                    </span>
                                                                </div>
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
                                                                    <span style="color: ${merchant.storeStatus === 'Open' ? '#10B981' : merchant.storeStatus === 'Closed' ? '#EF4444' : '#6B7280'}; font-weight: 500;">
                                                                        ${merchant.storeStatus}
                                                                    </span>
                                                                </div>
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
                            )}
                            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-sm text-gray-600 text-center sm:text-left">
                                    Showing {allMerchantsForMap.length} merchants on map
                                    {allMerchantsForMap.filter(m => m.operationalInfo?.storeAddress?.coordinates?.latitude).length > 0 && (
                                        <span className="ml-2 text-green-600 font-medium">
                                            ({allMerchantsForMap.filter(m => m.operationalInfo?.storeAddress?.coordinates?.latitude).length} with coordinates)
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => setShowMapModal(false)}
                                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                                >
                                    Close Map
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </Layout>
    );
};

export default Merchants;
