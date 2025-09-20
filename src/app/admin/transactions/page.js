// pages/admin/transactions.js
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const TransactionsManagement = () => {
  const [allTransactions, setAllTransactions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    startDate: '',
    endDate: '',
    userId: ''
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  });
  const [summary, setSummary] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 });
  
  const router = useRouter();

  useEffect(() => {
    // Check if there's a userId from localStorage (coming from users page)
    const userIdFromStorage = localStorage.getItem('selectedUserId');
    if (userIdFromStorage) {
      setFilters(prev => ({ ...prev, userId: userIdFromStorage }));
      setSelectedUser(userIdFromStorage);
      localStorage.removeItem('selectedUserId'); // Clean up after use
    }
    
    fetchUsers();
    fetchAllTransactions();
  }, []);

  useEffect(() => {
    if (filters.userId) {
      fetchUserTransactions();
    } else {
      // If no user selected, show all transactions
      filterTransactions();
    }
  }, [pagination.page, filters.type, filters.status, filters.startDate, filters.endDate, filters.userId]);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('https://serverdatahub.onrender.com/api/admin/users', {
        params: { limit: 100 },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      setUsers(response.data.data.users);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const fetchAllTransactions = async () => {
    try {
      setLoading(true);
      
      // Fetch ALL users without limit or with pagination
      let allUsers = [];
      let page = 1;
      let hasMore = true;
      const pageSize = 100; // Fetch in batches to avoid timeout
      
      // First, get the total count
      const firstResponse = await axios.get('https://serverdatahub.onrender.com/api/admin/users', {
        params: { 
          limit: 1,
          page: 1 
        },
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      const totalUsers = firstResponse.data.data.pagination.total;
      setFetchProgress({ current: 0, total: totalUsers });
      
      // Fetch all users in batches
      while (hasMore) {
        const usersResponse = await axios.get('https://serverdatahub.onrender.com/api/admin/users', {
          params: { 
            limit: pageSize,
            page: page 
          },
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('Token')}`
          }
        });
        
        const { users, pagination: paginationInfo } = usersResponse.data.data;
        allUsers = [...allUsers, ...users];
        
        // Update progress
        setFetchProgress({ current: allUsers.length, total: totalUsers });
        
        // Check if there are more pages
        hasMore = page < paginationInfo.pages;
        page++;
      }
      
      console.log(`Fetched ${allUsers.length} total users`);
      
      const allUserTransactions = [];
      let totalCredits = 0;
      let totalDebits = 0;
      let completedCredits = 0;
      let completedDebits = 0;
      
      // Process transactions for each user
      for (const user of allUsers) {
        if (user.wallet?.transactions && user.wallet.transactions.length > 0) {
          user.wallet.transactions.forEach(transaction => {
            allUserTransactions.push({
              ...transaction,
              user: {
                _id: user._id,
                firstName: user.firstName,
                secondName: user.secondName,
                email: user.email
              }
            });
            
            // Calculate totals
            if (transaction.type === 'credit') {
              totalCredits += transaction.amount || 0;
              if (transaction.status === 'completed') {
                completedCredits += transaction.amount || 0;
              }
            } else if (transaction.type === 'debit') {
              totalDebits += transaction.amount || 0;
              if (transaction.status === 'completed') {
                completedDebits += transaction.amount || 0;
              }
            }
          });
        }
      }
      
      console.log(`Found ${allUserTransactions.length} total transactions`);
      
      // Sort by date (newest first)
      allUserTransactions.sort((a, b) => {
        const dateA = new Date(b.timestamp || b.createdAt);
        const dateB = new Date(a.timestamp || a.createdAt);
        return dateA - dateB;
      });
      
      setAllTransactions(allUserTransactions);
      setTransactions(allUserTransactions.slice(0, pagination.limit));
      
      // Set summary for all transactions
      setSummary({
        totalCredits,
        totalDebits,
        completedCredits,
        completedDebits,
        netFlow: completedCredits - completedDebits,
        currentBalance: null // No single balance for all users
      });
      
      setPagination({
        ...pagination,
        total: allUserTransactions.length,
        pages: Math.ceil(allUserTransactions.length / pagination.limit)
      });
      
    } catch (error) {
      console.error('Failed to fetch all transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
      setFetchProgress({ current: 0, total: 0 });
    }
  };

  const filterTransactions = () => {
    let filtered = [...allTransactions];
    
    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    
    if (filters.status) {
      filtered = filtered.filter(t => t.status === filters.status);
    }
    
    if (filters.startDate || filters.endDate) {
      const start = filters.startDate ? new Date(filters.startDate) : new Date(0);
      const end = filters.endDate ? new Date(filters.endDate) : new Date();
      end.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(t => {
        const txDate = new Date(t.timestamp || t.createdAt);
        return txDate >= start && txDate <= end;
      });
    }
    
    // Paginate
    const startIndex = (pagination.page - 1) * pagination.limit;
    const endIndex = startIndex + pagination.limit;
    setTransactions(filtered.slice(startIndex, endIndex));
    
    // Update pagination
    setPagination({
      ...pagination,
      total: filtered.length,
      pages: Math.ceil(filtered.length / pagination.limit)
    });
    
    // Recalculate summary for filtered data
    const totals = filtered.reduce((acc, tx) => {
      if (tx.type === 'credit') {
        acc.totalCredits += tx.amount || 0;
        if (tx.status === 'completed') acc.completedCredits += tx.amount || 0;
      } else {
        acc.totalDebits += tx.amount || 0;
        if (tx.status === 'completed') acc.completedDebits += tx.amount || 0;
      }
      return acc;
    }, {
      totalCredits: 0,
      totalDebits: 0,
      completedCredits: 0,
      completedDebits: 0
    });
    
    setSummary({
      ...totals,
      netFlow: totals.completedCredits - totals.completedDebits,
      currentBalance: null
    });
  };

  const fetchUserTransactions = async () => {
    if (!filters.userId) return;
    
    try {
      setLoading(true);
      
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        type: filters.type || undefined,
        status: filters.status || undefined,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined
      };
      
      // Remove undefined params
      Object.keys(params).forEach(key => {
        if (params[key] === undefined) delete params[key];
      });
      
      const response = await axios.get(`https://serverdatahub.onrender.com/api/admin/users/${filters.userId}/transactions`, {
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      setTransactions(response.data.data.transactions);
      setPagination(response.data.data.pagination);
      setSummary(response.data.data.summary);
    } catch (error) {
      console.error('Failed to fetch user transactions:', error);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const viewTransactionDetails = async (transaction) => {
    if (!transaction) return;
    
    // If we have a user ID, fetch from API, otherwise use the transaction data directly
    if (transaction.user?._id) {
      try {
        const response = await axios.get(
          `https://serverdatahub.onrender.com/api/admin/users/${transaction.user._id}/transactions/${transaction.reference || transaction._id}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('Token')}`
            }
          }
        );
        setSelectedTransaction(response.data.data);
      } catch (error) {
        console.error('Failed to fetch transaction details:', error);
        // Fallback to showing what we have
        setSelectedTransaction({ transaction });
      }
    } else {
      setSelectedTransaction({ transaction });
    }
    setShowTransactionModal(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleUserChange = (userId) => {
    setFilters(prev => ({ ...prev, userId }));
    setSelectedUser(userId);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const navigateToUserProfile = (userId) => {
    router.push(`/admin/users/${userId}`);
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
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'credit':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'debit':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getChannelBadge = (channel) => {
    const colors = {
      'card': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'bank': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'mobile_money': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'admin': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    
    return colors[channel] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Transactions Management
          {!filters.userId && <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">(All Users)</span>}
        </h1>
        <button
          onClick={() => router.push('/admin/dashboard')}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
        >
          Back to Dashboard
        </button>
      </div>

      {/* User Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Filter by User (Optional - Leave empty to see all transactions)
        </label>
        <select
          value={filters.userId}
          onChange={(e) => handleUserChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">-- All Users --</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.firstName} {user.secondName} - {user.email} ({formatCurrency(user.wallet?.balance || 0)})
            </option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {filters.userId && summary.currentBalance !== null && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatCurrency(summary.currentBalance)}
              </p>
            </div>
          )}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Credits</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary.totalCredits)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Debits</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(summary.totalDebits)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed Credits</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary.completedCredits)}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Net Flow</p>
            <p className={`text-2xl font-bold ${summary.netFlow >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(summary.netFlow)}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Types</option>
            <option value="credit">Credit</option>
            <option value="debit">Debit</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => handleFilterChange('startDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => handleFilterChange('endDate', e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="End Date"
          />
        </div>
      </div>

      {/* Loading State with Progress */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          {fetchProgress.total > 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Loading users: {fetchProgress.current} / {fetchProgress.total}
              </p>
              <div className="w-64 bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(fetchProgress.current / fetchProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  {!filters.userId && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Balance Before/After
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Channel
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
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={filters.userId ? "9" : "10"} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, index) => (
                    <tr key={transaction._id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {!filters.userId && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {transaction.user?.firstName} {transaction.user?.secondName}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {transaction.user?.email}
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {transaction.reference?.slice(-10) || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(transaction.type)}`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm">
                          <div className="text-gray-500 dark:text-gray-400">
                            Before: {formatCurrency(transaction.balanceBefore)}
                          </div>
                          <div className={`font-medium ${transaction.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            After: {formatCurrency(transaction.balanceAfter)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                        {transaction.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {transaction.channel ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChannelBadge(transaction.channel)}`}>
                            {transaction.channel}
                          </span>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.timestamp || transaction.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewTransactionDetails(transaction)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {transactions.length > 0 && (
            <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Showing page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{pagination.pages}</span> ({pagination.total} transactions)
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
          )}
        </div>
      )}

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Transaction Details
              </h3>
              <button
                onClick={() => setShowTransactionModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Transaction Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference</p>
                  <p className="text-gray-900 dark:text-white">{selectedTransaction.transaction?.reference || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(selectedTransaction.transaction?.type)}`}>
                    {selectedTransaction.transaction?.type}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Amount</p>
                  <p className="text-gray-900 dark:text-white text-lg font-bold">
                    {formatCurrency(selectedTransaction.transaction?.amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTransaction.transaction?.status)}`}>
                    {selectedTransaction.transaction?.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance Before</p>
                  <p className="text-gray-900 dark:text-white">{formatCurrency(selectedTransaction.transaction?.balanceBefore)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Balance After</p>
                  <p className="text-gray-900 dark:text-white">{formatCurrency(selectedTransaction.transaction?.balanceAfter)}</p>
                </div>
                {selectedTransaction.transaction?.channel && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Channel</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChannelBadge(selectedTransaction.transaction.channel)}`}>
                      {selectedTransaction.transaction.channel}
                    </span>
                  </div>
                )}
                {selectedTransaction.transaction?.processingFee > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Processing Fee</p>
                    <p className="text-gray-900 dark:text-white">{formatCurrency(selectedTransaction.transaction.processingFee)}</p>
                  </div>
                )}
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Description</p>
                  <p className="text-gray-900 dark:text-white">{selectedTransaction.transaction?.description || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created At</p>
                  <p className="text-gray-900 dark:text-white">
                    {formatDate(selectedTransaction.transaction?.timestamp || selectedTransaction.transaction?.createdAt)}
                  </p>
                </div>
                {selectedTransaction.transaction?.completedAt && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Completed At</p>
                    <p className="text-gray-900 dark:text-white">{formatDate(selectedTransaction.transaction.completedAt)}</p>
                  </div>
                )}
              </div>

              {/* User Info */}
              {selectedTransaction.transaction?.user && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">User Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                      <p className="text-gray-900 dark:text-white">
                        {selectedTransaction.transaction.user.firstName} {selectedTransaction.transaction.user.secondName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                      <p className="text-gray-900 dark:text-white">{selectedTransaction.transaction.user.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Related Order */}
              {selectedTransaction.relatedOrder && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Related Order</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Order Reference</p>
                      <p className="text-gray-900 dark:text-white">{selectedTransaction.relatedOrder.reference}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Network</p>
                      <p className="text-gray-900 dark:text-white">{selectedTransaction.relatedOrder.networkKey}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Recipient</p>
                      <p className="text-gray-900 dark:text-white">{selectedTransaction.relatedOrder.recipient}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Bundle</p>
                      <p className="text-gray-900 dark:text-white">{selectedTransaction.relatedOrder.capacity}MB</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Order Status</p>
                      <p className="text-gray-900 dark:text-white">{selectedTransaction.relatedOrder.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Order Date</p>
                      <p className="text-gray-900 dark:text-white">{formatDate(selectedTransaction.relatedOrder.createdAt)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsManagement;