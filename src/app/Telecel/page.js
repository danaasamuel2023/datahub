'use client'
import React, { useState, useEffect } from 'react';
import { 
  Phone as PhoneIcon, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  X,
  LogOut
} from 'lucide-react';
import WalletBalance from '../../../components/userWallet';

const DataBundle = ({ bundle, onSelect }) => {
  return (
    <div 
      onClick={() => bundle.isActive && onSelect(bundle)}
      className={`bg-red-600 rounded-lg overflow-hidden transition-shadow 
        ${bundle.isActive ? 'cursor-pointer hover:shadow-lg' : 'opacity-60 cursor-not-allowed'}`}
    >
      <div className="p-4 flex flex-col items-center">
        <div className="w-16 h-8 bg-black rounded-full flex items-center justify-center mb-4">
          <span className="text-red-600 font-bold">TELECEL</span>
        </div>
        <div className="text-3xl font-bold mb-4 text-white">{bundle.capacity}GB</div>
        <div className="w-full grid grid-cols-2 bg-gray-900 text-white">
          <div className="p-4 text-center border-r border-gray-800">
            <div className="text-xl font-bold">
              {bundle.isActive ? `GH¢ ${bundle.price}` : 'Out of Stock'}
            </div>
            <div className="text-sm">
              {bundle.isActive ? 'Price' : bundle.networkInactive ? 'Network Unavailable' : 'Unavailable'}
            </div>
          </div>
          <div className="p-4 text-center">
            <div className="text-xl font-bold">No-Expiry</div>
            <div className="text-sm">Duration</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const OrderModal = ({ bundle, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [recipient, setRecipient] = useState('');

  const validatePhoneNumber = (number) => {
    const phoneRegex = /^(?:\+233|0)[23459]\d{8}$/;
    return phoneRegex.test(number);
  };

  // Helper function to safely extract error message
  const getErrorMessage = (error) => {
    if (typeof error === 'string') {
      return error;
    }
    
    if (error && typeof error === 'object') {
      return error.message || error.error || JSON.stringify(error);
    }
    
    return 'An unknown error occurred';
  };

  // Helper function to safely check if error contains text
  const errorContains = (error, searchText) => {
    const errorStr = getErrorMessage(error);
    return String(errorStr).toLowerCase().includes(searchText.toLowerCase());
  };

  const handleTokenExpired = () => {
    // Clear auth data and redirect to login
    localStorage.removeItem('Token');
    localStorage.removeItem('userData');
    window.location.href = '/login';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setShowSuccessAnimation(false);

    const token = localStorage.getItem('Token');
    
    if (!token) {
      setError('Not authenticated. Please login again.');
      setLoading(false);
      handleTokenExpired();
      return;
    }
  
    if (!validatePhoneNumber(recipient)) {
      setError('Please enter a valid Ghanaian phone number');
      setLoading(false);
      return;
    }
  
    try {
      // Use the same endpoint structure as MTN
      const response = await fetch('http://localhost:5000/api/orders/place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token
        },
        body: JSON.stringify({
          networkKey: 'TELECEL',
          recipient: recipient,
          capacity: bundle.capacity,
        })
      });
  
      const data = await response.json();
      
      // Handle authentication errors
      if (response.status === 401) {
        setError('Session expired. Please login again.');
        handleTokenExpired();
        return;
      }

      if (response.status === 403) {
        setError(data.message || 'Account access restricted');
        return;
      }
      
      if (!response.ok || !data.success) {
        console.log('API Error Response:', data);
        
        // Safe error checking using helper function
        if (errorContains(data.error, 'Insufficient balance') || 
            errorContains(data.message, 'Insufficient balance')) {
          throw new Error('Insufficient wallet balance. Please top up your wallet.');
        }
        
        if (errorContains(data.error, 'Account is disabled') || 
            errorContains(data.message, 'Account is disabled')) {
          throw new Error('Your account has been disabled. Please contact support.');
        }
        
        if (errorContains(data.error, 'Invalid phone number') || 
            errorContains(data.message, 'Invalid phone number')) {
          throw new Error('Please enter a valid phone number format.');
        }
        
        // Generic error handling
        const errorMessage = data.message || getErrorMessage(data.error) || 'Failed to place order';
        throw new Error(errorMessage);
      }
  
      // Success handling - matching backend response structure
      const newBalance = data.data?.newBalance || data.data?.userWalletBalance || 'N/A';
      setSuccess(`Successfully purchased ${bundle.capacity}GB bundle for ${recipient}. New wallet balance: GHC ${typeof newBalance === 'number' ? newBalance.toFixed(2) : newBalance}`);
      setShowSuccessAnimation(true);
      
    } catch (error) {
      console.error('Order placement error:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        {showSuccessAnimation ? (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center animate-pulse">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Order Successful!</h2>
            <p className="text-gray-600 dark:text-gray-300 text-center">{success}</p>
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Continue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Purchase {bundle.capacity}GB Bundle</h3>
              <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100">
                <X className="w-6 h-6" />
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1 group-hover:text-red-600 transition-colors">
                Recipient Number
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">(e.g., 0241234567)</span>
              </label>
              <div className="relative">
                <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-red-500 transition-colors" />
                <input
                  type="tel"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value.replace(/\s/g, ''))}
                  className="w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-all dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
                <span>Selected Bundle:</span>
                <span className="font-bold">{bundle.capacity}GB - GH¢ {bundle.price}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white p-4 rounded-lg hover:bg-red-700 
                       focus:ring-2 focus:ring-red-500 disabled:opacity-50 
                       transition-all transform active:scale-95 
                       flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Purchase Bundle'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const TelecelBundleDisplay = () => {
  const [selectedBundle, setSelectedBundle] = useState(null);
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  useEffect(() => {
    checkUserAuth();
    fetchBundles();
  }, []);

  const checkUserAuth = () => {
    const token = localStorage.getItem('Token');
    
    if (token) {
      setUserAuthenticated(true);
      console.log('User authenticated');
    } else {
      console.log('No authentication token found');
      setUserAuthenticated(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('Token');
    localStorage.removeItem('userData');
    setUserAuthenticated(false);
    window.location.href = '/login';
  };

  const handleTokenExpired = () => {
    // Clear auth data and redirect to login
    localStorage.removeItem('Token');
    localStorage.removeItem('userData');
    setUserAuthenticated(false);
    window.location.href = '/login';
  };

  const fetchBundles = async () => {
    try {
      // Get token for authentication
      const token = localStorage.getItem('Token');
      
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add authorization headers if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        headers['x-auth-token'] = token;
      }

      // Use your local backend endpoint
      const response = await fetch('http://localhost:5000/api/orders/networks', {
        method: 'GET',
        headers: headers
      });
      
      console.log('Bundle fetch response status:', response.status);
      
      if (response.status === 401) {
        console.log('Authentication required - redirecting to login');
        handleTokenExpired();
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch bundle prices');
      }
      
      const responseData = await response.json();
      console.log('API Response:', responseData);
      
      // The backend returns { success: true, data: [...] } structure
      if (!responseData.success || !responseData.data) {
        console.error('Invalid response structure:', responseData);
        setError('Invalid response from server');
        return;
      }
      
      const networks = responseData.data;
      console.log(`Found ${networks.length} networks:`, networks.map(n => `${n.networkKey} (active: ${n.isActive})`));
      
      // Find TELECEL network configuration
      const telecelNetwork = networks.find(n => n.networkKey === 'TELECEL');
      
      if (!telecelNetwork) {
        console.error('TELECEL network not found. Available networks:', networks.map(n => n.networkKey));
        setError('Telecel network not available. Please contact support.');
        return;
      }
      
      console.log(`Found Telecel network (active: ${telecelNetwork.isActive}) with ${telecelNetwork.bundles.length} bundles`);
      
      if (!telecelNetwork.bundles || telecelNetwork.bundles.length === 0) {
        setError('No bundles configured for Telecel network');
        return;
      }
      
      // Sort bundles by capacity
      const sortedBundles = telecelNetwork.bundles.sort((a, b) => parseFloat(a.capacity) - parseFloat(b.capacity));
      setBundles(sortedBundles);
      
      // Check if network is inactive
      if (!telecelNetwork.isActive) {
        console.log('Warning: Telecel network is currently inactive. All bundles will show as out of stock.');
      }
      
      const activeBundles = sortedBundles.filter(b => b.isActive);
      console.log(`Telecel bundles loaded: ${sortedBundles.length} total, ${activeBundles.length} available`);
      
    } catch (err) {
      console.error('Error fetching bundles:', err);
      setError('Failed to load bundle prices. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (!userAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Please login to purchase data bundles</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (error && !bundles.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 flex items-center justify-center">
        <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
      {/* Header with logout button */}
      <div className="max-w-6xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Telecel Data Bundles</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <WalletBalance />

      {/* Show warning if all bundles are out of stock */}
      {bundles.length > 0 && bundles.every(b => !b.isActive) && (
        <div className="max-w-6xl mx-auto mb-4">
          <div className="bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <p className="text-orange-800 dark:text-orange-300">
                {bundles[0]?.networkInactive 
                  ? 'Telecel network is currently unavailable. All bundles are temporarily out of stock.'
                  : 'All bundles are currently out of stock. Please check back later.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {bundles.map((bundle) => (
            <DataBundle
              key={bundle.capacity}
              bundle={bundle}
              onSelect={setSelectedBundle}
            />
          ))}
        </div>
        
        {selectedBundle && (
          <OrderModal
            bundle={selectedBundle}
            onClose={() => setSelectedBundle(null)}
          />
        )}
      </div>
    </div>
  );
};

export default TelecelBundleDisplay;