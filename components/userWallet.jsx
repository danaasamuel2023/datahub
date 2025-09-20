import React, { useState, useEffect } from 'react';
import { Wallet, RefreshCw, AlertCircle } from 'lucide-react';

const WalletBalance = () => {
  const [displayBalance, setDisplayBalance] = useState(0);
  const [actualBalance, setActualBalance] = useState(0);
  const [currency, setCurrency] = useState('GHS');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchBalance = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('Token');
      
      if (!token) {
        window.location.href = '/login';
        return;
      }

      // Use the dashboard endpoint to get user balance
      const response = await fetch('https://serverdatahub.onrender.com/api/orders/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('Token');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch balance');
      }

      const data = await response.json();
      
      if (data.success && data.data) {
        setActualBalance(data.data.user.currentBalance);
        setCurrency(data.data.user.currency || 'GHS');
        setError(''); // Clear any previous errors
      } else {
        throw new Error(data.message || 'Failed to load balance');
      }
    } catch (err) {
      console.error('Balance fetch error:', err);
      setError('Failed to load balance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // Auto-refresh balance every 30 seconds
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (actualBalance > displayBalance) {
      // Animate balance increase
      const difference = actualBalance - displayBalance;
      const steps = 50;
      const increment = difference / steps;
      const duration = 1000;
      const stepDuration = duration / steps;
      let current = 0;

      const timer = setInterval(() => {
        current += 1;
        setDisplayBalance(prev => {
          const next = prev + increment;
          if (current >= steps) {
            clearInterval(timer);
            return actualBalance;
          }
          return next;
        });
      }, stepDuration);

      return () => clearInterval(timer);
    } else {
      // If balance decreased, update immediately
      setDisplayBalance(actualBalance);
    }
  }, [actualBalance]);

  const handleTopUp = () => {
    window.location.href = '/deposit';
  };

  const handleRefresh = () => {
    fetchBalance();
  };

  if (loading) {
    return (
      <div className="bg-slate-800 p-6 rounded-xl animate-pulse mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-slate-700 w-10 h-10 rounded-lg"></div>
            <div>
              <div className="h-4 w-24 bg-slate-700 rounded mb-2"></div>
              <div className="h-7 w-32 bg-slate-700 rounded"></div>
            </div>
          </div>
          <div className="h-10 w-24 bg-slate-700 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (error && !refreshing) {
    return (
      <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-xl mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="text-red-400 hover:text-red-300 flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 p-6 rounded-xl mb-6 relative">
      {refreshing && (
        <div className="absolute top-2 right-2">
          <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
        </div>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-3 rounded-lg">
            <Wallet className="text-white w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Available Balance</p>
            <div className="flex items-baseline gap-2">
              <p className="text-white text-2xl font-bold">
                {currency} {displayBalance.toFixed(2)}
              </p>
              {displayBalance !== actualBalance && (
                <span className="text-xs text-amber-500 animate-pulse">
                  updating...
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-slate-700 transition-colors"
            title="Refresh balance"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleTopUp}
            className="bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors font-semibold"
          >
            Top Up
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletBalance;