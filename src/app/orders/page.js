'use client'
import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Package, 
  ChevronLeft,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  RefreshCw,
  Loader2
} from 'lucide-react';

const REFRESH_INTERVAL = 30000; // 30 seconds for status checks

const UserOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [limit, setLimit] = useState(20);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Check authentication
  const checkAuth = () => {
    const token = localStorage.getItem('Token');
    if (!token) {
      window.location.href = '/Signin';
      return false;
    }
    return true;
  };

  // Fetch orders from backend
  const fetchOrders = useCallback(async (page = currentPage) => {
    if (!checkAuth()) return;
    
    setLoading(page === 1);
    setError(null);

    try {
      const token = localStorage.getItem('Token');
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (statusFilter) queryParams.append('status', statusFilter);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);

      const response = await fetch(
        `https://serverdatahub.onrender.com/api/orders/my-orders?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.status === 401) {
        localStorage.removeItem('Token');
        localStorage.removeItem('userData');
        window.location.href = '/Signin';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      
      if (data.success) {
        setOrders(data.data.orders);
        setSummary(data.data.summary);
        
        // Update pagination
        if (data.data.pagination) {
          setTotalPages(data.data.pagination.pages);
          setCurrentPage(data.data.pagination.page);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, limit, statusFilter, startDate, endDate]);

  // Check status for individual order
  const checkOrderStatus = async (reference) => {
    const token = localStorage.getItem('Token');
    
    try {
      const response = await fetch(
        `https://serverdatahub.onrender.com/api/orders/check-status/${reference}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.data;
        }
      }
    } catch (err) {
      console.error(`Failed to check status for ${reference}:`, err);
    }
    return null;
  };

  // Refresh statuses for orders that can be checked
  const refreshStatuses = async () => {
    setRefreshing(true);
    
    const ordersToCheck = orders.filter(order => order.canCheckStatus);
    
    if (ordersToCheck.length > 0) {
      const statusPromises = ordersToCheck.map(order => 
        checkOrderStatus(order.reference)
      );
      
      const results = await Promise.all(statusPromises);
      
      // Update orders with new statuses
      const updatedOrders = orders.map(order => {
        const statusResult = results.find(r => r && r.reference === order.reference);
        if (statusResult) {
          return { ...order, status: statusResult.status };
        }
        return order;
      });
      
      setOrders(updatedOrders);
    }
    
    setRefreshing(false);
  };

  // Initial load and periodic refresh
  useEffect(() => {
    fetchOrders(1);
    
    // Set up periodic status refresh for orders that can be checked
    const interval = setInterval(() => {
      if (!loading && orders.some(o => o.canCheckStatus)) {
        refreshStatuses();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    // Search is done server-side through recipient filter
    // You might want to add a search endpoint or filter
    fetchOrders(1);
  };

  // Handle filter apply
  const handleFilter = () => {
    setCurrentPage(1);
    fetchOrders(1);
    setShowFilters(false);
  };

  // Clear filters
  const handleClearFilters = () => {
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
    fetchOrders(1);
    setShowFilters(false);
  };

  // Change page
  const changePage = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchOrders(newPage);
  };

  // Get status icon and color
  const getStatusDisplay = (status) => {
    switch (status) {
      case 'completed':
        return {
          icon: <CheckCircle size={20} />,
          color: 'text-green-400',
          bgColor: 'bg-green-900/20',
          borderColor: 'border-green-800'
        };
      case 'onPending':
      case 'pending':
        return {
          icon: <Clock size={20} />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20',
          borderColor: 'border-yellow-800'
        };
      case 'processing':
        return {
          icon: <RefreshCw size={20} className="animate-spin" />,
          color: 'text-blue-400',
          bgColor: 'bg-blue-900/20',
          borderColor: 'border-blue-800'
        };
      case 'failed':
        return {
          icon: <XCircle size={20} />,
          color: 'text-red-400',
          bgColor: 'bg-red-900/20',
          borderColor: 'border-red-800'
        };
      default:
        return {
          icon: <AlertCircle size={20} />,
          color: 'text-gray-400',
          bgColor: 'bg-gray-900/20',
          borderColor: 'border-gray-800'
        };
    }
  };

  // Format network name
  const formatNetworkName = (networkKey) => {
    const networks = {
      'YELLO': 'MTN',
      'TELECEL': 'Telecel',
      'AT_PREMIUM': 'AirtelTigo',
      'AT_BIGTIME': 'AT BigTime'
    };
    return networks[networkKey] || networkKey;
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('Token');
    localStorage.removeItem('userData');
    window.location.href = '/Signin';
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="ml-3 text-lg">Loading orders...</span>
      </div>
    );
  }

  if (error && orders.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="w-full max-w-lg p-6 bg-red-900/20 rounded-lg border border-red-800">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle size={24} />
            <div>
              <p className="font-semibold">Error loading orders</p>
              <p className="text-sm mt-1">{error}</p>
              <button 
                onClick={() => fetchOrders(1)}
                className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => window.history.back()} 
              className="flex items-center text-gray-400 hover:text-gray-200 transition-colors"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-100">
              <Package size={28} className="text-amber-500" />
              My Orders
            </h1>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-gray-400 text-sm">Total Orders</p>
              <p className="text-2xl font-bold text-amber-500">{summary.totalOrders}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-gray-400 text-sm">Total Spent</p>
              <p className="text-2xl font-bold text-white">GHS {summary.totalSpent.toFixed(2)}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-gray-400 text-sm">Completed</p>
              <p className="text-2xl font-bold text-green-400">{summary.completedOrders}</p>
            </div>
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{summary.pendingOrders}</p>
            </div>
          </div>
        )}

        {/* Search and Filter section */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-slate-700 hover:bg-slate-600 text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Filter size={18} />
              <span>Filter</span>
              <ChevronDown size={16} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            
            <button
              type="button"
              onClick={refreshStatuses}
              disabled={refreshing}
              className="bg-slate-700 hover:bg-slate-600 text-gray-200 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              <span>Refresh Status</span>
            </button>
          </div>

          {/* Expandable filters */}
          {showFilters && (
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">All Statuses</option>
                    <option value="onPending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-1 block">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleClearFilters}
                  className="bg-slate-700 hover:bg-slate-600 text-gray-200 px-4 py-2 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleFilter}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-lg border border-slate-700">
            <Package size={48} className="mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400">No orders found</p>
            <button 
              onClick={() => window.location.href = '/mtn-bundles'}
              className="mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {orders.map((order) => {
                const statusDisplay = getStatusDisplay(order.status);
                return (
                  <div 
                    key={order._id || order.reference} 
                    className={`bg-slate-800 rounded-lg p-4 border ${statusDisplay.borderColor} hover:shadow-lg transition-all`}
                  >
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <div className={statusDisplay.color}>
                            {statusDisplay.icon}
                          </div>
                          <span className={`font-semibold capitalize ${statusDisplay.color}`}>
                            {order.status === 'onPending' ? 'Pending' : order.status}
                          </span>
                          {order.canCheckStatus && (
                            <button
                              onClick={() => checkOrderStatus(order.reference).then(fetchOrders)}
                              className="ml-2 text-xs text-blue-400 hover:text-blue-300"
                            >
                              Check Status
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                          <p className="text-gray-400">
                            <span className="text-gray-500">Reference:</span> {order.reference}
                          </p>
                          <p className="text-gray-400">
                            <span className="text-gray-500">Recipient:</span> {order.recipient}
                          </p>
                          <p className="text-gray-400">
                            <span className="text-gray-500">Network:</span> 
                            <span className="ml-1 text-amber-400">{formatNetworkName(order.networkKey)}</span>
                          </p>
                          <p className="text-gray-400">
                            <span className="text-gray-500">Provider:</span> {order.provider || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-2xl font-bold text-white">
                          {order.capacity} GB
                        </p>
                        <p className="text-lg text-amber-400 font-semibold">
                          GHS {order.price}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center items-center gap-2">
                <button
                  onClick={() => changePage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === 1 
                      ? 'bg-slate-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-slate-700 text-gray-200 hover:bg-slate-600'
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    // Show first, last, and 2 pages around current
                    if (
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => changePage(page)}
                          className={`px-3 py-2 rounded-lg ${
                            currentPage === page
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-700 text-gray-200 hover:bg-slate-600'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2 text-gray-500">...</span>;
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => changePage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg ${
                    currentPage === totalPages 
                      ? 'bg-slate-700 text-gray-500 cursor-not-allowed' 
                      : 'bg-slate-700 text-gray-200 hover:bg-slate-600'
                  }`}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserOrdersPage;