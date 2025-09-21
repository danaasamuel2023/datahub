'use client';
import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Loader2,
  Info,
  X
} from 'lucide-react';

const DepositPage = () => {
  // State management
  const [walletData, setWalletData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [feeInfo, setFeeInfo] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fee calculation (assuming 1.95% + 0.25 GHS as default)
  const calculateFees = (inputAmount) => {
    if (!inputAmount || isNaN(inputAmount)) return null;
    
    const amount = parseFloat(inputAmount);
    const percentageFee = amount * 0.0195; // 1.95%
    const fixedFee = 0.25; // 0.25 GHS
    const totalFee = percentageFee + fixedFee;
    const totalPayment = amount + totalFee;
    
    return {
      desiredAmount: amount,
      fee: totalFee,
      totalPayment: totalPayment
    };
  };

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('Token');
      const response = await fetch('https://serverdatahub.onrender.com/api/user/wallet', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWalletData(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    setRefreshing(true);
    try {
      const token = localStorage.getItem('Token');
      const response = await fetch('https://serverdatahub.onrender.com/api/v1/transactions?limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.data.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setRefreshing(false);
    }
  };

  // Initialize payment
  const handleInitializePayment = async () => {
    if (!amount || parseFloat(amount) < 1) {
      setError('Please enter an amount of at least GHS 1.00');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('Token');
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      
      const response = await fetch('https://serverdatahub.onrender.com/api/v1/initialize-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          email: email || userData.email,
          callback_url: `${window.location.origin}/deposit/verify`
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        // Store reference for verification after redirect
        sessionStorage.setItem('payment_reference', data.data.reference);
        sessionStorage.setItem('payment_amount', amount);
        
        // Redirect to Paystack
        window.location.href = data.data.authorization_url;
      } else {
        throw new Error(data.message || 'Failed to initialize payment');
      }
    } catch (err) {
      setError(err.message || 'Failed to initialize payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Verify payment (called after redirect back)
  const verifyPayment = async (reference) => {
    setVerifying(true);
    setError('');
    
    try {
      const token = localStorage.getItem('Token');
      const response = await fetch('https://serverdatahub.onrender.com/api/payments/verify-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reference })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setSuccess(data.data.alreadyProcessed 
          ? 'Payment already processed successfully!' 
          : `Payment successful! GHS ${data.data.amount.toFixed(2)} has been added to your wallet.`
        );
        
        // Clear stored payment data
        sessionStorage.removeItem('payment_reference');
        sessionStorage.removeItem('payment_amount');
        
        // Refresh wallet and transactions
        fetchWalletData();
        fetchTransactions();
      } else {
        throw new Error(data.message || 'Payment verification failed');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify payment. Please check your transaction history.');
    } finally {
      setVerifying(false);
    }
  };

  // Check for payment verification on mount
  useEffect(() => {
    // Check if returning from payment
    const urlParams = new URLSearchParams(window.location.search);
    const reference = urlParams.get('reference') || sessionStorage.getItem('payment_reference');
    
    if (reference) {
      verifyPayment(reference);
    }
    
    // Fetch initial data
    fetchWalletData();
    fetchTransactions();
    
    // Get user email
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    if (userData.email) {
      setEmail(userData.email);
    }
  }, []);

  // Update fee info when amount changes
  useEffect(() => {
    const fees = calculateFees(amount);
    setFeeInfo(fees);
  }, [amount]);

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Wallet className="w-8 h-8 text-blue-600" />
            Wallet Deposit
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Add funds to your wallet using Paystack secure payment
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Deposit Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Balance Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Current Balance
                </h2>
                <button
                  onClick={fetchWalletData}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
              <div className="text-4xl font-bold text-gray-900 dark:text-white">
                GHS {walletData?.balance?.toFixed(2) || '0.00'}
              </div>
              {walletData?.pendingTransactions > 0 && (
                <p className="text-sm text-yellow-600 dark:text-yellow-400 mt-2 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {walletData.pendingTransactions} pending transaction(s)
                </p>
              )}
            </div>

            {/* Deposit Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Add Funds
              </h2>

              {/* Success Alert */}
              {success && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-green-800 dark:text-green-200">{success}</p>
                    </div>
                    <button
                      onClick={() => setSuccess('')}
                      className="text-green-600 hover:text-green-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-800 dark:text-red-200">{error}</p>
                    </div>
                    <button
                      onClick={() => setError('')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (GHS)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    GHS
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-14 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                    disabled={loading || verifying}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Minimum deposit: GHS 1.00
                </p>
              </div>

              {/* Fee Breakdown */}
              {feeInfo && amount && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount to add:</span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        GHS {feeInfo.desiredAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Processing fee:
                      </span>
                      <span className="text-gray-900 dark:text-white font-medium">
                        GHS {feeInfo.fee.toFixed(2)}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-900 dark:text-white font-semibold">
                          Total payment:
                        </span>
                        <span className="text-gray-900 dark:text-white font-bold text-lg">
                          GHS {feeInfo.totalPayment.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading || verifying}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={handleInitializePayment}
                disabled={loading || verifying || !amount || parseFloat(amount) < 1}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : verifying ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Verifying Payment...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Pay with Paystack
                  </>
                )}
              </button>

              {/* Security Note */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    Your payment is secured by Paystack. You'll be redirected to complete the payment and automatically returned here.
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Transaction History Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Recent Transactions
                </h2>
                <button
                  onClick={() => {
                    setShowHistory(!showHistory);
                    if (!showHistory) fetchTransactions();
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.length === 0 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No transactions yet
                  </p>
                ) : (
                  transactions.map((transaction, index) => (
                    <div
                      key={transaction.reference || index}
                      className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2">
                          {transaction.type === 'credit' ? (
                            <ArrowDownRight className="w-4 h-4 text-green-600 mt-1" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 text-red-600 mt-1" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {transaction.type === 'credit' ? 'Deposit' : 'Purchase'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(transaction.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${
                            transaction.type === 'credit' 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {transaction.type === 'credit' ? '+' : '-'}GHS {transaction.amount?.toFixed(2) || '0.00'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            <span className={`inline-flex items-center gap-1 ${
                              transaction.status === 'completed' ? 'text-green-600' :
                              transaction.status === 'pending' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {transaction.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                              {transaction.status === 'pending' && <Clock className="w-3 h-3" />}
                              {transaction.status === 'failed' && <X className="w-3 h-3" />}
                              {transaction.status}
                            </span>
                          </p>
                        </div>
                      </div>
                      {transaction.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          {transaction.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>

              {transactions.length > 0 && (
                <button
                  onClick={() => window.location.href = '/transactions'}
                  className="w-full mt-4 py-2 text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  View All Transactions →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositPage;