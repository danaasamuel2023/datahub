'use client'
import React, { useState, useEffect } from 'react';
import { Wallet, Filter, User, Activity, Package, DollarSign, CheckCircle, Clock, XCircle, AlertCircle, TrendingUp, Calendar, RefreshCw } from 'lucide-react';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterRecipient, setFilterRecipient] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const getGreeting = () => {
    const ghanaTime = new Date().toLocaleString('en-US', { timeZone: 'Africa/Accra' });
    const localHour = new Date(ghanaTime).getHours();
    
    if (localHour < 12) return 'Good morning';
    if (localHour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('Token');
      
      if (!token) {
        window.location.href = '/Signin';
        return;
      }

      const response = await fetch('https://serverdatahub.onrender.com/api/orders/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('Token');
        localStorage.removeItem('userData');
        window.location.href = '/Signin';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.message || 'Failed to load dashboard');
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Filter orders
  useEffect(() => {
    if (!dashboardData) return;
    
    let filtered = [...dashboardData.recentOrders];
    
    if (filterDate) {
      filtered = filtered.filter(order => {
        const txDate = new Date(order.createdAt).toISOString().split('T')[0];
        return txDate === filterDate;
      });
    }
    
    if (filterRecipient) {
      filtered = filtered.filter(order =>
        (order.recipient || '').includes(filterRecipient)
      );
    }
    
    setFilteredOrders(filtered);
  }, [dashboardData, filterDate, filterRecipient]);

  const handleDeposit = () => {
    window.location.href = '/Deposite';
  };

  const handleLogout = () => {
    localStorage.removeItem('Token');
    localStorage.removeItem('userData');
    window.location.href = '/Signin';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white flex items-center gap-3">
          <RefreshCw className="animate-spin" size={24} />
          Loading dashboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-6 text-red-400">
          <AlertCircle className="mb-2" />
          <p>{error}</p>
          <button onClick={fetchDashboardData} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) return null;

  const { user, today, thisMonth, allTime, weeklyTrend, recentOrders } = dashboardData;

  return (
    <div className="min-h-screen bg-slate-900 p-4 md:p-6 lg:p-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-white text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
            {getGreeting()}, {user.firstName} {user.secondName}👋
          </h1>
          <p className="text-gray-300 text-sm sm:text-base">
            Keep the orders flowing! Your business is {user.businessName || 'thriving'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setRefreshing(true) || fetchDashboardData()}
            className="bg-slate-800 p-3 rounded-lg hover:bg-slate-700 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw size={20} className={`text-white ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <div className="bg-amber-500 p-3 rounded-lg">
            <User size={24} className="text-white" />
          </div>
          <button
            onClick={handleLogout}
            className="text-red-400 hover:text-red-300 text-sm"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Balance Info with Deposit Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-slate-800/50 p-4 rounded-xl">
        <div className="w-full sm:w-auto">
          <span className="text-gray-400 block sm:inline">Your balance:</span>
          <span className="text-amber-500 text-2xl ml-0 sm:ml-2 font-bold">
            {user.currency} {user.currentBalance.toFixed(2)}
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <div>
            <span className="text-gray-400 block sm:inline">Spent Today:</span>
            <span className="text-amber-500 text-xl ml-0 sm:ml-2">
              {user.currency} {today.totalSpent.toFixed(2)}
            </span>
          </div>
          <button
            onClick={handleDeposit}
            className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors w-full sm:w-auto"
          >
            Top Up Wallet
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="bg-amber-500 rounded-xl p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Wallet Balance */}
          <div className="bg-black/10 p-4 rounded-lg hover:bg-black/20 transition-colors">
            <div className="bg-black/20 w-10 h-10 rounded-full flex items-center justify-center mb-3">
              <Wallet className="text-white" size={20} />
            </div>
            <div className="text-white">
              <p className="mb-2 text-sm">Wallet Balance</p>
              <p className="text-xl font-bold">
                {user.currency} {user.currentBalance.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Orders Today */}
          <div className="bg-black/10 p-4 rounded-lg hover:bg-black/20 transition-colors">
            <div className="bg-black/20 w-10 h-10 rounded-full flex items-center justify-center mb-3">
              <Package className="text-white" size={20} />
            </div>
            <div className="text-white">
              <p className="mb-2 text-sm">Orders Today</p>
              <p className="text-xl font-bold">{today.totalOrders}</p>
              <p className="text-xs opacity-80 mt-1">
                {today.completedOrders} completed
              </p>
            </div>
          </div>

          {/* Amount Today */}
          <div className="bg-black/10 p-4 rounded-lg hover:bg-black/20 transition-colors">
            <div className="bg-black/20 w-10 h-10 rounded-full flex items-center justify-center mb-3">
              <DollarSign className="text-white" size={20} />
            </div>
            <div className="text-white">
              <p className="mb-2 text-sm">Spent Today</p>
              <p className="text-xl font-bold">
                {user.currency} {today.totalSpent.toFixed(2)}
              </p>
              <p className="text-xs opacity-80 mt-1">
                Profit: {user.currency} {today.totalProfit.toFixed(2)}
              </p>
            </div>
          </div>

          {/* This Month Stats */}
          <div className="bg-black/10 p-4 rounded-lg hover:bg-black/20 transition-colors">
            <div className="bg-black/20 w-10 h-10 rounded-full flex items-center justify-center mb-3">
              <TrendingUp className="text-white" size={20} />
            </div>
            <div className="text-white">
              <p className="mb-2 text-sm">This Month</p>
              <p className="text-xl font-bold">{thisMonth.totalOrders} orders</p>
              <p className="text-xs opacity-80 mt-1">
                {user.currency} {thisMonth.totalSpent.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-gray-400 text-sm mb-2">All Time Orders</h3>
          <p className="text-white text-2xl font-bold">{allTime.totalOrders}</p>
          <p className="text-gray-500 text-sm mt-1">
            Total: {user.currency} {allTime.totalSpent.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-gray-400 text-sm mb-2">Average Order Value</h3>
          <p className="text-white text-2xl font-bold">
            {user.currency} {(allTime.averageOrderValue || 0).toFixed(2)}
          </p>
        </div>
        
        <div className="bg-slate-800 rounded-xl p-4">
          <h3 className="text-gray-400 text-sm mb-2">Status Today</h3>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <Clock className="text-yellow-500" size={16} />
              <span className="text-white text-sm">{today.pendingOrders}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="text-green-500" size={16} />
              <span className="text-white text-sm">{today.completedOrders}</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="text-red-500" size={16} />
              <span className="text-white text-sm">{today.failedOrders}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-slate-800 rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={20} className="text-white" />
          <h2 className="text-lg font-semibold text-white">Filter Options</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="mb-2 text-sm font-medium text-gray-400">Filter by Date:</p>
            <input 
              type="date" 
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
            />
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-gray-400">Filter by Recipient:</p>
            <input 
              type="text" 
              placeholder="Eg. 024xxxxxxx" 
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              value={filterRecipient}
              onChange={e => setFilterRecipient(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Package size={20} className="text-white" />
          <h2 className="text-lg font-semibold text-white">
            Recent Orders {filterDate ? `(${filterDate})` : ''}
          </h2>
        </div>
        
        {(filterDate || filterRecipient ? filteredOrders : recentOrders).length === 0 ? (
          <div className="text-gray-500 bg-slate-800 rounded-lg p-6 text-center">
            No orders found {filterDate ? 'for this date' : 'matching your criteria'}.
          </div>
        ) : (
          <div className="space-y-4">
            {(filterDate || filterRecipient ? filteredOrders : recentOrders).map((order) => {
              let statusIcon = null;
              let statusColor = '';
              
              switch (order.status) {
                case 'completed':
                  statusIcon = <CheckCircle size={20} />;
                  statusColor = 'text-green-400';
                  break;
                case 'onPending':
                case 'pending':
                  statusIcon = <Clock size={20} />;
                  statusColor = 'text-yellow-400';
                  break;
                case 'processing':
                  statusIcon = <RefreshCw size={20} />;
                  statusColor = 'text-blue-400';
                  break;
                case 'failed':
                  statusIcon = <XCircle size={20} />;
                  statusColor = 'text-red-400';
                  break;
                default:
                  statusIcon = <AlertCircle size={20} />;
                  statusColor = 'text-gray-400';
              }
              
              return (
                <div 
                  key={order._id || order.reference} 
                  className="bg-slate-800 rounded-lg shadow p-4 hover:bg-slate-700 transition-all border border-slate-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className={`flex items-center gap-2 ${statusColor}`}>
                        {statusIcon}
                        <span className="font-semibold capitalize">
                          {order.status === 'onPending' ? 'Pending' : order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        Reference: {order.reference || '-'}
                      </p>
                      <p className="text-sm text-gray-400">
                        Recipient: {order.recipient || '-'}
                      </p>
                      <p className="text-sm text-gray-400">
                        Network: <span className="text-amber-400">{order.networkKey || '-'}</span>
                      </p>
                      {/* {order.provider && (
                        <p className="text-sm text-gray-400">
                          Provider: <span className="text-blue-400">{order.provider}</span>
                        </p>
                      )} */}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-white text-lg">
                        {order.capacity} GB
                      </p>
                      <p className="text-amber-400 font-semibold">
                        {user.currency} {order.price}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleTimeString('en-US', {
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
        )}
      </div>

      {/* Weekly Trend (if available) */}
      {weeklyTrend && weeklyTrend.length > 0 && (
        <div className="mt-6 bg-slate-800 rounded-xl p-6">
          <h3 className="text-white text-lg font-semibold mb-4">Last 7 Days Trend</h3>
          <div className="grid grid-cols-7 gap-2">
            {weeklyTrend.map(day => (
              <div key={day._id} className="text-center">
                <p className="text-xs text-gray-400 mb-1">
                  {new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <div className="bg-amber-500 rounded p-2">
                  <p className="text-white font-bold">{day.orders}</p>
                  <p className="text-xs text-white opacity-80">
                    {user.currency}{day.spent.toFixed(0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;