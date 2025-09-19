'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Store,
  ClipboardList,
  Clock,
  Wallet,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Database,
  ChevronDown,
  Wifi,
  Activity,
  Settings,
  Bell,
  ShoppingBag,
  Search,
  Menu,
  X,
  LogOut,
  LogIn,
  UserPlus,
  User,
  HelpCircle,
  Loader2,
  AlertCircle,
  TrendingUp,
  Shield,
  Code2
} from 'lucide-react';

const ProfessionalNavbar = () => {
  // State Management
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [activeRoute, setActiveRoute] = useState('/');
  
  // User Data States
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [notifications, setNotifications] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch user data on mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    const token = localStorage.getItem('Token');
    
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      // Fetch user profile
      const profileResponse = await fetch('http://localhost:5000/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to fetch profile');
      }

      const profileData = await profileResponse.json();
      
      if (profileData.success) {
        setUser(profileData.data.profile);
        setWalletBalance(profileData.data.wallet.balance);
        setIsAuthenticated(true);
      }

      // Fetch wallet data separately for real-time balance
      const walletResponse = await fetch('http://localhost:5000/api/user/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (walletResponse.ok) {
        const walletData = await walletResponse.json();
        if (walletData.success) {
          setWalletBalance(walletData.data.balance);
        }
      }

    } catch (err) {
      console.error('Auth check failed:', err);
      setError(err.message);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
    setWalletBalance(0);
    setIsMobileMenuOpen(false);
    window.location.href = '/signin';
  };

  const toggleSubmenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  const handleNavigation = (path) => {
    setActiveRoute(path);
    setIsMobileMenuOpen(false);
    window.location.href = path;
  };

  // Menu Items Configuration
  const menuItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: '/',
      requiresAuth: true
    },
    {
      id: 'store',
      icon: Store,
      label: 'Buy Data',
      badge: null,
      submenu: [
        { 
          id: 'bulk', 
          icon: Database, 
          label: 'Bulk Purchase', 
          path: '/bulk-data',
          description: 'Buy in bulk & save'
        },
        { 
          id: 'mtn', 
          icon: Wifi, 
          label: 'MTN', 
          path: '/Store',
          description: 'MTN data bundles'
        },
        { 
          id: 'at', 
          icon: Wifi, 
          label: 'AirtelTigo', 
          path: '/at',
          description: 'AT data bundles'
        },
        { 
          id: 'telecel', 
          icon: Wifi, 
          label: 'Telecel', 
          path: '/Telecel',
          description: 'Telecel data bundles'
        }
      ]
    },
    {
      id: 'orders',
      icon: ShoppingBag,
      label: 'Orders',
      path: '/orders',
      requiresAuth: true
    },
    {
      id: 'transactions',
      icon: Receipt,
      label: 'Transactions',
      path: '/Transactions',
      requiresAuth: true
    },
    {
      id: 'wallet',
      icon: Wallet,
      label: 'Wallet',
      path: '/wallet',
      requiresAuth: true
    },
    {
      id: 'api',
      icon: Code2,
      label: 'API Docs',
      path: '/Api_Doc'
    },
    {
      id: 'support',
      icon: HelpCircle,
      label: 'Support',
      path: '/support'
    }
  ];

  const renderMenuItem = (item) => {
    const isActive = activeRoute === item.path || 
                    (item.submenu && item.submenu.some(sub => activeRoute === sub.path));
    const isExpanded = expandedMenus[item.id];
    const hasSubmenu = item.submenu && item.submenu.length > 0;

    // Hide auth-required items for non-authenticated users
    if (item.requiresAuth && !isAuthenticated) return null;

    return (
      <div key={item.id} className="mb-1">
        <button
          onClick={() => {
            if (hasSubmenu) {
              toggleSubmenu(item.id);
            } else {
              handleNavigation(item.path);
            }
          }}
          className={`
            w-full flex items-center justify-between px-3 py-2.5 rounded-lg
            transition-all duration-200 relative group
            ${isActive 
              ? 'bg-yellow-400/10 text-yellow-400 border-l-4 border-yellow-400' 
              : 'hover:bg-gray-800/50 text-gray-400 hover:text-yellow-400'
            }
          `}
        >
          <div className="flex items-center gap-3">
            <item.icon className={`w-5 h-5 ${isActive ? 'text-yellow-400' : 'text-gray-500 group-hover:text-yellow-400'}`} />
            {!isNavCollapsed && (
              <span className="font-medium text-sm">{item.label}</span>
            )}
          </div>
          
          {!isNavCollapsed && (
            <div className="flex items-center gap-2">
              {item.badge && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-400/20 text-yellow-400 font-medium">
                  {item.badge}
                </span>
              )}
              {hasSubmenu && (
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`} />
              )}
            </div>
          )}
        </button>

        {/* Submenu */}
        {hasSubmenu && isExpanded && !isNavCollapsed && (
          <div className="ml-7 mt-1 space-y-1">
            {item.submenu.map(subItem => (
              <button
                key={subItem.id}
                onClick={() => handleNavigation(subItem.path)}
                className={`
                  w-full flex items-start gap-3 px-3 py-2 rounded-lg
                  transition-all duration-200 group text-left
                  ${activeRoute === subItem.path 
                    ? 'bg-yellow-400/5 text-yellow-400' 
                    : 'hover:bg-gray-800/30 text-gray-500 hover:text-gray-300'
                  }
                `}
              >
                <subItem.icon className="w-4 h-4 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{subItem.label}</div>
                  {subItem.description && (
                    <div className="text-xs text-gray-600 mt-0.5">{subItem.description}</div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Top Header Bar - Desktop */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 h-14 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-40">
        <div className="flex items-center justify-between w-full px-6">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-black" />
              </div>
              <span className="text-lg font-semibold text-white">DataHub Ghana</span>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Loading...</span>
              </div>
            ) : isAuthenticated && user ? (
              <>
                {/* Wallet Balance */}
                <button 
                  onClick={() => handleNavigation('/deposit')}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors group"
                >
                  <Wallet className="w-4 h-4 text-gray-400 group-hover:text-yellow-400" />
                  <div className="text-left">
                    <div className="text-xs text-gray-500">Balance</div>
                    <div className="text-sm font-semibold text-white">₵{walletBalance.toFixed(2)}</div>
                  </div>
                </button>

                {/* Notifications */}
                <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors">
                  <Bell className="w-5 h-5 text-gray-400" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </button>

                {/* User Menu */}
                <div className="flex items-center gap-3 pl-4 border-l border-gray-700">
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">
                      {user.firstName} {user.secondName}
                    </p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <div className="w-9 h-9 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center text-white font-medium">
                    {user.firstName?.charAt(0)}{user.secondName?.charAt(0)}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavigation('/Signin')}
                  className="px-4 py-1.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleNavigation('/Signup')}
                  className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-black text-sm font-medium rounded-lg transition-colors"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50">
        <div className="flex items-center justify-between px-4 h-full">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <Activity className="w-4 h-4 text-black" />
            </div>
            <span className="text-base font-semibold text-white">DataHub</span>
          </div>
          
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <nav className={`
        fixed top-14 md:top-14 left-0 h-[calc(100vh-3.5rem)] 
        bg-gray-900/95 backdrop-blur-sm 
        border-r border-gray-800 
        transition-all duration-300 z-45
        ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
        ${isNavCollapsed ? 'md:w-16' : 'md:w-64'}
      `}>
        {/* Collapse Toggle - Desktop */}
        <div className="hidden md:flex items-center justify-end p-3 border-b border-gray-800">
          <button
            onClick={() => setIsNavCollapsed(!isNavCollapsed)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
          >
            {isNavCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* User Info - Mobile */}
        {isAuthenticated && user && !isNavCollapsed && (
          <div className="md:hidden p-4 border-b border-gray-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-700 rounded-lg flex items-center justify-center text-white font-medium">
                {user.firstName?.charAt(0)}{user.secondName?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-white text-sm">
                  {user.firstName} {user.secondName}
                </p>
                <p className="text-xs text-gray-400">{user.email}</p>
              </div>
            </div>
            <button 
              onClick={() => handleNavigation('/deposit')}
              className="w-full p-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Wallet Balance</span>
                <span className="text-base font-bold text-yellow-400">₵{walletBalance.toFixed(2)}</span>
              </div>
            </button>
          </div>
        )}

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto p-3">
          {menuItems.map(item => renderMenuItem(item))}
        </div>

        {/* Bottom Section */}
        <div className="p-3 border-t border-gray-800">
          {isAuthenticated ? (
            <div className="space-y-1">
              {!isNavCollapsed && (
                <button
                  onClick={() => handleNavigation('/settings')}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
                >
                  <Settings className="w-5 h-5" />
                  <span className="text-sm">Settings</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all"
              >
                <LogOut className="w-5 h-5" />
                {!isNavCollapsed && <span className="text-sm">Sign Out</span>}
              </button>
            </div>
          ) : !loading && (
            <div className="space-y-2">
              <button
                onClick={() => handleNavigation('/Signin')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-400 hover:bg-yellow-500 text-black font-medium rounded-lg transition-all"
              >
                <LogIn className="w-4 h-4" />
                {!isNavCollapsed && <span className="text-sm">Sign In</span>}
              </button>
              {!isNavCollapsed && (
                <button
                  onClick={() => handleNavigation('/Signup')}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600 rounded-lg transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="text-sm">Create Account</span>
                </button>
              )}
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default ProfessionalNavbar;