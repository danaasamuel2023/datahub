// pages/admin/orders.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    networkKey: '',
    provider: '',
    startDate: '',
    endDate: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [manualNotes, setManualNotes] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Bulk selection states
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, [pagination.page, filters.status, filters.networkKey, filters.provider, activeTab]);

  useEffect(() => {
    // Reset selections when orders change
    setSelectedOrders([]);
    setSelectAll(false);
  }, [orders]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      let endpoint = 'http://localhost:5000/api/admin/orders';
      if (activeTab === 'manual') {
        endpoint = 'http://localhost:5000/api/admin/orders/manual-pending';
      }
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      };
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '') delete params[key];
      });
      
      const response = await axios.get(endpoint, {
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      setOrders(response.data.data.orders);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchOrders();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const viewOrderDetails = async (orderId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      setSelectedOrder(response.data.data);
      setShowOrderModal(true);
    } catch (error) {
      console.error('Failed to fetch order details:', error);
    }
  };

  const updateOrderStatus = async (orderId, newStatus, skipConfirm = false) => {
    if (!skipConfirm && !confirm(`Are you sure you want to update this order to ${newStatus}?`)) return;
    
    try {
      await axios.patch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        status: newStatus
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      // Update local state immediately for better UX
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      
      return true;
    } catch (error) {
      console.error('Failed to update order status:', error);
      alert('Failed to update order status');
      return false;
    }
  };

  const handleBulkStatusUpdate = async (newStatus) => {
    if (selectedOrders.length === 0) {
      alert('Please select orders to update');
      return;
    }
    
    const confirmMessage = `Are you sure you want to update ${selectedOrders.length} order(s) to ${newStatus}?`;
    if (!confirm(confirmMessage)) return;
    
    setBulkProcessing(true);
    let successCount = 0;
    let failCount = 0;
    
    // Process updates in parallel with rate limiting
    const batchSize = 5; // Process 5 at a time
    for (let i = 0; i < selectedOrders.length; i += batchSize) {
      const batch = selectedOrders.slice(i, i + batchSize);
      const results = await Promise.all(
        batch.map(orderId => updateOrderStatus(orderId, newStatus, true))
      );
      
      successCount += results.filter(r => r === true).length;
      failCount += results.filter(r => r === false).length;
    }
    
    setBulkProcessing(false);
    
    // Show results
    alert(`Bulk update completed:\n✓ ${successCount} successful\n✗ ${failCount} failed`);
    
    // Reset selections
    setSelectedOrders([]);
    setSelectAll(false);
    setShowBulkActions(false);
    
    // Refresh orders list
    fetchOrders();
  };

  const processManualOrder = async (orderId, markCompleted) => {
    try {
      await axios.post(`http://localhost:5000/api/admin/orders/${orderId}/process-manual`, {
        notes: manualNotes,
        markCompleted
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      setManualNotes('');
      fetchOrders();
      alert(`Order ${markCompleted ? 'completed' : 'marked as processing'} successfully`);
    } catch (error) {
      alert('Failed to process manual order');
    }
  };

  const navigateToUserOrders = (userId) => {
    router.push(`/admin/user/${userId}/orders`);
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders(prev => {
      if (prev.includes(orderId)) {
        return prev.filter(id => id !== orderId);
      } else {
        return [...prev, orderId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(order => order._id));
    }
    setSelectAll(!selectAll);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'onPending':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getProviderBadge = (provider) => {
    const colors = {
      'GEONECTECH': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'TELECEL': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'FGAMAIL': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'MANUAL': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    };
    
    return colors[provider] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Orders Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            All Orders
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-lg ${
              activeTab === 'manual'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            Manual Pending
          </button>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <div className="text-blue-900 dark:text-blue-200">
              <span className="font-semibold">{selectedOrders.length}</span> order(s) selected
              <button
                onClick={() => {
                  setSelectedOrders([]);
                  setSelectAll(false);
                }}
                className="ml-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear selection
              </button>
            </div>
            
            <div className="flex gap-2">
              {bulkProcessing ? (
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Processing...
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setShowBulkActions(!showBulkActions)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Bulk Actions ▼
                  </button>
                  
                  {showBulkActions && (
                    <div className="absolute right-4 mt-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-10">
                      <button
                        onClick={() => handleBulkStatusUpdate('processing')}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400"
                      >
                        Mark as Processing
                      </button>
                      <button
                        onClick={() => handleBulkStatusUpdate('completed')}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600 dark:text-green-400"
                      >
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => handleBulkStatusUpdate('failed')}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600 dark:text-red-400"
                      >
                        Mark as Failed
                      </button>
                      <button
                        onClick={() => handleBulkStatusUpdate('pending')}
                        className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-yellow-600 dark:text-yellow-400"
                      >
                        Mark as Pending
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="onPending">Manual Pending</option>
          </select>

          <select
            value={filters.networkKey}
            onChange={(e) => handleFilterChange('networkKey', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Networks</option>
            <option value="MTN">MTN</option>
            <option value="TELECEL">Telecel</option>
            <option value="AIRTELTIGO">AirtelTigo</option>
          </select>

          <select
            value={filters.provider}
            onChange={(e) => handleFilterChange('provider', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Providers</option>
            <option value="GEONECTECH">GeonecTech</option>
            <option value="TELECEL">Telecel</option>
            <option value="FGAMAIL">FGAMall</option>
            <option value="MANUAL">Manual</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Start Date"
          />
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search by reference or recipient..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            🔍 Search
          </button>
        </form>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={handleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Network/Bundle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Recipient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Balance Before/After
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Provider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order._id)}
                        onChange={() => handleSelectOrder(order._id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {order.reference.slice(-8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {order.user?.firstName || order.userInfo?.[0]?.firstName || 'N/A'} {order.user?.secondName || order.userInfo?.[0]?.secondName || ''}
                      </div>
                      {order.user?._id && (
                        <button
                          onClick={() => navigateToUserOrders(order.user._id)}
                          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline"
                        >
                          View all orders →
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{order.networkKey}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{order.capacity}MB</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {order.recipient}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(order.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="text-gray-500 dark:text-gray-400">
                          Before: {formatCurrency(order.balanceBefore)}
                        </div>
                        <div className={`font-medium ${order.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                          After: {formatCurrency(order.balanceAfter)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProviderBadge(order.provider)}`}>
                        {order.provider || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                        className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${getStatusColor(order.status)}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="onPending">Manual Pending</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewOrderDetails(order._id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                        >
                          View
                        </button>
                        {order.status === 'onPending' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowOrderModal(true);
                            }}
                            className="text-green-600 hover:text-green-900 dark:text-green-400"
                          >
                            Process
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                disabled={pagination.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{pagination.pages}</span> ({pagination.total} orders)
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                >
                  ← Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.pages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-50"
                >
                  Next →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Order Details - {selectedOrder.order?.reference || selectedOrder.reference}
              </h3>
              <button
                onClick={() => {
                  setShowOrderModal(false);
                  setManualNotes('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            {selectedOrder.order ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference</p>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.order.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.order.status)}`}>
                      {selectedOrder.order.status}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Network</p>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.order.networkKey}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Bundle</p>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.order.capacity}MB</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Recipient</p>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.order.recipient}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Provider</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getProviderBadge(selectedOrder.order.provider)}`}>
                      {selectedOrder.order.provider || 'N/A'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Price</p>
                    <p className="text-gray-900 dark:text-white">{formatCurrency(selectedOrder.order.price)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Profit</p>
                    <p className="text-gray-900 dark:text-white">{formatCurrency(selectedOrder.order.profit)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance Before</p>
                    <p className="text-gray-900 dark:text-white">{formatCurrency(selectedOrder.order.balanceBefore)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance After</p>
                    <p className="text-gray-900 dark:text-white">{formatCurrency(selectedOrder.order.balanceAfter)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                    <p className="text-gray-900 dark:text-white">{formatDate(selectedOrder.order.createdAt)}</p>
                  </div>
                  {selectedOrder.order.completedAt && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed</p>
                      <p className="text-gray-900 dark:text-white">{formatDate(selectedOrder.order.completedAt)}</p>
                    </div>
                  )}
                </div>

                {/* User Information */}
                {selectedOrder.order.user && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Customer Information</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                        <p className="text-gray-900 dark:text-white">
                          {selectedOrder.order.user.firstName} {selectedOrder.order.user.secondName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                        <p className="text-gray-900 dark:text-white">{selectedOrder.order.user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Phone</p>
                        <p className="text-gray-900 dark:text-white">{selectedOrder.order.user.phoneNumber}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
                        <p className="text-gray-900 dark:text-white">
                          {formatCurrency(selectedOrder.order.user.wallet?.balance || 0)}
                        </p>
                      </div>
                    </div>
                    {selectedOrder.order.user._id && (
                      <button
                        onClick={() => navigateToUserOrders(selectedOrder.order.user._id)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        View All User Orders
                      </button>
                    )}
                  </div>
                )}

                {/* Manual Processing Section */}
                {selectedOrder.order.status === 'onPending' && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Manual Processing</h4>
                    <textarea
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      rows="3"
                      placeholder="Enter processing notes..."
                    />
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => processManualOrder(selectedOrder.order._id, false)}
                        className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                      >
                        Mark as Processing
                      </button>
                      <button
                        onClick={() => processManualOrder(selectedOrder.order._id, true)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Update Section */}
                {selectedOrder.order.status !== 'completed' && selectedOrder.order.status !== 'onPending' && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Update Status</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.order._id, 'processing')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        disabled={selectedOrder.order.status === 'processing'}
                      >
                        Processing
                      </button>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.order._id, 'completed')}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        disabled={selectedOrder.order.status === 'completed'}
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.order._id, 'failed')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        disabled={selectedOrder.order.status === 'failed'}
                      >
                        Failed
                      </button>
                    </div>
                  </div>
                )}

                {/* API Response */}
                {selectedOrder.order.apiResponse && (
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">API Response</h4>
                    <pre className="bg-gray-100 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">
                      {JSON.stringify(selectedOrder.order.apiResponse, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Simple order display for manual pending */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference</p>
                    <p className="text-gray-900 dark:text-white">{selectedOrder.reference}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  {/* Add other fields as needed */}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManagement;