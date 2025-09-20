'use client';
import React, { useState } from 'react';
import { User, Lock, AlertCircle, LogIn, Eye, EyeOff, Sparkles, ChevronRight } from 'lucide-react';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return false;
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://serverdatahub.onrender.com/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      // Store token in localStorage
      if (data.token) {
        // Store the token with the name "Token" as requested
        localStorage.setItem('Token', data.token);
        
        // Optionally store user data if available
        if (data.user) {
          localStorage.setItem('userData', JSON.stringify(data.user));
        }
        
        console.log('Login successful - Token stored in localStorage');
        
        // Redirect to dashboard or home page after successful login
        // window.location.href = '/dashboard';
        // Or if using React Router:
        // navigate('/');
        
        // For demo purposes, showing success message
        alert('Login successful! Token has been stored.');
      }
      
    } catch (err) {
      setError(err.message || 'An error occurred during login');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  // Optional: Check if user is already logged in on component mount
  React.useEffect(() => {
    const token = localStorage.getItem('Token');
    if (token) {
      console.log('User already has a token stored');
      // Optionally redirect to dashboard if token exists
      // window.location.href = '/dashboard';
    }
  }, []);

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-yellow-400/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-yellow-400/5 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo and title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl mb-4 shadow-lg shadow-yellow-400/20 transform hover:scale-105 transition-transform">
            <Sparkles className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">DataHub Ghana</h1>
          <p className="text-yellow-400/60">Access your data intelligence platform</p>
        </div>

        {/* Login card */}
        <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 border border-yellow-400/20 shadow-2xl">
          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-5">
            {/* Email field */}
            <div className="space-y-2">
              <label className="text-yellow-400/80 text-sm font-medium flex items-center gap-2">
                <User className="w-4 h-4" />
                Email Address
              </label>
              <div className={`relative group transition-all duration-200 ${focusedField === 'email' ? 'scale-[1.02]' : ''}`}>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 bg-black border border-yellow-400/30 rounded-lg text-yellow-400 placeholder-yellow-400/30 
                           focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 
                           transition-all duration-200"
                  placeholder="Enter your email"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <label className="text-yellow-400/80 text-sm font-medium flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <div className={`relative group transition-all duration-200 ${focusedField === 'password' ? 'scale-[1.02]' : ''}`}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 bg-black border border-yellow-400/30 rounded-lg text-yellow-400 placeholder-yellow-400/30 
                           focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 
                           transition-all duration-200 pr-12"
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400/50 hover:text-yellow-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember me and forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 bg-black border-yellow-400/30 rounded text-yellow-400 focus:ring-yellow-400/20"
                />
                <span className="text-yellow-400/60 text-sm">Remember me</span>
              </label>
              <a href="/resetpassword" className="text-yellow-400/60 text-sm hover:text-yellow-400 transition-colors">
                Forgot password?
              </a>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full relative group ${loading ? 'opacity-70' : 'hover:shadow-lg hover:shadow-yellow-400/20'} 
                bg-gradient-to-r from-yellow-400 to-yellow-500 text-black py-3 px-4 rounded-lg 
                font-semibold flex items-center justify-center gap-2 transition-all duration-300 
                transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-yellow-400/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-yellow-400/40">New to DataHub?</span>
            </div>
          </div>

          {/* Sign up link */}
          <a 
            href="/Signup"
            className="block w-full text-center py-3 px-4 border border-yellow-400/30 rounded-lg text-yellow-400 
                     hover:bg-yellow-400/10 hover:border-yellow-400/50 transition-all duration-200"
          >
            Create an Account
          </a>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-yellow-400/40 text-sm">
            Secure data platform developed by <a href="https://example.com" className="underline hover:text-yellow-400">samtech</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;