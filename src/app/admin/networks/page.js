// pages/admin/networks.js
'use client'
import { useState, useEffect } from 'react';
import axios from 'axios';

const NetworksManagement = () => {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [showProviderModal, setShowProviderModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [providerConfig, setProviderConfig] = useState({
    primary: '',
    fallback: '',
    availableProviders: []
  });
  const [bundlePrices, setBundlePrices] = useState([]);

  useEffect(() => {
    fetchNetworks();
  }, []);

  const fetchNetworks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/admin/networks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      setNetworks(response.data.data);
    } catch (error) {
      console.error('Failed to fetch networks:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleNetworkStatus = async (networkKey, currentStatus) => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/networks/${networkKey}/toggle`, {
        isActive: !currentStatus
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      fetchNetworks();
      alert(`Network ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      alert('Failed to update network status');
    }
  };

  const openProviderConfig = (network) => {
    setSelectedNetwork(network);
    setProviderConfig({
      primary: network.provider.primary || '',
      fallback: network.provider.fallback || '',
      availableProviders: network.provider.availableProviders || []
    });
    setShowProviderModal(true);
  };

  const updateProviderConfig = async () => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/networks/${selectedNetwork.networkKey}/provider`, providerConfig, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      setShowProviderModal(false);
      fetchNetworks();
      alert('Provider configuration updated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update provider configuration');
    }
  };

  const openPriceEditor = (network) => {
    setSelectedNetwork(network);
    setBundlePrices(network.bundles.map(b => ({
      capacity: b.capacity,
      price: b.price,
      resellerPrice: b.resellerPrice,
      isActive: b.isActive
    })));
    setShowPriceModal(true);
  };

  const updatePrices = async () => {
    try {
      await axios.patch(`http://localhost:5000/api/admin/networks/${selectedNetwork.networkKey}/prices`, {
        bundles: bundlePrices
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      setShowPriceModal(false);
      fetchNetworks();
      alert('Prices updated successfully');
    } catch (error) {
      alert('Failed to update prices');
    }
  };

  const handlePriceChange = (index, field, value) => {
    const updated = [...bundlePrices];
    if (field === 'isActive') {
      updated[index][field] = value;
    } else {
      updated[index][field] = parseFloat(value) || 0;
    }
    setBundlePrices(updated);
  };

  const addNewBundle = () => {
    setBundlePrices([...bundlePrices, {
      capacity: '',
      price: '',
      resellerPrice: '',
      isActive: true
    }]);
  };

  const removeBundle = (index) => {
    const updated = bundlePrices.filter((_, i) => i !== index);
    setBundlePrices(updated);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-GH', {
      style: 'currency',
      currency: 'GHS'
    }).format(amount || 0);
  };

  const getNetworkIcon = (networkKey) => {
    const icons = {
      'MTN': '📶',
      'TELECEL': '📡',
      'AIRTELTIGO': '📱'
    };
    return icons[networkKey] || '🌐';
  };

  const getProviderColor = (provider) => {
    const colors = {
      'GEONECTECH': 'text-blue-600 dark:text-blue-400',
      'TELECEL': 'text-green-600 dark:text-green-400',
      'FGAMAIL': 'text-purple-600 dark:text-purple-400',
      'MANUAL': 'text-orange-600 dark:text-orange-400'
    };
    return colors[provider] || 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Networks Configuration</h1>
        <button
          onClick={fetchNetworks}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Networks Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {networks.map((network) => (
            <div key={network._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              {/* Network Header */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-3xl mr-3">{getNetworkIcon(network.networkKey)}</span>
                    <div>
                      <h3 className="text-xl font-bold text-white">{network.networkKey}</h3>
                      <p className="text-blue-100">{network.name || network.networkKey}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={network.isActive}
                        onChange={() => toggleNetworkStatus(network.networkKey, network.isActive)}
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Network Details */}
              <div className="p-4 space-y-4">
                {/* Provider Configuration */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Provider Configuration</h4>
                    <button
                      onClick={() => openProviderConfig(network)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 text-sm"
                    >
                      Edit
                    </button>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Primary:</span>{' '}
                      <span className={`font-medium ${getProviderColor(network.provider.primary)}`}>
                        {network.provider.primary || 'Not Set'}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Fallback:</span>{' '}
                      <span className={`font-medium ${getProviderColor(network.provider.fallback)}`}>
                        {network.provider.fallback || 'None'}
                      </span>
                    </p>
                    <p className="text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Available:</span>{' '}
                      {network.provider.availableProviders?.length > 0 
                        ? network.provider.availableProviders.join(', ')
                        : 'All'}
                    </p>
                  </div>
                </div>

                {/* Bundle Statistics */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bundle Pricing</h4>
                    <button
                      onClick={() => openPriceEditor(network)}
                      className="text-green-600 hover:text-green-800 dark:text-green-400 text-sm"
                    >
                      Edit Prices
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Active Bundles:</span>
                      <span className="font-medium text-gray-900 dark:text-white ml-1">
                        {network.bundles.filter(b => b.isActive).length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Total Bundles:</span>
                      <span className="font-medium text-gray-900 dark:text-white ml-1">
                        {network.bundles.length}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Min Price:</span>
                      <span className="font-medium text-gray-900 dark:text-white ml-1">
                        {formatCurrency(Math.min(...network.bundles.map(b => b.price)))}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Max Price:</span>
                      <span className="font-medium text-gray-900 dark:text-white ml-1">
                        {formatCurrency(Math.max(...network.bundles.map(b => b.price)))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Bundle View */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Popular Bundles</h4>
                  <div className="space-y-1">
                    {network.bundles.slice(0, 3).map((bundle) => (
                      <div key={bundle._id || bundle.capacity} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{bundle.capacity}MB</span>
                        <span className={bundle.isActive ? "text-gray-900 dark:text-white" : "text-gray-400 line-through"}>
                          {formatCurrency(bundle.price)}
                        </span>
                      </div>
                    ))}
                    {network.bundles.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                        +{network.bundles.length - 3} more bundles
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provider Configuration Modal */}
      {showProviderModal && selectedNetwork && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Configure Provider - {selectedNetwork.networkKey}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Primary Provider
                </label>
                <select
                  value={providerConfig.primary}
                  onChange={(e) => setProviderConfig(prev => ({ ...prev, primary: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select Primary</option>
                  <option value="GEONECTECH">GeonecTech</option>
                  <option value="TELECEL">Telecel</option>
                  <option value="FGAMAIL">FGAMall</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fallback Provider
                </label>
                <select
                  value={providerConfig.fallback}
                  onChange={(e) => setProviderConfig(prev => ({ ...prev, fallback: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">No Fallback</option>
                  <option value="GEONECTECH">GeonecTech</option>
                  <option value="TELECEL">Telecel</option>
                  <option value="FGAMAIL">FGAMall</option>
                  <option value="MANUAL">Manual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Available Providers
                </label>
                <div className="space-y-2">
                  {['GEONECTECH', 'TELECEL', 'FGAMAIL', 'MANUAL'].map(provider => (
                    <label key={provider} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={providerConfig.availableProviders.includes(provider)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setProviderConfig(prev => ({
                              ...prev,
                              availableProviders: [...prev.availableProviders, provider]
                            }));
                          } else {
                            setProviderConfig(prev => ({
                              ...prev,
                              availableProviders: prev.availableProviders.filter(p => p !== provider)
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{provider}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowProviderModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={updateProviderConfig}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Price Editor Modal */}
      {showPriceModal && selectedNetwork && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Edit Prices - {selectedNetwork.networkKey}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Capacity (MB)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Price (GHS)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Reseller Price (GHS)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Profit
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Active
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {bundlePrices.map((bundle, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={bundle.capacity}
                          onChange={(e) => handlePriceChange(index, 'capacity', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={bundle.price}
                          onChange={(e) => handlePriceChange(index, 'price', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={bundle.resellerPrice}
                          onChange={(e) => handlePriceChange(index, 'resellerPrice', e.target.value)}
                          className="w-24 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {formatCurrency((bundle.price || 0) - (bundle.resellerPrice || 0))}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="checkbox"
                          checked={bundle.isActive}
                          onChange={(e) => handlePriceChange(index, 'isActive', e.target.checked)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <button
                          onClick={() => removeBundle(index)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={addNewBundle}
              className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              + Add New Bundle
            </button>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowPriceModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={updatePrices}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Prices
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworksManagement;