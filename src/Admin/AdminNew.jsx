import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import {
    Package, Plus, Store, ChartBarStacked,
    ShoppingCart, Truck, MapPin, BarChart3, TrendingUp,
    Users, Clock, CircleCheck,
    IndianRupee
} from 'lucide-react';
import LoaderSpinner from '../Components/Loader';


export default function Admin() {
    const [dashboardStats, setDashboardStats] = useState({
        inventoryCount: null,
        orders: {},
        agents: {},
        users: {},
        revenue: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [redirecting, setRedirecting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                const [inventoryRes, ordersRes, agentsRes, usersRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_SERVER}/admin/products/count`, { credentials: 'include' }),
                    fetch(`${import.meta.env.VITE_SERVER}/admin/orders/stats/overview`, { credentials: 'include' }),
                    fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/stats/overview`, { credentials: 'include' }),
                    fetch(`${import.meta.env.VITE_SERVER}/admin/users/count`, { credentials: 'include' })
                ]);

                if (inventoryRes.status === 401 || ordersRes.status === 401 ||
                    agentsRes.status === 401 || usersRes.status === 401) {
                    setRedirecting(true);
                    navigate('/login', { replace: true });
                    return;
                }

                const [inventoryData, ordersData, agentsData, usersData] = await Promise.all([
                    inventoryRes.json(),
                    ordersRes.json(),
                    agentsRes.json(),
                    usersRes.json()
                ]);

                setDashboardStats({
                    inventoryCount: inventoryData.success ? inventoryData.count : 0,
                    orders: ordersData.success ? ordersData.stats : {},
                    agents: agentsData.success ? agentsData.stats : {},
                    users: usersData.success ? { count: usersData.count } : {},
                    revenue: ordersData.success ? {
                        total: ordersData.stats.totalRevenue,
                        today: ordersData.stats.todayRevenue
                    } : {}
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
    if (loading) {
        return (
            <div className="flex flex-col items-center gap-4 justify-center h-screen">
                <LoaderSpinner />
                <span className="ml-4 text-green-700 text-lg font-semibold">Loading dashboard...</span>
            </div>
        );
    }

    // Boxy, green-themed, minimal color, industry-standard card
    const StatCard = ({ title, value, icon: Icon, trend = null, onClick = null }) => (
        <div
            className={`bg-white border border-gray-200 ${onClick ? 'cursor-pointer hover:shadow-md' : ''} p-5 transition-shadow`}
            style={{ borderRadius: '0.25rem', boxShadow: 'none' }}
            onClick={onClick}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs font-medium text-gray-500 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-green-700">
                        {loading ? (
                            <span className="inline-block animate-pulse bg-gray-200 h-6 w-16" style={{ borderRadius: 2 }}></span>
                        ) : (
                            typeof value === 'number' ? value.toLocaleString() : value
                        )}
                    </p>
                    {trend && (
                        <p className="text-xs text-gray-400 mt-1">{trend}</p>
                    )}
                </div>
                <Icon className="h-8 w-8 text-green-600" />
            </div>
        </div>
    );

    // Boxy, green theme, minimal color
    const QuickAction = ({ title, description, icon: Icon, onClick }) => (
        <button
            onClick={onClick}
            className="bg-green-600 text-white p-5 cursor-pointer transition-opacity hover:opacity-95 text-left w-full"
            style={{ borderRadius: '0.25rem', boxShadow: 'none' }}
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="font-semibold text-base mb-1">{title}</h3>
                    <p className="text-xs opacity-90">{description}</p>
                </div>
                <Icon size={22} />
            </div>
        </button>
    );

    const quickActions = [
        {
            title: 'Add Product',
            description: 'Add new items to inventory',
            icon: Plus,
            onClick: () => navigate('/products/add'),
        },
        {
            title: 'View Orders',
            description: 'Manage customer orders',
            icon: ShoppingCart,
            onClick: () => navigate('/orders'),
        },
        {
            title: 'Delivery Agents',
            description: 'Manage delivery team',
            icon: Truck,
            onClick: () => navigate('/delivery-agents'),
        },
        {
            title: 'Analytics',
            description: 'View performance reports',
            icon: BarChart3,
            onClick: () => navigate('/analytics'),
        }
    ];

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
                    <h2 className="text-2xl font-bold text-green-800 mb-1 tracking-tight">Grojet Control Panel</h2>
                    <p className="text-gray-600">Delivery Managing Platform</p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard
                        title="Total Products"
                        value={dashboardStats.inventoryCount}
                        icon={Package}
                        onClick={() => navigate('/products')}
                    />
                    <StatCard
                        title="Total Orders"
                        value={dashboardStats.orders.totalOrders || 0}
                        icon={ShoppingCart}
                        trend={`${dashboardStats.orders.todayOrders || 0} today`}
                        onClick={() => navigate('/orders')}
                    />
                    <StatCard
                        title="Active Agents"
                        value={dashboardStats.agents.active || 0}
                        icon={Truck}
                        trend={`${dashboardStats.agents.online || 0} online`}
                        onClick={() => navigate('/delivery-agents')}
                    />
                    <StatCard
                        title="Total Users"
                        value={dashboardStats.users.count || 0}
                        icon={Users}
                        onClick={() => navigate('/users')}
                    />
                </div>

                {/* Revenue & Performance */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
                    <StatCard
                        title="Total Revenue"
                        value={`₹${(dashboardStats.revenue.total || 0).toLocaleString()}`}
                        icon={IndianRupee}
                        trend={`₹${(dashboardStats.revenue.today || 0).toLocaleString()} today`}
                    />
                    <StatCard
                        title="Pending Orders"
                        value={dashboardStats.orders.pendingOrders || 0}
                        icon={Clock}
                        onClick={() => navigate('/orders?status=pending')}
                    />
                    <StatCard
                        title="Completed Today"
                        value={dashboardStats.orders.completedOrders || 0}
                        icon={CircleCheck}
                    />
                </div>

                {/* Quick Actions */}
                <div className="mb-8">
                    <h3 className="text-base font-semibold text-green-800 mb-3">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        {quickActions.map((action, index) => (
                            <QuickAction key={index} {...action} />
                        ))}
                    </div>
                </div>

                {/* Management Links */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-white border border-gray-200 p-5" style={{ borderRadius: '0.25rem', boxShadow: 'none' }}>
                        <h4 className="font-semibold text-green-800 mb-3">Inventory Management</h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate('/products')}
                                className="flex cursor-pointer items-center gap-2 text-gray-700 hover:text-green-700 transition-colors"
                            >
                                <Package size={16} />
                                View All Products
                            </button>
                            <button
                                onClick={() => navigate('/categories')}
                                className="flex cursor-pointer items-center gap-2 text-gray-700 hover:text-green-700 transition-colors"
                            >
                                <ChartBarStacked size={16} />
                                Manage Categories
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 p-5" style={{ borderRadius: '0.25rem', boxShadow: 'none' }}>
                        <h4 className="font-semibold text-green-800 mb-3">User Management</h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate('/users')}
                                className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-green-700 transition-colors"
                            >
                                <Users size={16} />
                                Customer Accounts
                            </button>
                            <button
                                onClick={() => navigate('/merchants')}
                                className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-green-700 transition-colors"
                            >
                                <Store size={16} />
                                Merchant Enquiries
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 p-5" style={{ borderRadius: '0.25rem', boxShadow: 'none' }}>
                        <h4 className="font-semibold text-green-800 mb-3">Delivery Operations</h4>
                        <div className="space-y-2">
                            <button
                                onClick={() => navigate('/delivery-agents')}
                                className="flex items-center cursor-pointer gap-2 text-gray-700 hover:text-green-700 transition-colors"
                            >
                                <Truck size={16} />
                                Delivery Agents
                            </button>
                            <button
                                onClick={() => navigate('/delivery-zones')}
                                className="flex items-center cursor-pointer gap-2 text-gray-700 hover:text-green-700 transition-colors"
                            >
                                <MapPin size={16} />
                                Delivery Zones
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
