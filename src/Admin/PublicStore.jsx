import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Home, Store, MapPin, Phone, Mail, Star, Package,
    DollarSign, Calendar, User, Eye, Search, Filter, ToggleLeft, ToggleRight
} from 'lucide-react';
import Layout from '../Components/Layout';
import toast from 'react-hot-toast';

const PublicStore = () => {
    const navigate = useNavigate();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [checkingUser, setCheckingUser] = useState(true);
    const [publicStoreEnabled, setPublicStoreEnabled] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Fetch current user
    const fetchCurrentUser = async () => {
        try {
            const local = localStorage.getItem('adminUser');
            if (local) {
                setCurrentUser(JSON.parse(local));
            } else {
                const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
                const data = await response.json();
                if (data.tokenValid === false) {
                    navigate('/login', { replace: true });
                    return;
                }
                if (response.ok && data.admin) {
                    setCurrentUser(data.admin);
                    localStorage.setItem('adminUser', JSON.stringify(data.admin));
                }
            }
        } catch (err) {
            console.error('Failed to fetch current user', err);
        } finally {
            setCheckingUser(false);
        }
    };

    // Fetch public stores
    const fetchHomeStores = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/home-stores?page=1&limit=100`, {
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
                    setStores(data.merchants || []);
                } else {
                    throw new Error(data.message || 'Failed to fetch public stores');
                }
            } else {
                throw new Error('Failed to fetch public stores');
            }
        } catch (error) {
            console.error('Error fetching public stores:', error);
            setError(error.message);
            toast.error(error.message || 'Failed to load public stores');
        } finally {
            setLoading(false);
        }
    };

    // Fetch public store status
    const fetchPublicStoreStatus = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/app-controls/public-store-status`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPublicStoreEnabled(data.publicStoreEnabled);
            } else {
                console.error('Failed to fetch public store status');
            }
        } catch (error) {
            console.error('Error fetching public store status:', error);
        }
    };

    // Update public store status
    const updatePublicStoreStatus = async (enabled) => {
        try {
            setUpdatingStatus(true);
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/app-controls/public-store-status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ publicStoreEnabled: enabled }),
            });

            if (response.ok) {
                const data = await response.json();
                setPublicStoreEnabled(data.publicStoreEnabled);
                toast.success(`Public store ${enabled ? 'enabled' : 'disabled'} successfully`);
            } else {
                toast.error('Failed to update public store status');
            }
        } catch (error) {
            console.error('Error updating public store status:', error);
            toast.error('Failed to update public store status');
        } finally {
            setUpdatingStatus(false);
        }
    };

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    useEffect(() => {
        if (currentUser) {
            fetchHomeStores();
            fetchPublicStoreStatus();
        }
    }, [currentUser]);

    // Filter stores based on search term
    const filteredStores = stores.filter(store =>
        store.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.merchantId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.mobile?.includes(searchTerm)
    );

    if (checkingUser) {
        return (
            <Layout title="Public Store">
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Public Store">
            <div className="min-h-screen bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                    <Home className="w-8 h-8 text-green-600" />
                                    Public Store
                                </h1>
                                <p className="mt-1 text-sm text-gray-500">
                                    Browse and manage public store merchants
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-700">
                                    Public Store {publicStoreEnabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <button
                                    onClick={() => updatePublicStoreStatus(!publicStoreEnabled)}
                                    disabled={updatingStatus}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                                        publicStoreEnabled ? 'bg-green-600' : 'bg-gray-200'
                                    } ${updatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                            publicStoreEnabled ? 'translate-x-6' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Search and Filter */}
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder="Search public stores by name, ID, email, or phone..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <span className="text-red-400">⚠️</span>
                                </div>
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-red-800">Error loading public stores</h3>
                                    <p className="mt-1 text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredStores.length === 0 ? (
                                <div className="col-span-full bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                                    <div className="text-center">
                                        <Home className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No public stores found</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {searchTerm ? 'Try adjusting your search criteria.' : 'There are no public stores available yet.'}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                filteredStores.map((store) => (
                                    <div key={store.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                        <div className="p-6">
                                            {/* Store Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                                        <Home className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                                                            {store.displayName}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">ID: {store.merchantId}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Store Details */}
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <MapPin className="w-4 h-4" />
                                                    <span className="truncate">
                                                        {store.storeAddress?.city || 'Unknown City'}, {store.storeAddress?.state || 'Unknown State'}
                                                    </span>
                                                </div>

                                                {store.inventoryCount > 0 && (
                                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                                        <Package className="w-4 h-4" />
                                                        <span>{store.inventoryCount} products in stock</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Store Status */}
                                            {/* <div className="mt-4 pt-4 border-t border-gray-200">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-gray-700">Store Status</span>
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(store.storeStatus || '').toLowerCase() === 'open'
                                                            ? 'bg-green-100 text-green-800'
                                                            : (store.storeStatus || '').toLowerCase() === 'closed'
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {(store.storeStatus || '').toLowerCase() === 'open' ? 'Open' : (store.storeStatus || '').toLowerCase() === 'closed' ? 'Closed' : store.storeStatus}
                                                    </span>
                                                </div>
                                            </div> */}

                                            {/* Action Button */}
                                            <div className="mt-4">
                                                <button
                                                    onClick={() => navigate(`/public-store-details/${store.id}`)}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default PublicStore;