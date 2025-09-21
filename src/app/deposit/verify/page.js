'use client';
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2,
  Home,
  RefreshCw
} from 'lucide-react';

const PaymentCallbackPage = () => {
  const [verificationStatus, setVerificationStatus] = useState('processing'); // 'processing', 'success', 'failed', 'error'
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  // Verify payment with backend
  const verifyPayment = async (paymentReference) => {
    if (!paymentReference) {
      setVerificationStatus('error');
      setError('No payment reference found');
      return;
    }

    try {
      const token = localStorage.getItem('Token');
      
      if (!token) {
        window.location.href = '/Signin';
        return;
      }

      const response = await fetch('https://serverdatahub.onrender.com/api/v1/verify-payment', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reference: paymentReference })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setPaymentDetails(data.data);
        setVerificationStatus('success');
        
        // Clear stored payment reference
        sessionStorage.removeItem('payment_reference');
        sessionStorage.removeItem('payment_amount');
      } else {
        // Retry on failure
        if (retryCount < maxRetries && !data.data?.alreadyProcessed) {
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            verifyPayment(paymentReference);
          }, 2000);
        } else {
          setVerificationStatus('failed');
          setError(data.message || 'Payment verification failed');
        }
      }
    } catch (err) {
      console.error('Verification error:', err);
      
      // Retry on network errors
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          verifyPayment(paymentReference);
        }, 2000);
      } else {
        setVerificationStatus('error');
        setError('Unable to verify payment');
      }
    }
  };

  // Initialize verification on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlReference = urlParams.get('reference');
    const urlStatus = urlParams.get('status');
    
    const sessionReference = sessionStorage.getItem('payment_reference');
    const paymentRef = urlReference || sessionReference;
    
    setReference(paymentRef);

    if (urlStatus === 'cancelled') {
      setVerificationStatus('failed');
      setError('Payment was cancelled');
      return;
    }

    if (paymentRef) {
      verifyPayment(paymentRef);
    } else {
      setVerificationStatus('error');
      setError('No payment reference found');
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          
          {/* Processing State */}
          {verificationStatus === 'processing' && (
            <div className="text-center">
              <Loader2 className="w-16 h-16 mx-auto text-blue-600 animate-spin mb-6" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Verifying Payment
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Please wait...
              </p>
            </div>
          )}

          {/* Success State */}
          {verificationStatus === 'success' && (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-6" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Payment Successful
              </h2>
              
              {paymentDetails && (
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-6">
                  <div className="text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Amount:</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        GHS {paymentDetails.amount?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">New Balance:</span>
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        GHS {paymentDetails.currentBalance?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => window.location.href = '/dashboard'}
                className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Go to Dashboard
              </button>
            </div>
          )}

          {/* Failed State */}
          {verificationStatus === 'failed' && (
            <div className="text-center">
              <XCircle className="w-16 h-16 mx-auto text-red-600 mb-6" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Payment Failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setRetryCount(0);
                    setVerificationStatus('processing');
                    verifyPayment(reference);
                  }}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Try Again
                </button>
                
                <button
                  onClick={() => window.location.href = '/deposit'}
                  className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
                >
                  Back to Deposit
                </button>
              </div>
            </div>
          )}

          {/* Error State */}
          {verificationStatus === 'error' && (
            <div className="text-center">
              <AlertCircle className="w-16 h-16 mx-auto text-yellow-600 mb-6" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Verification Issue
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {error}
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/transactions'}
                  className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Check Transaction History
                </button>
                
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentCallbackPage;