import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Package, Plus, Users, Store, ChartBarStacked,
  Truck, MapPin, BarChart3, Settings, LogOut, User,
  Menu, X, Shield, ShoppingCart, Bell, Gift,
  TabletSmartphone, Briefcase, Smartphone,
  Bug, Headphones, Moon,
  ShieldPlus, DollarSign,
  IndianRupeeIcon, Zap, MessageSquare, Mail,
  Castle,
  Cloud,
  Star,
  ChefHat,
  Warehouse,
  FileText
} from 'lucide-react';
import { MdAdminPanelSettings } from 'react-icons/md';
import toast from 'react-hot-toast';
import { VERSION } from '../../version.js';

const Layout = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState(() => {
    try {
      const cached = localStorage.getItem('adminUser');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [adminLoading, setAdminLoading] = useState(() => {
    try {
      const cached = localStorage.getItem('adminUser');
      return !cached; // If we have cached data, don't show loading
    } catch {
      return true;
    }
  });
  const [updateNotes, setUpdateNotes] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navRef = useRef(null);
  const mainRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchAdminProfile = async () => {
      setAdminLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentAdmin(data.admin);
          localStorage.setItem('adminUser', JSON.stringify(data.admin)); // optional cache only
        } else {
          // Clear invalid cached data
          localStorage.removeItem('adminUser');
          setCurrentAdmin(null);
        }
      } catch (error) {
        console.error('Failed to fetch admin profile:', error);
        // Clear invalid cached data on error
        localStorage.removeItem('adminUser');
        setCurrentAdmin(null);
      } finally {
        setAdminLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  // Redirect to login if not authenticated after loading
  useEffect(() => {
    if (!adminLoading && !currentAdmin) {
      navigate('/login');
    }
  }, [adminLoading, currentAdmin, navigate]);

  // Fetch update notes for notifications
  const fetchUpdateNotes = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/update-notes/public/latest?limit=5`);
      if (response.ok) {
        const data = await response.json();
        setUpdateNotes(data.updateNotes || []);
        setUnreadCount(data.updateNotes?.length || 0);
      }
    } catch (error) {
      console.error('Failed to fetch update notes:', error);
    }
  };

  useEffect(() => {
    if (currentAdmin) {
      fetchUpdateNotes();
    }
  }, [currentAdmin]);

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

  const handleNotificationClick = () => {
    setNotificationsOpen(!notificationsOpen);
    if (!notificationsOpen && unreadCount > 0) {
      // Mark as read when opening
      setUnreadCount(0);
    }
  };

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
    { name: 'Dashboard', icon: Home, path: '/', roles: ['super_admin', 'admin'] },
    { name: 'Public Store', icon: Castle, path: '/public-store', roles: ['super_admin', 'admin']},
    { name: 'Orders', icon: ShoppingCart, path: '/orders', roles: ['super_admin', 'admin'] },
    { name: 'Products', icon: Package, path: '/products', roles: ['super_admin', 'admin'] },
    { name: 'Add Product', icon: Plus, path: '/products/add', roles: ['super_admin', 'admin'] },
    { name: 'Requested Products', icon: Shield, path: '/products/requests', roles: ['super_admin', 'admin'] },
    { name: 'Categories', icon: ChartBarStacked, path: '/categories', roles: ['super_admin', 'admin'] },
    { name: 'Xpress', icon: Zap, path: '/xpress', roles: ['super_admin', 'admin'] },
    { name: 'Careers', icon: Briefcase, path: '/careers', roles: ['super_admin', 'admin'] },
    { name: 'Users', icon: Users, path: '/users', roles: ['super_admin', 'admin'] },
    { name: 'User Analytics', icon: BarChart3, path: '/user-analytics', roles: ['super_admin'] },
    { name: 'Merchant Enquiries', icon: Store, path: '/merchant-enquiries', roles: ['super_admin', 'admin'] },
    { name: 'Merchants', icon: Store, path: '/merchants', roles: ['super_admin', 'admin'] },
    { name: 'Eateries', icon: ChefHat, path: '/eateries', roles: ['super_admin', 'admin'] },
    { name: 'Darkstore', icon: Warehouse, path: '/darkstore', roles: ['super_admin', 'admin'] },
    { name: 'Support', icon: Headphones, path: '/support', roles: ['super_admin', 'admin'] },
    { name: 'Delivery Agents', icon: Truck, path: '/delivery-agents', roles: ['super_admin', 'admin', 'delivery_manager'] },
    { name: 'Delivery Ratings', icon: Star, path: '/delivery-ratings', roles: ['super_admin', 'admin', 'delivery_manager'] },
    { name: 'Delivery Zones', icon: MapPin, path: '/delivery-zones', roles: ['super_admin', 'admin', 'delivery_manager'] },
    { name: 'Market Area', icon: MapPin, path: '/market-area', roles: ['super_admin', 'admin'] },
    { name: 'Offers', icon: Gift, path: '/offers', roles: ['super_admin', 'admin'] },
    { name: 'Home Ads', icon: Smartphone, path: '/home-ads', roles: ['super_admin', 'admin'] },
    { name: 'Analytics', icon: BarChart3, path: '/analytics', roles: ['super_admin', 'admin'] },
    { name: 'Finance', icon: IndianRupeeIcon, path: '/finance', roles: ['super_admin', 'admin'] },
    { name: 'App Controls', icon: TabletSmartphone, path: '/app-controls', roles: ['super_admin', 'admin'] },
    { name: 'Bug Reports', icon: Bug, path: '/bug-reports', roles: ['super_admin'] },
    { name: 'S3 Media Manager', icon: Package, path: '/s3-store', roles: ['super_admin'] },
    { name: 'Admin Management', icon: Shield, path: '/admin-management', roles: ['super_admin'] },
    { name: 'Security', icon: ShieldPlus, path: '/security', roles: ['super_admin'] },
    { name: 'Logs', icon: FileText, path: '/logs', roles: ['super_admin'] },
    { name: 'Update Notes', icon: FileText, path: '/update-notes', roles: ['super_admin'] },
    { name: 'Super Tags', icon: Star, path: '/super-tags', roles: ['super_admin'] },
    { name: 'Contact Queries', icon: MessageSquare, path: '/contact-qur', roles: ['super_admin', 'admin'] },
    { name: 'Email Sender', icon: Mail, path: '/email-sender', roles: ['super_admin', 'admin'] },
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
            <span className="text-xs text-neutral-500">{VERSION}</span>
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
              {item.isNew && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  NEW
                </span>
              )}
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
                onClick={handleNotificationClick}
                className="p-2 hover:bg-neutral-100 cursor-pointer relative"
              >
                <Bell size={20} className="text-neutral-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notifications Panel */}
              {notificationsOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[calc(100vw-1rem)] sm:max-w-[calc(100vw-2rem)] bg-white rounded-lg shadow-lg border border-neutral-200 z-50 max-h-96 overflow-hidden">
                  <div className="p-3 sm:p-4 border-b border-neutral-200">
                    <h3 className="text-base sm:text-lg font-semibold text-neutral-900">App Updates</h3>
                    <p className="text-xs sm:text-sm text-neutral-600">Latest features and improvements</p>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {updateNotes.length > 0 ? (
                      <div className="divide-y divide-neutral-100">
                        {updateNotes.map((note) => (
                          <div key={note._id} className="p-3 sm:p-4 hover:bg-neutral-50 cursor-pointer transition-colors">
                            <div className="flex items-start gap-2 sm:gap-3">
                              <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-full flex items-center justify-center">
                                {note.app === 'admin_panel' && <TabletSmartphone size={12} className="text-green-600 sm:w-4 sm:h-4" />}
                                {note.app === 'customer_app' && <Smartphone size={12} className="text-blue-600 sm:w-4 sm:h-4" />}
                                {note.app === 'merchant_app' && <Store size={12} className="text-purple-600 sm:w-4 sm:h-4" />}
                                {note.app === 'delivery_agent_app' && <Truck size={12} className="text-orange-600 sm:w-4 sm:h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 sm:gap-2 mb-1">
                                  <span className="text-xs sm:text-sm font-medium text-neutral-900 capitalize">
                                    {note.app.replace('_', ' ')}
                                  </span>
                                  <span className="text-xs text-neutral-500">v{note.version}</span>
                                </div>
                                <p className="text-xs sm:text-sm text-neutral-600 mb-1 sm:mb-2 line-clamp-2">
                                  {note.features.length > 0 ? note.features[0] : 'New update available'}
                                  {note.features.length > 1 && ` +${note.features.length - 1} more features`}
                                </p>
                                <p className="text-xs text-neutral-500">
                                  {new Date(note.releaseDate).toLocaleDateString('en-IN')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center">
                        <Bell size={48} className="text-neutral-400 mx-auto mb-4" />
                        <p className="text-neutral-500 text-sm">No updates available</p>
                        <p className="text-neutral-400 text-xs mt-1">Check back later for new features!</p>
                      </div>
                    )}
                  </div>
                  {updateNotes.length > 0 && (
                    <div className="p-2 sm:p-3 border-t border-neutral-200 bg-neutral-50">
                      <button
                        onClick={() => {
                          setNotificationsOpen(false);
                          // Navigate to update notes page if user is super admin
                          if (currentAdmin?.role === 'super_admin') {
                            navigate('/update-notes');
                          }
                        }}
                        className="w-full text-center text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        View All Updates
                      </button>
                    </div>
                  )}
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