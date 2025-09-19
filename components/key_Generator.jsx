'use client'
import React, { useState, useEffect } from 'react';
import { Key, Copy, CheckCircle, Loader, X } from 'lucide-react';

const ApiKeyGenerator = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Load API key from localStorage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('apiKey');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const generateApiKey = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://unimarket.space/api/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to generate API key');
      }

      setApiKey(data.data.apiKey);
      localStorage.setItem('apiKey', data.data.apiKey);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleLogout = () => {
    setApiKey('');
    localStorage.removeItem('apiKey');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin text-yellow-400" size={24} />
      </div>
    );
  }

  if (apiKey) {
    return (
      <div className="space-y-4">
        <div className="bg-black border border-yellow-400 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-yellow-400 text-sm">Your API Key:</span>
            <button
              onClick={copyToClipboard}
              className="text-yellow-400 hover:text-yellow-500 p-1"
            >
              {copied ? <CheckCircle size={16} /> : <Copy size={16} />}
            </button>
          </div>
          <code className="block text-yellow-400 font-mono text-sm break-all">
            {apiKey}
          </code>
        </div>
        <div className="flex justify-end">
          <button
            onClick={handleLogout}
            className="text-yellow-400 hover:text-yellow-500 text-sm flex items-center gap-2"
          >
            <X size={16} />
            Remove API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="bg-yellow-400 hover:bg-yellow-500 text-black px-6 py-3 rounded-lg font-medium flex items-center justify-center gap-2 w-full"
        >
          <Key size={20} />
          Generate API Key
        </button>
      ) : (
        <form onSubmit={generateApiKey} className="space-y-4">
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full bg-black border border-yellow-400 rounded-lg px-4 py-2 text-yellow-400 placeholder-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full bg-black border border-yellow-400 rounded-lg px-4 py-2 text-yellow-400 placeholder-yellow-400/50 focus:outline-none focus:ring-2 focus:ring-yellow-400"
            /> 
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 border border-yellow-400 text-yellow-400 hover:bg-yellow-400/10 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              Generate
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ApiKeyGenerator;