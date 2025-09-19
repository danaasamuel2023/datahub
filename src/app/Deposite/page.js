'use client';
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  AlertCircle, 
  Loader2, 
  Info, 
  Shield, 
  Zap,
  Wallet,
  ArrowLeft,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  Sparkles,
  DollarSign,
  Activity,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const ModernDepositPage = () => {
  // State management
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [user, setUser] = useState(null);
  const [walletBalance, setWalletBalance] = useState(2547.50);
  const [recentTransactions, setRecentTransactions] = useState([
    { id: 1, amount: 100.00, fee: 2.00, date: '2025-01-15', time: '14:30', status: 'completed' },
    { id: 2, amount: 250.00, fee: 5.00, date: '2025-01-14', time: '09:15', status: 'completed' },
    { id: 3, amount: 50.00, fee: 1.00, date: '2025-01-12', time: '18:45', status: 'completed' }
  ]);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  
  // Configuration
  const MIN_AMOUNT = 10;
  const MAX_AMOUNT = 10000;
  const PROCESSING_FEE = 0.02; // 2% added to payment

  // Quick amount options
  const quickAmounts = [
    { value: 10, label: '₵10', popular: false },
    { value: 20, label: '₵20', popular: false },
    { value: 50, label: '₵50', popular: true },
    { value: 100, label: '₵100', popular: true },
    { value: 200, label: '₵200', popular: false },
    { value: 500, label: '₵500', popular: false }
  ];

  // Load user data on mount
  useEffect(() => {
    // Simulated user data for demo
    setUser({
      id: '123',
      email: 'user@datahub.gh',
      name: 'John Doe'
    });
  }, []);

  // Handle deposit
  const handleDeposit = async () => {
    setError('');
    setSuccess('');

    const depositAmount = parseFloat(amount);
    
    // Validation
    if (!amount || isNaN(depositAmount)) {
      setError('Please enter a valid amount');
      return;
    }

    if (depositAmount < MIN_AMOUNT) {
      setError(`Minimum deposit amount is GHC ${MIN_AMOUNT.toFixed(2)}`);
      return;
    }

    if (depositAmount > MAX_AMOUNT) {
      setError(`Maximum deposit amount is GHC ${MAX_AMOUNT.toFixed(2)}`);
      return;
    }

    setLoading(true);
    
    try {
      // Simulated API call
      setTimeout(() => {
        setSuccess('Redirecting to secure payment gateway...');
        setLoading(false);
        // In real implementation, redirect to payment gateway
        console.log('Payment initialized with amount:', depositAmount);
      }, 2000);
    } catch (error) {
      console.error('Payment initialization error:', error);
      setError('Connection error. Please check your internet and try again.');
      setLoading(false);
    }
  };

  // Handle amount input change
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d{0,2}$/.test(value)) {
      setAmount(value);
      setSelectedAmount(null);
      setError('');
    }
  };

  // Set quick amount
  const setQuickAmount = (value) => {
    setAmount(value.toString());
    setSelectedAmount(value);
    setError('');
  };

  // Calculate fees
  const depositAmount = parseFloat(amount) || 0;
  const processingFee = depositAmount * PROCESSING_FEE;
  const totalPayment = depositAmount + processingFee;

  // Format date
  const formatDate = (date, time) => {
    return `${date} at ${time}`;
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-yellow-400/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-yellow-400/5 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="h-full w-full" style={{
            backgroundImage: 'linear-gradient(90deg, #facc15 1px, transparent 1px), linear-gradient(#facc15 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>
      
      <div className="relative z-10 max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => console.log('Navigate back')}
              className="flex items-center gap-2 text-yellow-400/70 hover:text-yellow-400 transition-colors mb-4 group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm">Back to Dashboard</span>
            </button>
            
            <h1 className="text-4xl font-bold text-yellow-400 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-yellow-400/20 to-yellow-600/20 rounded-xl">
                <Wallet className="w-8 h-8" />
              </div>
              Add Money to Wallet
            </h1>
          </div>
          
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 rounded-2xl p-6 border border-yellow-400/20 backdrop-blur-sm min-w-[250px]">
            <div className="flex items-center gap-2 text-yellow-400/70 text-sm mb-2">
              <Activity className="w-4 h-4" />
              Current Balance
            </div>
            {loadingBalance ? (
              <Loader2 className="w-5 h-5 animate-spin text-yellow-400" />
            ) : (
              <div className="text-3xl font-bold text-yellow-400">
                ₵{walletBalance.toFixed(2)}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Deposit Card */}
          <div className="lg:col-span-2">
            <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-yellow-400/20 shadow-2xl overflow-hidden">
              <div className="p-8 space-y-6">
                {/* Amount Input Section */}
                <div>
                  <label className="block text-sm font-medium text-yellow-400/80 mb-3">
                    Enter Amount to Add
                  </label>
                  <div className="relative group">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-yellow-400">
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={amount}
                      onChange={handleAmountChange}
                      className="w-full pl-16 pr-6 py-6 text-3xl font-bold
                               border-2 border-yellow-400/30 rounded-xl 
                               bg-black/70 text-yellow-400
                               focus:outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10
                               placeholder-yellow-400/20 transition-all"
                      placeholder="0.00"
                      disabled={loading}
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-yellow-400/50 text-sm">
                      GHC
                    </div>
                  </div>
                  <div className="flex justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Min: ₵{MIN_AMOUNT} • Max: ₵{MAX_AMOUNT.toLocaleString()}
                    </p>
                    {amount && depositAmount >= MIN_AMOUNT && (
                      <p className="text-xs text-green-400 animate-fadeIn">
                        ✓ Valid amount
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Amount Grid */}
                <div>
                  <p className="text-xs text-yellow-400/60 mb-3 uppercase tracking-wide">Quick Select</p>
                  <div className="grid grid-cols-3 gap-3">
                    {quickAmounts.map((quick) => (
                      <button
                        key={quick.value}
                        onClick={() => setQuickAmount(quick.value)}
                        disabled={loading}
                        className={`relative py-4 px-4 rounded-xl font-semibold transition-all transform hover:scale-[1.02]
                                 ${selectedAmount === quick.value 
                                   ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-400/30' 
                                   : 'bg-black/50 border border-yellow-400/30 text-yellow-400 hover:bg-yellow-400/10 hover:border-yellow-400/50'
                                 }
                                 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                      >
                        {quick.label}
                        {quick.popular && (
                          <span className="absolute -top-2 -right-2 bg-green-500 text-black text-[10px] px-2 py-1 rounded-full font-bold">
                            Popular
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fee Breakdown Card */}
                {amount && depositAmount >= MIN_AMOUNT && (
                  <div className="bg-gradient-to-br from-yellow-400/5 to-yellow-600/5 rounded-xl p-6 border border-yellow-400/20">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400 flex items-center gap-2">
                          <Wallet className="w-4 h-4" />
                          Amount to wallet
                        </span>
                        <span className="text-2xl font-bold text-green-400">
                          ₵{depositAmount.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Info className="w-3 h-3" />
                          Processing fee (2%)
                        </span>
                        <span className="text-yellow-400/70 flex items-center gap-1">
                          <Plus className="w-3 h-3" />
                          ₵{processingFee.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="pt-4 border-t border-yellow-400/20">
                        <div className="flex justify-between items-center">
                          <span className="text-yellow-400 font-medium">
                            Total to pay
                          </span>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-yellow-400">
                              ₵{totalPayment.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">via Paystack</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-green-400/10 rounded-lg p-3">
                        <p className="text-xs text-green-400 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          You'll receive exactly ₵{depositAmount.toFixed(2)} in your wallet
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="flex items-start gap-3 p-4 bg-red-900/20 rounded-xl border border-red-400/50">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Success Message */}
                {success && (
                  <div className="flex items-start gap-3 p-4 bg-green-900/20 rounded-xl border border-green-400/50">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-400 font-medium">{success}</p>
                      <p className="text-xs text-green-400/70 mt-1">Please wait...</p>
                    </div>
                  </div>
                )}

                {/* Deposit Button */}
                <button
                  onClick={handleDeposit}
                  disabled={loading || !amount || depositAmount < MIN_AMOUNT || depositAmount > MAX_AMOUNT}
                  className="w-full relative group overflow-hidden py-5 px-8 
                           bg-gradient-to-r from-yellow-400 to-yellow-500 
                           text-black font-bold text-lg rounded-xl
                           hover:shadow-2xl hover:shadow-yellow-400/30
                           focus:outline-none focus:ring-4 focus:ring-yellow-400/50
                           disabled:from-gray-800 disabled:to-gray-900 disabled:text-gray-600
                           disabled:cursor-not-allowed
                           transform transition-all duration-300 hover:scale-[1.02]"
                >
                  <div className="relative z-10 flex items-center justify-center gap-3">
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing Payment...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>
                          {amount && depositAmount >= MIN_AMOUNT 
                            ? `Pay ₵${totalPayment.toFixed(2)} Now`
                            : 'Enter Amount to Continue'
                          }
                        </span>
                        {amount && depositAmount >= MIN_AMOUNT && (
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        )}
                      </>
                    )}
                  </div>
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                </button>

                {/* Security badges */}
                <div className="flex items-center justify-center gap-6 py-2">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="p-1.5 bg-green-400/10 rounded-lg">
                      <Shield className="w-4 h-4 text-green-400" />
                    </div>
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="p-1.5 bg-yellow-400/10 rounded-lg">
                      <Zap className="w-4 h-4 text-yellow-400" />
                    </div>
                    <span>Instant</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className="p-1.5 bg-blue-400/10 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-400" />
                    </div>
                    <span>24/7 Available</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Recent Transactions */}
            <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-yellow-400/20 p-6">
              <h3 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Recent Deposits
              </h3>
              <div className="space-y-3">
                {recentTransactions.map((trans) => (
                  <div key={trans.id} className="group hover:bg-yellow-400/5 rounded-lg p-3 -mx-3 transition-all cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-400/10 rounded-lg">
                          <ArrowDownRight className="w-4 h-4 text-green-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-yellow-400">
                            +₵{trans.amount.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(trans.date, trans.time)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs px-2 py-1 bg-green-400/10 text-green-400 rounded-full">
                          {trans.status}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          Fee: ₵{trans.fee.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-center text-sm text-yellow-400/70 hover:text-yellow-400 transition-colors">
                View all transactions →
              </button>
            </div>

            {/* Information Card */}
            <div className="bg-gradient-to-br from-yellow-400/10 to-yellow-600/10 rounded-2xl p-6 border border-yellow-400/20">
              <h3 className="text-sm font-semibold text-yellow-400 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Quick Info
              </h3>
              <ul className="space-y-3 text-xs">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400">
                    2% fee added to payment amount
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400">
                    Instant credit to wallet
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400">
                    SMS confirmation sent
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-400">
                    Secured by Paystack
                  </span>
                </li>
              </ul>
            </div>

            {/* Support Card */}
            <div className="bg-black/50 backdrop-blur-xl rounded-2xl border border-yellow-400/20 p-6 text-center">
              <p className="text-sm text-gray-400 mb-3">Need assistance?</p>
              <button className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium">
                Contact Support →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDepositPage;