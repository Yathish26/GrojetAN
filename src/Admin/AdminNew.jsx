import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../Components/Layout';
import {
    Package, Truck, Clock, CircleCheck
} from 'lucide-react';
import LoaderSpinner from '../Components/Loader';


export default function Admin() {
    const [dashboardStats, setDashboardStats] = useState({
        inventoryCount: null,
        orders: {},
        agents: {}
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [redirecting, setRedirecting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);

                const [inventoryRes, ordersRes, agentsRes] = await Promise.all([
                    fetch(`${import.meta.env.VITE_SERVER}/admin/products/count`, { credentials: 'include' }),
                    fetch(`${import.meta.env.VITE_SERVER}/admin/orders/stats/overview`, { credentials: 'include' }),
                    fetch(`${import.meta.env.VITE_SERVER}/admin/delivery-agents/stats/overview`, { credentials: 'include' })
                ]);

                if (inventoryRes.status === 401 || ordersRes.status === 401 || agentsRes.status === 401) {
                    setRedirecting(true);
                    navigate('/login', { replace: true });
                    return;
                }

                const [inventoryData, ordersData, agentsData] = await Promise.all([
                    inventoryRes.json(),
                    ordersRes.json(),
                    agentsRes.json()
                ]);

                // Check for token validation in responses
                if (inventoryData.tokenValid === false || ordersData.tokenValid === false || agentsData.tokenValid === false) {
                    setRedirecting(true);
                    navigate('/login', { replace: true });
                    return;
                }

                setDashboardStats({
                    inventoryCount: inventoryData.success ? inventoryData.count : 0,
                    orders: ordersData.success ? ordersData.stats : {},
                    agents: agentsData.success ? agentsData.stats : {}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <StatCard
                        title="Total Products"
                        value={dashboardStats.inventoryCount}
                        icon={Package}
                        onClick={() => navigate('/products')}
                    />
                    <StatCard
                        title="Total Agents"
                        value={dashboardStats.agents.active || 0}
                        icon={Truck}
                        trend={`${dashboardStats.agents.online || 0} online`}
                        onClick={() => navigate('/delivery-agents')}
                    />
                </div>

                {/* Revenue & Performance */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
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
            </div>
        </Layout>
    );
}
