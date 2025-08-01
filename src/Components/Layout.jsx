import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Package, Plus, Users, Store, ChartBarStacked,
  Truck, MapPin, BarChart3, Settings, LogOut, User,
  Menu, X, Shield, ShoppingCart, Bell
} from 'lucide-react';
import { MdAdminPanelSettings } from 'react-icons/md';
import toast from 'react-hot-toast';

const Layout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedAdmin = localStorage.getItem('adminUser');

    if (storedAdmin) {
      try {
        setCurrentAdmin(JSON.parse(storedAdmin));
      } catch (e) {
        console.error('Failed to parse adminUser:', e);
      }
    } else {
      const fetchAdminProfile = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            setCurrentAdmin(data.admin);
            localStorage.setItem('adminUser', JSON.stringify(data.admin)); // optional cache
          }
        } catch (error) {
          console.error('Failed to fetch admin profile:', error);
        }
      };

      fetchAdminProfile();
    }
  }, []);


  const handleLogout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      toast.success('Logged out successfully');
      localStorage.removeItem('adminUser');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/login');
    }
  };

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/', roles: ['super_admin', 'admin', 'delivery_manager', 'inventory_manager'] },
    { name: 'Orders', icon: ShoppingCart, path: '/orders', roles: ['super_admin', 'admin', 'delivery_manager'] },
    { name: 'Products', icon: Package, path: '/products', roles: ['super_admin', 'admin', 'inventory_manager'] },
    { name: 'Add Product', icon: Plus, path: '/products/add', roles: ['super_admin', 'admin', 'inventory_manager'] },
    { name: 'Categories', icon: ChartBarStacked, path: '/categories', roles: ['super_admin', 'admin', 'inventory_manager'] },
    { name: 'Users', icon: Users, path: '/users', roles: ['super_admin', 'admin'] },
    { name: 'Merchants', icon: Store, path: '/merchants', roles: ['super_admin', 'admin'] },
    { name: 'Delivery Agents', icon: Truck, path: '/delivery-agents', roles: ['super_admin', 'admin', 'delivery_manager'] },
    { name: 'Delivery Zones', icon: MapPin, path: '/delivery-zones', roles: ['super_admin', 'admin', 'delivery_manager'] },
    { name: 'Analytics', icon: BarChart3, path: '/analytics', roles: ['super_admin', 'admin'] },
    { name: 'Admin Management', icon: Shield, path: '/admin-management', roles: ['super_admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    !currentAdmin || item.roles.includes(currentAdmin.role)
  );

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col h-full border-r border-neutral-200`}>

        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-center gap-3 w-full">
            <img src="/grojet.png" alt="Grojet" className="h-8 object-contain" />
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 hover:bg-neutral-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Admin Info */}
        {currentAdmin && (
          <div className="p-4 border-b border-neutral-200 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 flex items-center justify-center border border-green-200">
                <User size={20} className="text-green-700" />
              </div>
              <div>
                <p className="font-medium text-neutral-900">{currentAdmin.name}</p>
                <p className="text-xs text-neutral-500 uppercase tracking-wide">{currentAdmin.role.replace('_', ' ')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-4 px-2 flex-1 overflow-y-auto">
          {filteredMenuItems.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                navigate(item.path);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center cursor-pointer gap-3 px-3 py-2 text-left mb-1 transition-colors border-l-4 ${isActive(item.path)
                  ? 'bg-neutral-200 text-green-700 border-green-500'
                  : 'text-neutral-700 hover:bg-neutral-100 border-transparent'
                }`}
              style={{ borderRadius: 0 }}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-neutral-200 bg-white mt-auto flex-shrink-0">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-3 py-2 text-neutral-700 hover:bg-neutral-100 mb-2"
            style={{ borderRadius: 0 }}
          >
            <Settings size={20} />
            <span>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50"
            style={{ borderRadius: 0 }}
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-neutral-200 h-16 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-neutral-100"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold text-neutral-900">{title}</h1>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-neutral-100 relative">
              <Bell size={20} className="text-neutral-600" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2">
              <MdAdminPanelSettings className="text-green-700" size={22} />
              <span className="hidden sm:block text-xs font-medium text-neutral-700 tracking-wide">
                {currentAdmin?.role?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;