// pages/admin/settings.js
'use client';
import { useState, useEffect } from 'react';
import axios from 'axios';

const SystemSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('payment');
  const [showApiKeys, setShowApiKeys] = useState({
    paystack: false,
    geonectech: false,
    telecel: false,
    fgamail: false
  });
  const [testingProvider, setTestingProvider] = useState(null);
  const [testResult, setTestResult] = useState(null);
  
  // Form states
  const [paymentSettings, setPaymentSettings] = useState({
    paystack: {
      publicKey: '',
      secretKey: '',
      webhookSecret: '',
      testMode: true
    },
    processingFees: {
      enabled: true,
      percentage: 1.5,
      fixed: 0,
      whoPays: 'customer',
      minimumDeposit: 5,
      maximumDeposit: 5000
    }
  });
  
  const [providerSettings, setProviderSettings] = useState({
    geonectech: {
      enabled: true,
      apiKey: '',
      baseUrl: 'https://testhub.geonettech.site/api/v1'
    },
    telecel: {
      enabled: true,
      apiKey: '',
      baseUrl: 'https://iget.onrender.com/api/developer'
    },
    fgamail: {
      enabled: true,
      apiKey: '',
      baseUrl: 'https://fgamall.com/api/v1'
    },
    manual: {
      enabled: true
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      const data = response.data.data;
      setSettings(data);
      
      // Update form states with fetched data
      setPaymentSettings({
        paystack: data.payment?.paystack || paymentSettings.paystack,
        processingFees: data.payment?.processingFees || paymentSettings.processingFees
      });
      
      setProviderSettings({
        geonectech: data.providers?.geonectech || providerSettings.geonectech,
        telecel: data.providers?.telecel || providerSettings.telecel,
        fgamail: data.providers?.fgamail || providerSettings.fgamail,
        manual: data.providers?.manual || providerSettings.manual
      });
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      alert('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!confirm('Are you sure you want to update system settings?')) return;
    
    try {
      setSaving(true);
      
      const updatedSettings = {
        payment: paymentSettings,
        providers: providerSettings
      };
      
      const response = await axios.put('http://localhost:5000/api/admin/settings', updatedSettings, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      setSettings(response.data.data);
      alert('Settings updated successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleProviderToggle = async (provider, enabled) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/admin/settings/provider/${provider}`,
        { enabled },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('Token')}`
          }
        }
      );
      
      setProviderSettings(prev => ({
        ...prev,
        [provider]: {
          ...prev[provider],
          enabled
        }
      }));
      
      alert(`${provider} ${enabled ? 'enabled' : 'disabled'} successfully`);
    } catch (error) {
      console.error(`Failed to toggle ${provider}:`, error);
      alert(`Failed to toggle ${provider}`);
    }
  };

  const testProviderConnection = async (provider) => {
    setTestingProvider(provider);
    setTestResult(null);
    
    try {
      // Simulate API test - replace with actual endpoint when available
      const response = await axios.post(
        `http://localhost:5000/api/admin/test-provider/${provider}`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('Token')}`
          }
        }
      );
      
      setTestResult({
        provider,
        success: true,
        message: 'Connection successful',
        details: response.data
      });
    } catch (error) {
      setTestResult({
        provider,
        success: false,
        message: 'Connection failed',
        error: error.response?.data?.message || error.message
      });
    } finally {
      setTestingProvider(null);
    }
  };

  const toggleApiKeyVisibility = (key) => {
    setShowApiKeys(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Settings</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure payment gateways, API providers, and system preferences
          </p>
        </div>
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('payment')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'payment'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Payment Settings
          </button>
          <button
            onClick={() => setActiveTab('providers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'providers'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            API Providers
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'fees'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Processing Fees
          </button>
        </nav>
      </div>

      {/* Payment Settings Tab */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          {/* Paystack Configuration */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Paystack Configuration
              </h2>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={paymentSettings.paystack.testMode}
                  onChange={(e) => setPaymentSettings(prev => ({
                    ...prev,
                    paystack: { ...prev.paystack, testMode: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Test Mode</span>
              </label>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Public Key
                </label>
                <input
                  type="text"
                  value={paymentSettings.paystack.publicKey}
                  onChange={(e) => setPaymentSettings(prev => ({
                    ...prev,
                    paystack: { ...prev.paystack, publicKey: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="pk_test_..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secret Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.paystack ? 'text' : 'password'}
                    value={paymentSettings.paystack.secretKey}
                    onChange={(e) => setPaymentSettings(prev => ({
                      ...prev,
                      paystack: { ...prev.paystack, secretKey: e.target.value }
                    }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="sk_test_..."
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('paystack')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showApiKeys.paystack ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Webhook Secret
                </label>
                <input
                  type="password"
                  value={paymentSettings.paystack.webhookSecret}
                  onChange={(e) => setPaymentSettings(prev => ({
                    ...prev,
                    paystack: { ...prev.paystack, webhookSecret: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Optional webhook secret"
                />
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ <strong>Important:</strong> Keep your secret keys secure. Never share them or commit them to version control.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* API Providers Tab */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          {/* GeonecTech Provider */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">GeonecTech</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  providerSettings.geonectech.enabled
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {providerSettings.geonectech.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => testProviderConnection('geonectech')}
                  disabled={testingProvider === 'geonectech'}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  {testingProvider === 'geonectech' ? 'Testing...' : 'Test Connection'}
                </button>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={providerSettings.geonectech.enabled}
                    onChange={(e) => handleProviderToggle('geonectech', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Enable</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.geonectech ? 'text' : 'password'}
                    value={providerSettings.geonectech.apiKey}
                    onChange={(e) => setProviderSettings(prev => ({
                      ...prev,
                      geonectech: { ...prev.geonectech, apiKey: e.target.value }
                    }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter GeonecTech API key"
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('geonectech')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showApiKeys.geonectech ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={providerSettings.geonectech.baseUrl}
                  onChange={(e) => setProviderSettings(prev => ({
                    ...prev,
                    geonectech: { ...prev.geonectech, baseUrl: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://api.geonectech.com/v1"
                />
              </div>
            </div>
          </div>

          {/* Telecel Provider */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Telecel</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  providerSettings.telecel.enabled
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {providerSettings.telecel.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => testProviderConnection('telecel')}
                  disabled={testingProvider === 'telecel'}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  {testingProvider === 'telecel' ? 'Testing...' : 'Test Connection'}
                </button>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={providerSettings.telecel.enabled}
                    onChange={(e) => handleProviderToggle('telecel', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Enable</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.telecel ? 'text' : 'password'}
                    value={providerSettings.telecel.apiKey}
                    onChange={(e) => setProviderSettings(prev => ({
                      ...prev,
                      telecel: { ...prev.telecel, apiKey: e.target.value }
                    }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter Telecel API key"
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('telecel')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showApiKeys.telecel ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={providerSettings.telecel.baseUrl}
                  onChange={(e) => setProviderSettings(prev => ({
                    ...prev,
                    telecel: { ...prev.telecel, baseUrl: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://api.telecel.com"
                />
              </div>
            </div>
          </div>

          {/* FGAMall Provider */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">FGAMall</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  providerSettings.fgamail.enabled
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {providerSettings.fgamail.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => testProviderConnection('fgamail')}
                  disabled={testingProvider === 'fgamail'}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                >
                  {testingProvider === 'fgamail' ? 'Testing...' : 'Test Connection'}
                </button>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={providerSettings.fgamail.enabled}
                    onChange={(e) => handleProviderToggle('fgamail', e.target.checked)}
                    className="rounded border-gray-300 text-blue-600"
                  />
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Enable</span>
                </label>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKeys.fgamail ? 'text' : 'password'}
                    value={providerSettings.fgamail.apiKey}
                    onChange={(e) => setProviderSettings(prev => ({
                      ...prev,
                      fgamail: { ...prev.fgamail, apiKey: e.target.value }
                    }))}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Enter FGAMall API key"
                  />
                  <button
                    type="button"
                    onClick={() => toggleApiKeyVisibility('fgamail')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showApiKeys.fgamail ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={providerSettings.fgamail.baseUrl}
                  onChange={(e) => setProviderSettings(prev => ({
                    ...prev,
                    fgamail: { ...prev.fgamail, baseUrl: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://fgamall.com/api/v1"
                />
              </div>
            </div>
          </div>

          {/* Manual Provider */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manual Processing</h3>
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  providerSettings.manual.enabled
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                }`}>
                  {providerSettings.manual.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={providerSettings.manual.enabled}
                  onChange={(e) => handleProviderToggle('manual', e.target.checked)}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Enable</span>
              </label>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Manual processing allows administrators to manually fulfill orders when automated providers fail or are unavailable.
              Orders will be marked as "Manual Pending" for admin review.
            </p>
          </div>

          {/* Test Results */}
          {testResult && (
            <div className={`p-4 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
            }`}>
              <div className="flex items-start">
                <span className="text-2xl mr-3">{testResult.success ? '✅' : '❌'}</span>
                <div>
                  <p className="font-semibold">{testResult.provider} - {testResult.message}</p>
                  {testResult.error && (
                    <p className="text-sm mt-1">Error: {testResult.error}</p>
                  )}
                  {testResult.details && (
                    <pre className="text-xs mt-2 overflow-x-auto">
                      {JSON.stringify(testResult.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Processing Fees Tab */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Transaction Processing Fees
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={paymentSettings.processingFees.enabled}
                  onChange={(e) => setPaymentSettings(prev => ({
                    ...prev,
                    processingFees: { ...prev.processingFees, enabled: e.target.checked }
                  }))}
                  className="rounded border-gray-300 text-blue-600"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Enable processing fees on deposits
                </span>
              </label>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Percentage Fee (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={paymentSettings.processingFees.percentage}
                    onChange={(e) => setPaymentSettings(prev => ({
                      ...prev,
                      processingFees: { ...prev.processingFees, percentage: parseFloat(e.target.value) }
                    }))}
                    disabled={!paymentSettings.processingFees.enabled}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fixed Fee (GHS)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={paymentSettings.processingFees.fixed}
                    onChange={(e) => setPaymentSettings(prev => ({
                      ...prev,
                      processingFees: { ...prev.processingFees, fixed: parseFloat(e.target.value) }
                    }))}
                    disabled={!paymentSettings.processingFees.enabled}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Who Pays Fees
                  </label>
                  <select
                    value={paymentSettings.processingFees.whoPays}
                    onChange={(e) => setPaymentSettings(prev => ({
                      ...prev,
                      processingFees: { ...prev.processingFees, whoPays: e.target.value }
                    }))}
                    disabled={!paymentSettings.processingFees.enabled}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="customer">Customer</option>
                    <option value="merchant">Merchant</option>
                    <option value="split">Split 50/50</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Minimum Deposit (GHS)
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={paymentSettings.processingFees.minimumDeposit}
                    onChange={(e) => setPaymentSettings(prev => ({
                      ...prev,
                      processingFees: { ...prev.processingFees, minimumDeposit: parseFloat(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Maximum Deposit (GHS)
                  </label>
                  <input
                    type="number"
                    step="100"
                    min="100"
                    value={paymentSettings.processingFees.maximumDeposit}
                    onChange={(e) => setPaymentSettings(prev => ({
                      ...prev,
                      processingFees: { ...prev.processingFees, maximumDeposit: parseFloat(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              {/* Fee Calculator Preview */}
              {paymentSettings.processingFees.enabled && (
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Fee Calculator Preview
                  </h3>
                  <div className="space-y-2">
                    {[10, 50, 100, 500, 1000].map(amount => {
                      const percentageFee = amount * (paymentSettings.processingFees.percentage / 100);
                      const totalFee = percentageFee + paymentSettings.processingFees.fixed;
                      const customerPays = paymentSettings.processingFees.whoPays === 'customer' 
                        ? totalFee 
                        : paymentSettings.processingFees.whoPays === 'split' 
                          ? totalFee / 2 
                          : 0;
                      const finalAmount = paymentSettings.processingFees.whoPays === 'customer'
                        ? amount + totalFee
                        : amount;
                      
                      return (
                        <div key={amount} className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            Deposit: {formatCurrency(amount)}
                          </span>
                          <span className="text-gray-900 dark:text-white">
                            Fee: {formatCurrency(customerPays)} • Total: {formatCurrency(finalAmount)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Additional Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Additional Settings
            </h2>
            
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  System Information
                </h3>
                <div className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                  <p>• Last settings update: {settings?.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Never'}</p>
                  <p>• Settings version: {settings?.__v || 0}</p>
                  <p>• Database ID: {settings?._id || 'N/A'}</p>
                </div>
              </div>
              
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                  Security Reminders
                </h3>
                <ul className="space-y-1 text-sm text-yellow-700 dark:text-yellow-300">
                  <li>• Regularly rotate API keys for enhanced security</li>
                  <li>• Use test mode for development and staging environments</li>
                  <li>• Monitor provider API usage and rate limits</li>
                  <li>• Keep webhook secrets updated and secure</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;