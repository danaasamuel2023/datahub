// pages/admin/users.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [walletAdjustment, setWalletAdjustment] = useState({
    amount: '',
    type: 'credit',
    description: '',
    reason: ''
  });
  
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, status]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (search) params.search = search;
      if (status !== 'all') params.status = status;
      
      const response = await axios.get('https://serverdatahub.onrender.com/api/admin/users', {
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchUsers();
  };

  const viewUserDetails = async (userId) => {
    try {
      const response = await axios.get(`https://serverdatahub.onrender.com/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      setSelectedUser(response.data.data);
      setShowUserModal(true);
    } catch (error) {
      console.error('Failed to fetch user details:', error); 
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    const confirmMsg = currentStatus ? 
      'Are you sure you want to enable this user?' : 
      'Are you sure you want to disable this user?';
    
    if (!confirm(confirmMsg)) return;
    
    try {
      await axios.patch(`https://serverdatahub.onrender.com/api/admin/users/${userId}/status`, {
        isDisabled: !currentStatus,
        reason: !currentStatus ? 'Admin disabled' : 'Admin enabled'
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      fetchUsers();
      alert(`User ${currentStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      alert('Failed to update user status');
    }
  };

  const handleWalletAdjustment = async () => {
    if (!selectedUser || !walletAdjustment.amount || !walletAdjustment.description || !walletAdjustment.reason) {
      alert('Please fill all fields');
      return;
    }
    
    try {
      const response = await axios.post(`https://serverdatahub.onrender.com/api/admin/users/${selectedUser.user._id}/wallet/adjust`, {
        amount: parseFloat(walletAdjustment.amount),
        type: walletAdjustment.type,
        description: walletAdjustment.description,
        reason: walletAdjustment.reason
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      setShowWalletModal(false);
      setWalletAdjustment({
        amount: '',
        type: 'credit',
        description: '',
        reason: ''
      });
      fetchUsers();
      alert(`Wallet ${walletAdjustment.type} of ${formatCurrency(walletAdjustment.amount)} successful`);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to adjust wallet');
    }
  };

  const navigateToTransactions = (userId) => {
    // Set the userId in localStorage to be used by transactions page
    localStorage.setItem('selectedUserId', userId);
    router.push('/admin/transactions');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users Management</h1>
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/admin/transactions')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            All Transactions
          </button>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Users</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
        <button
          type="submit"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          🔍 Search
        </button>
      </form>

      {/* Users Table */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.firstName} {user.secondName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        ID: {user._id.slice(-8)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{user.email}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{user.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatCurrency(user.wallet?.balance || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.isDisabled
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      }`}>
                        {user.isDisabled ? 'Disabled' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        <button
                          onClick={() => viewUserDetails(user._id)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                          title="View Details"
                        >
                          View
                        </button>
                        <button
                          onClick={() => router.push(`/admin/user/${user._id}/orders`)}
                          className="text-green-600 hover:text-green-900 dark:text-green-400"
                          title="View Orders"
                        >
                          Orders
                        </button>
                        <button
                          onClick={() => navigateToTransactions(user._id)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                          title="View Transactions"
                        >
                          Transactions
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser({user});
                            setShowWalletModal(true);
                          }}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400"
                          title="Adjust Wallet"
                        >
                          Wallet
                        </button>
                        <button
                          onClick={() => toggleUserStatus(user._id, user.isDisabled)}
                          className={user.isDisabled 
                            ? "text-green-600 hover:text-green-900 dark:text-green-400" 
                            : "text-red-600 hover:text-red-900 dark:text-red-400"}
                          title={user.isDisabled ? 'Enable User' : 'Disable User'}
                        >
                          {user.isDisabled ? 'Enable' : 'Disable'}
                        </button>
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
                  <span className="font-medium">{pagination.pages}</span> ({pagination.total} users)
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

      {/* Wallet Adjustment Modal */}
      {showWalletModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Adjust Wallet Balance
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                User: {selectedUser.user.firstName} {selectedUser.user.secondName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Current Balance: {formatCurrency(selectedUser.user.wallet?.balance || 0)}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Type
                </label>
                <select
                  value={walletAdjustment.type}
                  onChange={(e) => setWalletAdjustment(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="credit">Credit (Add Funds)</option>
                  <option value="debit">Debit (Remove Funds)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={walletAdjustment.amount}
                  onChange={(e) => setWalletAdjustment(prev => ({ ...prev, amount: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={walletAdjustment.description}
                  onChange={(e) => setWalletAdjustment(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Refund for order #123"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <textarea
                  value={walletAdjustment.reason}
                  onChange={(e) => setWalletAdjustment(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows="3"
                  placeholder="Detailed reason for this adjustment..."
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowWalletModal(false);
                  setWalletAdjustment({
                    amount: '',
                    type: 'credit',
                    description: '',
                    reason: ''
                  });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleWalletAdjustment}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirm Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                User Details
              </h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            {selectedUser.user && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</p>
                    <p className="text-gray-900 dark:text-white">
                      {selectedUser.user.firstName} {selectedUser.user.secondName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white">{selectedUser.user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-white">{selectedUser.user.phoneNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      selectedUser.user.isDisabled
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {selectedUser.user.isDisabled ? 'Disabled' : 'Active'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Orders</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedUser.statistics?.totalOrders || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Completed Orders</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedUser.statistics?.completedOrders || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(selectedUser.statistics?.totalSpent || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Wallet Balance</p>
                      <p className="text-xl font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(selectedUser.statistics?.walletBalance || 0)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons in Modal */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      router.push(`/admin/user/${selectedUser.user._id}/orders`);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    View Orders
                  </button>
                  <button
                    onClick={() => {
                      setShowUserModal(false);
                      navigateToTransactions(selectedUser.user._id);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    View Transactions
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement;