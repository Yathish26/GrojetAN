import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, List, LogOut, User, Store, ChartBarStacked } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { MdAdminPanelSettings } from 'react-icons/md';

export default function Admin() {
    const [inventoryCount, setInventoryCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInventoryCount = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/count`, {
                    credentials: 'include',
                });
                const data = await response.json();
                if (data.tokenValid === false || response.status === 401) {
                    navigate('login');
                    return;
                }
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                if (data.success) setInventoryCount(data.count);
                else setError('Failed to fetch count: ' + (data.message || 'Unknown error'));
            } catch (e) {
                setError('Something went wrong: ' + e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchInventoryCount();
    }, [navigate]);

    // Logout now just clears cookies on server side (optional) and navigates to login
    const handleLogout = async () => {
        try {
            await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (e) {
            // Ignore errors
        }
        navigate('/login');
    };

    const handleComingSoon = ({ x }) => {
        toast(`${x} feature is coming soon!`);
    };

    const actions = [
        {
            label: 'Add Inventory',
            description: 'Create new item',
            icon: <Plus size={22} />,
            color: 'bg-green-600 hover:bg-green-700',
            onClick: () => navigate('/products/add'),
        },
        {
            label: 'View Inventory',
            description: 'All items list',
            icon: <List size={22} />,
            color: 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700',
            onClick: () => navigate('/products'),
        },
        {
            label: 'Merchants',
            description: 'View enquiries',
            icon: <Store size={22} />,
            color: 'bg-blue-600 hover:bg-blue-700',
            onClick: () => navigate('/merchants'),
        },
        {
            label: 'Users',
            description: 'Manage accounts',
            icon: <User size={22} />,
            color: 'bg-purple-600 hover:bg-purple-700',
            onClick: () => navigate('/users'),
        },
        {
            label: 'Orders',
            description: 'View transactions',
            icon: <Package size={22} />,
            color: 'bg-orange-600 hover:bg-orange-700',
            onClick: () => handleComingSoon({ x: 'Orders' }),
        },
        {
            label: 'Reports',
            description: 'Generate analytics',
            icon: <List size={22} />,
            color: 'bg-gray-700 hover:bg-gray-800',
            onClick: () => handleComingSoon({ x: 'Reports' }),
        },
        {
            label: 'Categories',
            description: 'Manage categories',
            icon: <ChartBarStacked size={22} />,
            color: 'bg-green-700 hover:bg-green-800',
            onClick: () => navigate('/categories'),
        },
    ];

    return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center font-sans">
            <Toaster
                position="top-center"
                toastOptions={{
                    duration: 1000,
                    style: {
                        background: '#fff',
                        color: '#333',
                        border: '1px solid #e5e7eb',
                        padding: '8px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    },
                }}
            />
            <div className="w-full max-w-6xl mx-4 my-8 shadow-2xl bg-white border border-green-200 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-green-200 bg-white">
                    <div className="flex items-center gap-3">
                        <MdAdminPanelSettings className="text-green-700" size={28} />
                        <h1 className="text-2xl font-bold text-green-900">Control Panel</h1>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 transition"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
                {/* Main Content */}
                <div className="flex flex-col md:flex-row gap-8 px-8 py-8">
                    {/* Sidebar */}
                    <div className="w-full md:w-1/3">
                        <div className="bg-green-50 border border-green-200 p-6 mb-8 shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-green-800">Inventory Summary</h2>
                                    <p className="text-sm text-green-500">Current stock overview</p>
                                </div>
                                <Package className="text-green-400" size={24} />
                            </div>
                            <div className="mt-4">
                                {loading && (
                                    <div className="flex items-center justify-center h-12">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
                                    </div>
                                )}
                                {error && (
                                    <p className="text-red-500 text-sm font-medium">{error}</p>
                                )}
                                {inventoryCount !== null && !loading && !error && (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-bold text-green-900">{inventoryCount}</span>
                                        <span className="text-green-500">items in stock</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {/* Quick Links */}
                        <div className="bg-white border border-green-200 p-6 shadow flex flex-col gap-4">
                            <button
                                // onClick={() => navigate('/profile')}
                                className="flex items-center gap-2 text-green-700 hover:text-green-900 transition"
                            >
                                <User size={18} />
                                Profile Settings
                            </button>
                            <button
                                // onClick={() => navigate('/settings')}
                                className="flex items-center gap-2 text-green-700 hover:text-green-900 transition"
                            >
                                <List size={18} />
                                System Settings
                            </button>
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="w-full md:w-2/3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {actions.map((action, idx) => (
                                <button
                                    key={action.label}
                                    onClick={action.onClick}
                                    className="flex flex-col items-start gap-3 p-5 shadow hover:shadow-lg transition bg-white border border-green-200 h-full text-green-800"
                                >
                                    <div className="mb-2 text-green-700">{action.icon}</div>
                                    <h3 className="font-semibold text-lg">{action.label}</h3>
                                    <p className="text-sm opacity-80">{action.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}