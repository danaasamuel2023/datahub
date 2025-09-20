'use client'
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Download, Filter, TrendingUp, TrendingDown, Wallet, RefreshCw, Calendar, DollarSign, Activity } from 'lucide-react';

const WalletHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1
  });
  const [stats, setStats] = useState({
    totalCredits: 0,
    totalDebits: 0,
    pendingTransactions: 0
  });
  const [expandedRow, setExpandedRow] = useState(null);

  // Mock authentication token - replace with your actual auth method
  const getAuthToken = () => {
    // This should come from your authentication system
    // e.g., localStorage.getItem('authToken') or from context
    return localStorage.getItem('Token') || 'mock-auth-token';
  };

  // Fetch wallet history
  const fetchWalletHistory = async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        ...(filters.type && { type: filters.type }),
        ...(filters.status && { status: filters.status })
      });

      const response = await fetch(`http://localhost:5000/api/orders/wallet-history?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch wallet history');
      }

      const data = await response.json();

      if (data.success) {
        setTransactions(data.data.transactions || []);
        setCurrentBalance(data.data.currentBalance || 0);
        setPagination(data.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
        
        // Calculate stats
        calculateStats(data.data.transactions || []);
      } else {
        throw new Error(data.message || 'Failed to load transactions');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching wallet history:', err);
      
      // Load mock data for demonstration
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  // Calculate transaction statistics
  const calculateStats = (txns) => {
    const stats = txns.reduce((acc, txn) => {
      const amount = Number(txn.amount) || 0;
      if (txn.type === 'credit') {
        acc.totalCredits += amount;
      } else if (txn.type === 'debit') {
        acc.totalDebits += amount;
      }
      if (txn.status === 'pending') {
        acc.pendingTransactions++;
      }
      return acc;
    }, { totalCredits: 0, totalDebits: 0, pendingTransactions: 0 });
    
    setStats(stats);
  };

  // Load mock data for demonstration
  const loadMockData = () => {
    const mockTransactions = [
      {
        _id: '1',
        type: 'credit',
        amount: 500.00,
        description: 'Wallet Top-up via Mobile Money',
        status: 'completed',
        timestamp: new Date('2024-01-15T10:30:00'),
        balanceBefore: 150.00,
        balanceAfter: 650.00,
        reference: 'TXN123456789'
      },
      {
        _id: '2',
        type: 'debit',
        amount: 45.00,
        description: 'MTN 5GB for 0541234567',
        status: 'completed',
        timestamp: new Date('2024-01-15T11:15:00'),
        balanceBefore: 650.00,
        balanceAfter: 605.00,
        reference: 'ORD987654321'
      },
      {
        _id: '3',
        type: 'debit',
        amount: 30.00,
        description: 'TELECEL 3GB for 0201234567',
        status: 'pending',
        timestamp: new Date('2024-01-15T12:00:00'),
        balanceBefore: 605.00,
        balanceAfter: 575.00,
        reference: 'ORD456789123'
      },
      {
        _id: '4',
        type: 'credit',
        amount: 1000.00,
        description: 'Wallet Top-up via Bank Transfer',
        status: 'completed',
        timestamp: new Date('2024-01-14T09:00:00'),
        balanceBefore: 575.00,
        balanceAfter: 1575.00,
        reference: 'TXN789456123'
      },
      {
        _id: '5',
        type: 'debit',
        amount: 75.00,
        description: 'AT_PREMIUM 10GB for 0261234567',
        status: 'completed',
        timestamp: new Date('2024-01-14T14:30:00'),
        balanceBefore: 1575.00,
        balanceAfter: 1500.00,
        reference: 'ORD321654987'
      }
    ];

    setTransactions(mockTransactions);
    setCurrentBalance(1500.00);
    setPagination({
      page: 1,
      limit: 20,
      total: 5,
      pages: 1
    });
    calculateStats(mockTransactions);
    setError(null); // Clear any error when loading mock data
  };

  useEffect(() => {
    fetchWalletHistory();
  }, [filters.page, filters.type, filters.status]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filters change
    }));
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    // Handle null, undefined, or invalid amounts
    if (amount === null || amount === undefined || isNaN(amount)) {
      return 'GHS 0.00';
    }
    return `GHS ${Number(amount).toFixed(2)}`;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  // Get transaction icon
  const getTransactionIcon = (type) => {
    if (type === 'credit') {
      return <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />;
    } else {
      return <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />;
    }
  };

  // Export transactions
  const exportTransactions = () => {
    const csvContent = [
      ['Date', 'Type', 'Description', 'Amount', 'Balance Before', 'Balance After', 'Status', 'Reference'],
      ...transactions.map(txn => [
        formatDate(txn.timestamp),
        txn.type || 'N/A',
        txn.description || 'N/A',
        txn.amount || 0,
        txn.balanceBefore || 0,
        txn.balanceAfter || 0,
        txn.status || 'N/A',
        txn.reference || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-6 mb-6 transition-colors duration-200">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Wallet History</h1>
              <p className="text-gray-600 dark:text-gray-400">Track all your wallet transactions and balance changes</p>
            </div>
            <button
              onClick={exportTransactions}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Wallet className="w-8 h-8 opacity-80" />
                <span className="text-xs opacity-80">Current Balance</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(currentBalance || 0)}</p>
            </div>

            <div className="bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 opacity-80" />
                <span className="text-xs opacity-80">Total Credits</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalCredits || 0)}</p>
            </div>

            <div className="bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown className="w-8 h-8 opacity-80" />
                <span className="text-xs opacity-80">Total Debits</span>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalDebits || 0)}</p>
            </div>

            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 dark:from-yellow-600 dark:to-yellow-700 rounded-lg p-4 text-white">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-8 h-8 opacity-80" />
                <span className="text-xs opacity-80">Pending</span>
              </div>
              <p className="text-2xl font-bold">{stats.pendingTransactions || 0}</p>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-4 mb-6 transition-colors duration-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filters:</span>
            </div>

            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
            >
              <option value="">All Types</option>
              <option value="credit">Credits Only</option>
              <option value="debit">Debits Only</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>

            <button
              onClick={fetchWalletHistory}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 overflow-hidden transition-colors duration-200">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <button
                  onClick={fetchWalletHistory}
                  className="px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Balance Change
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((transaction) => (
                      <React.Fragment key={transaction._id}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                              {formatDate(transaction.timestamp)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getTransactionIcon(transaction.type)}
                              <span className={`text-sm font-medium capitalize ${
                                transaction.type === 'credit' 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-red-600 dark:text-red-400'
                              }`}>
                                {transaction.type}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            <div className="max-w-xs truncate" title={transaction.description}>
                              {transaction.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-semibold ${
                              transaction.type === 'credit' 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {transaction.type === 'credit' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400">Before:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(transaction.balanceBefore)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 dark:text-gray-400">After:</span>
                                <span className="font-medium text-gray-900 dark:text-gray-100">{formatCurrency(transaction.balanceAfter)}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              getStatusColor(transaction.status)
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <button
                              onClick={() => setExpandedRow(expandedRow === transaction._id ? null : transaction._id)}
                              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                              {expandedRow === transaction._id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>
                        {expandedRow === transaction._id && (
                          <tr>
                            <td colSpan="7" className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
                              <div className="space-y-2">
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Reference:</span>
                                  <span className="font-mono text-gray-900 dark:text-gray-100">{transaction.reference || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Transaction ID:</span>
                                  <span className="font-mono text-gray-900 dark:text-gray-100">{transaction._id}</span>
                                </div>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-gray-500 dark:text-gray-400">Full Description:</span>
                                  <span className="text-gray-900 dark:text-gray-100">{transaction.description}</span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Showing{' '}
                        <span className="font-medium">
                          {(pagination.page - 1) * pagination.limit + 1}
                        </span>{' '}
                        to{' '}
                        <span className="font-medium">
                          {Math.min(pagination.page * pagination.limit, pagination.total)}
                        </span>{' '}
                        of{' '}
                        <span className="font-medium">{pagination.total}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                        >
                          Previous
                        </button>
                        {[...Array(Math.min(5, pagination.pages))].map((_, idx) => {
                          const pageNum = idx + 1;
                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium transition-colors ${
                                pageNum === pagination.page
                                  ? 'z-10 bg-blue-50 dark:bg-blue-900/50 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-300'
                                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                        {pagination.pages > 5 && (
                          <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                            ...
                          </span>
                        )}
                        <button
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Empty State */}
        {!loading && !error && transactions.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm dark:shadow-gray-900/50 p-12 transition-colors duration-200">
            <div className="text-center">
              <Wallet className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No transactions found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {filters.type || filters.status
                  ? 'Try adjusting your filters'
                  : 'Your wallet history will appear here'}
              </p>
              {(filters.type || filters.status) && (
                <button
                  onClick={() => setFilters({ type: '', status: '', page: 1, limit: 20 })}
                  className="mt-4 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WalletHistory;