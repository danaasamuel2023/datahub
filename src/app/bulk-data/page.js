'use client';
import React, { useState, useEffect } from 'react';
import { Upload, Plus, Trash2, Send, Download, AlertCircle, Check, X, Users, FileText, Loader2, Copy, ClipboardPaste } from 'lucide-react';

const BulkPurchase = () => {
  const [orders, setOrders] = useState([{ recipient: '', capacity: 5 }]);
  const [networks, setNetworks] = useState([]);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [bulkMethod, setBulkMethod] = useState('paste'); // 'manual', 'csv', or 'paste'
  const [csvContent, setCsvContent] = useState('');
  const [bulkTextInput, setBulkTextInput] = useState('');
  const [parseError, setParseError] = useState('');

  useEffect(() => {
    fetchNetworks();
  }, []);

  const fetchNetworks = async () => {
    try {
      const response = await fetch('https://serverdatahub.onrender.com/api/orders/networks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`
        }
      });
      
      const data = await response.json();
      if (data.success) {
        setNetworks(data.data);
        if (data.data.length > 0) {
          setSelectedNetwork(data.data[0].networkKey);
        }
      }
    } catch (error) {
      console.error('Failed to fetch networks:', error);
    }
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^(?:\+233|233|0)?(20|23|24|25|26|27|28|29|30|31|32|50|53|54|55|56|57|58|59)\d{7}$/;
    return phoneRegex.test(phone);
  };

  const formatPhoneNumber = (phone) => {
    // Remove any spaces or special characters
    phone = phone.replace(/[\s-]/g, '');
    
    // If starts with +233 or 233, convert to 0
    if (phone.startsWith('+233')) {
      phone = '0' + phone.slice(4);
    } else if (phone.startsWith('233')) {
      phone = '0' + phone.slice(3);
    } else if (!phone.startsWith('0')) {
      phone = '0' + phone;
    }
    
    return phone;
  };

  const handleAddOrder = () => {
    setOrders([...orders, { recipient: '', capacity: 5 }]);
  };

  const handleRemoveOrder = (index) => {
    const newOrders = orders.filter((_, i) => i !== index);
    setOrders(newOrders.length > 0 ? newOrders : [{ recipient: '', capacity: 5 }]);
  };

  const handleOrderChange = (index, field, value) => {
    const newOrders = [...orders];
    
    if (field === 'recipient') {
      // Format phone number
      value = formatPhoneNumber(value);
      
      // Validate phone number
      if (!validatePhoneNumber(value) && value.length > 0) {
        setValidationErrors({
          ...validationErrors,
          [`order-${index}`]: 'Invalid phone number format'
        });
      } else {
        const newErrors = { ...validationErrors };
        delete newErrors[`order-${index}`];
        setValidationErrors(newErrors);
      }
    }
    
    if (field === 'capacity') {
      value = parseFloat(value) || 5;
    }
    
    newOrders[index][field] = value;
    setOrders(newOrders);
  };

  const parseBulkText = (text) => {
    setParseError('');
    const lines = text.split('\n').filter(line => line.trim());
    const parsedOrders = [];
    const errors = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Parse format: "phone number, capacity" or "phone number capacity"
      let recipient = '';
      let capacity = null;
      
      // Check if line contains comma or space separator
      if (line.includes(',')) {
        const parts = line.split(',').map(p => p.trim());
        recipient = parts[0];
        if (parts[1] && !isNaN(parseFloat(parts[1]))) {
          capacity = parseFloat(parts[1]);
        }
      } else {
        // Try to extract number and capacity from space-separated values
        const parts = line.split(/\s+/);
        recipient = parts[0];
        
        // Check if second part is a number (capacity)
        if (parts[1] && !isNaN(parseFloat(parts[1]))) {
          capacity = parseFloat(parts[1]);
        }
      }
      
      // Format and validate the phone number
      recipient = formatPhoneNumber(recipient);
      
      if (!capacity) {
        errors.push(`Line ${i + 1}: Missing capacity for ${recipient}`);
      } else if (validatePhoneNumber(recipient)) {
        parsedOrders.push({ recipient, capacity });
      } else {
        errors.push(`Line ${i + 1}: Invalid phone number "${line}"`);
      }
    }
    
    if (parsedOrders.length > 0) {
      setOrders(parsedOrders);
      if (errors.length > 0) {
        setParseError(`Parsed ${parsedOrders.length} valid entries. ${errors.length} errors: ${errors[0]}`);
      } else {
        setParseError('');
      }
    } else {
      if (errors.length > 0) {
        setParseError(errors[0]);
      } else {
        setParseError('No valid entries found. Please include capacity for each number.');
      }
      setOrders([{ recipient: '', capacity: 5 }]);
    }
  };

  const handleBulkTextChange = (text) => {
    setBulkTextInput(text);
    if (text.trim()) {
      parseBulkText(text);
    } else {
      setOrders([{ recipient: '', capacity: 5 }]);
      setParseError('');
    }
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        setCsvContent(text);
        parseCSV(text);
      };
      reader.readAsText(file);
    }
  };

  const parseCSV = (text) => {
    const lines = text.split('\n').filter(line => line.trim());
    const parsedOrders = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Skip header if present
      if (i === 0 && line.toLowerCase().includes('recipient')) continue;
      
      const parts = line.split(',').map(p => p.trim());
      const recipient = formatPhoneNumber(parts[0]);
      const capacity = parts[1] ? parseFloat(parts[1]) : 5;
      
      if (validatePhoneNumber(recipient)) {
        parsedOrders.push({ recipient, capacity });
      }
    }
    
    if (parsedOrders.length > 0) {
      setOrders(parsedOrders);
      setBulkMethod('csv');
    } else {
      alert('No valid phone numbers found in CSV');
    }
  };

  const calculateTotalCost = () => {
    const network = networks.find(n => n.networkKey === selectedNetwork);
    if (!network) return 0;
    
    return orders.reduce((total, order) => {
      const bundle = network.bundles.find(b => b.capacity === order.capacity);
      return total + (bundle ? bundle.price : 0);
    }, 0);
  };

  const handleBulkPurchase = async () => {
    // Validate all orders
    const invalidOrders = orders.filter(o => !validatePhoneNumber(o.recipient));
    if (invalidOrders.length > 0) {
      alert(`Please fix ${invalidOrders.length} invalid phone numbers`);
      return;
    }

    if (!selectedNetwork) {
      alert('Please select a network');
      return;
    }

    setProcessing(true);
    setShowResults(false);

    try {
      const response = await fetch('https://serverdatahub.onrender.com/api/orders/place-bulk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('Token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orders: orders.map(o => ({
            recipient: formatPhoneNumber(o.recipient),
            capacity: o.capacity
          })),
          networkKey: selectedNetwork
        })
      });

      const data = await response.json();
      setResults(data);
      setShowResults(true);

      // Clear orders if all successful
      if (data.success && data.data && data.data.summary && data.data.summary.failed === 0) {
        setOrders([{ recipient: '', capacity: 5 }]);
        setBulkTextInput('');
      }
    } catch (error) {
      console.error('Bulk purchase error:', error);
      alert('Failed to process bulk orders');
    } finally {
      setProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'recipient,capacity\n0241234567,5\n0551234567,10\n0201234567,3';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_order_template.csv';
    a.click();
  };

  const downloadResults = () => {
    if (!results || !results.data || !results.data.summary) return;
    
    const csvContent = [
      'Recipient,Status,Reference,Price',
      ...(results.data.successfulOrders || []).map(o => 
        `${o.recipient},Success,${o.reference},${o.price}`
      ),
      ...(results.data.failedOrders || []).map(o => 
        `${o.recipient},Failed,"${o.error}",0`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_order_results_${Date.now()}.csv`;
    a.click();
  };

  const getNetworkBundles = () => {
    const network = networks.find(n => n.networkKey === selectedNetwork);
    return network ? network.bundles.filter(b => b.isActive) : [];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-6 h-6" />
                Bulk Purchase
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Process multiple orders at once - up to 50 recipients
              </p>
            </div>
            <button
              onClick={downloadTemplate}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>

          {/* Method Selection */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => setBulkMethod('paste')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                bulkMethod === 'paste'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ClipboardPaste className="w-4 h-4" />
                Paste List
              </div>
            </button>
            <button
              onClick={() => setBulkMethod('manual')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                bulkMethod === 'manual'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setBulkMethod('csv')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                bulkMethod === 'csv'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              CSV Upload
            </button>
          </div>

          {/* Network Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Network
              </label>
              <select
                value={selectedNetwork}
                onChange={(e) => setSelectedNetwork(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select Network</option>
                {networks.map(network => (
                  <option key={network.networkKey} value={network.networkKey}>
                    {network.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Total Recipients
              </label>
              <div className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {orders.filter(o => validatePhoneNumber(o.recipient)).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Entry */}
        {bulkMethod === 'paste' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Paste Recipients List
            </h2>
            
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                <strong>Format:</strong> One number per line
              </p>
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1 font-mono">
                <div>0241234567, 5  <span className="text-blue-600 dark:text-blue-400">← phone number with 5GB</span></div>
                <div>0551234567, 10 <span className="text-blue-600 dark:text-blue-400">← phone number with 10GB</span></div>
                <div>0201234567, 3  <span className="text-blue-600 dark:text-blue-400">← phone number with 3GB</span></div>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                Note: Always include the capacity (GB) after each number
              </p>
            </div>

            <textarea
              value={bulkTextInput}
              onChange={(e) => handleBulkTextChange(e.target.value)}
              placeholder="Paste your phone numbers here with capacity...&#10;One per line&#10;&#10;Format: phone, capacity&#10;0241234567, 5&#10;0551234567, 10&#10;0201234567, 3"
              className="w-full h-64 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-y"
            />

            {parseError && (
              <div className={`mt-2 text-sm ${parseError.includes('valid') ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                <AlertCircle className="inline w-4 h-4 mr-1" />
                {parseError}
              </div>
            )}

            {orders.length > 1 && bulkTextInput && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Parsed {orders.filter(o => validatePhoneNumber(o.recipient)).length} valid recipients:
                </p>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {orders.slice(0, 10).map((order, index) => (
                    <div key={index} className="text-xs text-gray-600 dark:text-gray-400 flex justify-between">
                      <span>{order.recipient}</span>
                      <span>{order.capacity}GB</span>
                    </div>
                  ))}
                  {orders.length > 10 && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      ... and {orders.length - 10} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : bulkMethod === 'manual' ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Recipients
            </h2>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {orders.map((order, index) => (
                <div key={index} className="flex gap-3 items-start">
                  <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {index + 1}.
                  </span>
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Phone number (e.g., 0241234567)"
                      value={order.recipient}
                      onChange={(e) => handleOrderChange(index, 'recipient', e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                        validationErrors[`order-${index}`]
                          ? 'border-red-500'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                    {validationErrors[`order-${index}`] && (
                      <p className="text-xs text-red-500 mt-1">
                        {validationErrors[`order-${index}`]}
                      </p>
                    )}
                  </div>
                  <select
                    value={order.capacity}
                    onChange={(e) => handleOrderChange(index, 'capacity', e.target.value)}
                    className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    {getNetworkBundles().map(bundle => (
                      <option key={bundle.capacity} value={bundle.capacity}>
                        {bundle.capacity}GB
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => handleRemoveOrder(index)}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddOrder}
              className="mt-4 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Another Recipient
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Upload CSV File
            </h2>

            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload a CSV file with recipient numbers and optional capacity
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleCSVUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block"
              >
                Choose File
              </label>
            </div>

            {orders.length > 1 && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Loaded {orders.length} recipients from CSV
                </p>
                <div className="mt-2 max-h-40 overflow-y-auto">
                  {orders.slice(0, 5).map((order, index) => (
                    <div key={index} className="text-xs text-gray-500 dark:text-gray-400">
                      {order.recipient} - {order.capacity}GB
                    </div>
                  ))}
                  {orders.length > 5 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      ... and {orders.length - 5} more
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cost Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Cost Summary
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Valid Recipients:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {orders.filter(o => validatePhoneNumber(o.recipient)).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Total Cost:</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                GHS {calculateTotalCost().toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={handleBulkPurchase}
            disabled={processing || orders.filter(o => validatePhoneNumber(o.recipient)).length === 0}
            className="w-full mt-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing {orders.length} orders...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Process Bulk Order
              </>
            )}
          </button>
        </div>

        {/* Results Modal */}
        {showResults && results && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  Bulk Order Results
                </h3>
                <button
                  onClick={() => setShowResults(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Check if we have proper data structure */}
              {results.data && results.data.summary ? (
                <>
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <p className="text-green-600 dark:text-green-400 text-sm">Successful</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {results.data.summary.successful || 0}
                      </p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                      <p className="text-red-600 dark:text-red-400 text-sm">Failed</p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                        {results.data.summary.failed || 0}
                      </p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <p className="text-blue-600 dark:text-blue-400 text-sm">Total Cost</p>
                      <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                        GHS {results.data.summary.totalCost?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  </div>

                  {/* Successful Orders */}
                  {results.data.successfulOrders && results.data.successfulOrders.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Successful Orders
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {results.data.successfulOrders.map((order, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-gray-900 dark:text-white">{order.recipient}</span>
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                            <span className="text-gray-600 dark:text-gray-400">{order.reference}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Failed Orders */}
                  {results.data.failedOrders && results.data.failedOrders.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Failed Orders
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {results.data.failedOrders.map((order, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <X className="w-4 h-4 text-red-600" />
                            <span className="text-gray-900 dark:text-white">{order.recipient}</span>
                            <span className="text-red-600 dark:text-red-400">- {order.error}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Error or unexpected response */
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-red-600 dark:text-red-400">
                    {results.message || 'An error occurred processing your bulk order. Please try again.'}
                  </p>
                </div>
              )}

              <button
                onClick={downloadResults}
                className="w-full py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download Results
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkPurchase;