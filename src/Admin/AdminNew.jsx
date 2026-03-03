import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import {
    Package,
    Zap
} from 'lucide-react';
import LoaderSpinner from '../Components/Loader';


export default function Admin() {
    const [dashboardStats, setDashboardStats] = useState({
        orders: {},
        xpressOrders: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [redirecting, setRedirecting] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [checkingUser, setCheckingUser] = useState(true);
    const navigate = useNavigate();

    const getCachedAdmin = () => {
        try {
            const stored = localStorage.getItem('adminUser');
            return stored ? JSON.parse(stored) : null;
        } catch (err) {
            console.warn('Failed to read cached admin', err);
            return null;
        }
    };

    const cachedAdmin = getCachedAdmin();
    const [userState, setUserState] = useState(() => cachedAdmin);
    const [userChecking, setUserChecking] = useState(() => !cachedAdmin);

    const fetchCurrentUser = useCallback(async () => {
        try {
            if (!userState) {
                setUserChecking(true);
            }
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
                setUserState(data.admin);
                try {
                    localStorage.setItem('adminUser', JSON.stringify(data.admin));
                } catch (err) {
                    console.warn('Failed to persist admin cache', err);
                }
            } else {
                setRedirecting(true);
                navigate('/login', { replace: true });
                return;
            }
        } catch (err) {
            console.error('Failed to fetch current user', err);
            setRedirecting(true);
            navigate('/login', { replace: true });
        } finally {
            setUserChecking(false);
        }
    }, [navigate, userState]);

    useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);

    // Role check: delivery_manager should not access dashboard
    if (!userChecking && currentUser?.role === 'delivery_manager') {
        navigate('/delivery-agents', { replace: true });
        return null;
    }

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                const [ordersRes, xpressOrdersRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_SERVER}/admin/orders/stats/overview`, { credentials: 'include' }),
                    fetch(`${import.meta.env.VITE_SERVER}/admin/xpress/stats/overview`, { credentials: 'include' })
                ]);

                if (ordersRes.status === 401 || xpressOrdersRes.status === 401) {
                    setRedirecting(true);
                    navigate('/login', { replace: true });
                    return;
                }

                const [ordersData, xpressOrdersData] = await Promise.all([
                    ordersRes.json(),
                    xpressOrdersRes.json()
                ]);

                if (ordersData.tokenValid === false || xpressOrdersData.tokenValid === false) {
                    setRedirecting(true);
                    navigate('/login', { replace: true });
                    return;
                }

                setDashboardStats({
                    orders: ordersData.success ? ordersData.stats : {},
                    xpressOrders: xpressOrdersData.success ? xpressOrdersData.stats : {}
                });
            } catch (e) {
                console.error('Dashboard fetch error:', e);
                setError('Failed to load dashboard data: ' + e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate]);

    // Prevent blink: show spinner while loading, render nothing if redirecting
    if (redirecting) return null;
    if (loading || userChecking) {
        return (
            <div className="flex flex-col items-center gap-4 justify-center h-screen">
                <LoaderSpinner />
                <span className="ml-4 text-green-700 text-lg font-semibold">Loading dashboard...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Layout title="Dashboard">
                <div className="p-6">
                    <div className="bg-red-50 border border-red-200" style={{ borderRadius: '0.25rem' }}>
                        <p className="text-red-800">{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="mt-2 text-green-700 hover:text-green-900 underline"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Dashboard">
            <div className="p-6 bg-gray-50 min-h-screen">
                {/* Welcome Section */}
                <div className="mb-8">
                    <p className="text-gray-600">Today's Order Summary</p>
                </div>

                {/* Total Orders Display */}
                <div className="mb-8">
                    <div className="bg-white border border-gray-200 p-8 text-center" style={{ borderRadius: '0.25rem' }}>
                        <div className="text-sm font-medium text-gray-500 mb-2">Total Today's Orders</div>
                        <div className="text-5xl font-bold text-green-700 mb-2">
                            {(dashboardStats.orders.completedOrders || 0) + (dashboardStats.xpressOrders.deliveredOrders || 0)}
                        </div>
                        <div className="text-2xl text-gray-600">
                            <span className="text-green-600 font-bold">{dashboardStats.orders.completedOrders || 0}</span> + <span className="text-red-600 font-bold">{dashboardStats.xpressOrders.deliveredOrders || 0}</span>
                        </div>
                    </div>
                </div>

                {/* Today's Orders Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div 
                        className="bg-white border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow" 
                        style={{ borderRadius: '0.25rem' }}
                        onClick={() => navigate('/orders')}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Today's Merchant Orders</p>
                                <p className="text-3xl font-bold text-green-700">
                                    {dashboardStats.orders.completedOrders || 0}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                    {dashboardStats.orders.cancelledOrders || 0} cancelled
                                </p>
                            </div>
                            <Package className="h-10 w-10 text-green-600" />
                        </div>
                    </div>

                    <div 
                        className="bg-white border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow" 
                        style={{ borderRadius: '0.25rem' }}
                        onClick={() => navigate('/xpress')}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Today's Xpress Orders</p>
                                <p className="text-3xl font-bold text-green-700">
                                    {dashboardStats.xpressOrders.deliveredOrders || 0}
                                </p>
                                <p className="text-xs text-red-600 mt-1">
                                    {dashboardStats.xpressOrders.cancelledOrders || 0} cancelled
                                </p>
                            </div>
                        <Zap className="h-10 w-10 text-green-600" />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
