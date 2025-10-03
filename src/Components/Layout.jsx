import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Package, Plus, Users, Store, ChartBarStacked,
  Truck, MapPin, BarChart3, Settings, LogOut, User,
  Menu, X, Shield, ShoppingCart, Bell, Gift,
  TabletSmartphone, Briefcase
} from 'lucide-react';
import { MdAdminPanelSettings } from 'react-icons/md';
import toast from 'react-hot-toast';

const Layout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const navRef = useRef(null);
  const mainRef = useRef(null);
  const notificationsRef = useRef(null);
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

  // Preserve sidebar scroll position across navigations
  useEffect(() => {
    const el = navRef.current;
    if (!el) return;
    const saved = sessionStorage.getItem('sidebarScrollTop');
    if (saved) {
      el.scrollTop = parseInt(saved, 10) || 0;
    }
    const onScroll = () => {
      sessionStorage.setItem('sidebarScrollTop', String(el.scrollTop));
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  // Preserve main content scroll position per-route to avoid jump-to-top
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const key = `mainScroll:${location.pathname}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      el.scrollTop = parseInt(saved, 10) || 0;
    }
    const onScroll = () => {
      sessionStorage.setItem(key, String(el.scrollTop));
    };
    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    if (notificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);


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
    { name: 'Dashboard', icon: Home, path: '/', roles: ['super_admin', 'admin', 'delivery_manager', 'inventory_manager', 'customer_service'] },
    { name: 'Orders', icon: ShoppingCart, path: '/orders', roles: ['super_admin', 'admin', 'delivery_manager'] },
    { name: 'Products', icon: Package, path: '/products', roles: ['super_admin', 'admin', 'inventory_manager'] },
    { name: 'Add Product', icon: Plus, path: '/products/add', roles: ['super_admin', 'admin', 'inventory_manager'] },
    { name: 'Requested Products', icon: Shield, path: '/products/requests', roles: ['super_admin', 'admin', 'inventory_manager'] },
    { name: 'Categories', icon: ChartBarStacked, path: '/categories', roles: ['super_admin', 'admin', 'inventory_manager'] },
    { name: 'Careers', icon: Briefcase, path: '/careers', roles: ['super_admin', 'admin'] },
    { name: 'Users', icon: Users, path: '/users', roles: ['super_admin', 'admin'] },
    { name: 'Merchant Enquiries', icon: Store, path: '/merchant-enquiries', roles: ['super_admin', 'admin'] },
    { name: 'Merchants', icon: Store, path: '/merchants', roles: ['super_admin', 'admin'] },
    { name: 'Delivery Agents', icon: Truck, path: '/delivery-agents', roles: ['super_admin', 'admin', 'delivery_manager'] },
    { name: 'Delivery Zones', icon: MapPin, path: '/delivery-zones', roles: ['super_admin', 'admin', 'delivery_manager'] },
    { name: 'Offers', icon: Gift, path: '/offers', roles: ['super_admin', 'admin'] },
    { name: 'Analytics', icon: BarChart3, path: '/analytics', roles: ['super_admin', 'admin'] },
    { name: 'App Controls', icon: TabletSmartphone, path: '/app-controls', roles: ['super_admin', 'admin'] },
    { name: 'Admin Management', icon: Shield, path: '/admin-management', roles: ['super_admin'] },
  ];

  const filteredMenuItems = menuItems.filter(item =>
    !currentAdmin || item.roles.includes(currentAdmin.role)
  );

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    // Check for exact match first
    if (location.pathname === path) {
      return true;
    }
    // For nested routes, only consider active if it's a parent route and not overridden by a more specific route
    if (location.pathname.startsWith(path + '/')) {
      // Check if there's a more specific menu item that matches exactly
      const moreSpecificItem = menuItems.find(item =>
        item.path !== path &&
        location.pathname === item.path
      );
      return !moreSpecificItem;
    }
    return false;
  };

  return (
    <div className="flex h-screen bg-neutral-100">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-md transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col h-full border-r border-neutral-200`}>

        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-neutral-200 flex-shrink-0">
          <div className="flex items-center gap-3 w-full">
            <img src="/grojet.png" alt="Grojet" className="h-6 object-contain" />
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
              <div onClick={() => navigate('/profile')} className="w-10 h-10 cursor-pointer bg-green-50 flex items-center justify-center border border-green-200">
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
        <nav ref={navRef} className="mt-4 px-2 flex-1 overflow-y-auto">
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
            onClick={() => navigate('/settings')}
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
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 hover:bg-neutral-100 cursor-pointer relative"
              >
                <Bell size={20} className="text-neutral-600" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              </button>

              {/* Notifications Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 z-50">
                  <div className="p-4 border-b border-neutral-200">
                    <h3 className="text-lg font-semibold text-neutral-900">Notifications</h3>
                  </div>
                  <div className="p-4">
                    <div className="text-center py-8">
                      <Bell size={48} className="text-neutral-400 mx-auto mb-4" />
                      <p className="text-neutral-500 text-sm">No notifications</p>
                      <p className="text-neutral-400 text-xs mt-1">You're all caught up!</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <MdAdminPanelSettings className="text-green-700" size={22} />
              <span className="hidden sm:block text-xs font-medium text-neutral-700 tracking-wide">
                {currentAdmin?.role?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main ref={mainRef} className="flex-1 overflow-auto p-6">
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