'use client';
import React, { useState, useCallback } from 'react';
import { User, Mail, Phone, Briefcase, Lock, Loader2, AlertCircle, Eye, EyeOff, Sparkles, CheckCircle, MapPin, Hash } from 'lucide-react';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    secondName: '',
    email: '',
    phoneNumber: '',
    business: {
      name: '',
      registrationNumber: '',
      address: ''
    },
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [success, setSuccess] = useState(false);

  const validateField = useCallback((field, value) => {
    switch (field) {
      case 'firstName':
      case 'secondName':
        if (!value.trim()) {
          return `${field === 'firstName' ? 'First' : 'Second'} name is required`;
        }
        if (value.length < 2) {
          return `${field === 'firstName' ? 'First' : 'Second'} name must be at least 2 characters`;
        }
        return '';
      case 'email':
        if (!value.trim()) {
          return 'Email is required';
        }
        if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value)) {
          return 'Please enter a valid email';
        }
        return '';
      case 'phoneNumber':
        if (!value.trim()) {
          return 'Phone number is required';
        }
        if (!/^(\+233|0)[0-9]{9}$/.test(value.replace(/\s/g, ''))) {
          return 'Please enter a valid Ghana phone number';
        }
        return '';
      case 'business.name':
        if (!value.trim()) {
          return 'Business name is required';
        }
        return '';
      case 'password':
        if (!value.trim()) {
          return 'Password is required';
        }
        if (value.length < 8) {
          return 'Password must be at least 8 characters';
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Password must contain uppercase, lowercase, and number';
        }
        return '';
      case 'confirmPassword':
        if (!value.trim()) {
          return 'Please confirm your password';
        }
        if (value !== formData.password) {
          return 'Passwords do not match';
        }
        return '';
      default:
        return '';
    }
  }, [formData.password]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('business.')) {
      const businessField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        business: {
          ...prev.business,
          [businessField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [touched, validateField]);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const value = field.startsWith('business.') 
      ? formData.business[field.split('.')[1]]
      : formData[field];
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateStep = (step) => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['firstName', 'secondName', 'email', 'phoneNumber'];
    } else if (step === 2) {
      fieldsToValidate = ['business.name'];
    } else if (step === 3) {
      fieldsToValidate = ['password', 'confirmPassword'];
    }

    const newErrors = {};
    fieldsToValidate.forEach(field => {
      const value = field.startsWith('business.') 
        ? formData.business[field.split('.')[1]]
        : formData[field];
      const error = validateField(field, value);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    fieldsToValidate.forEach(field => {
      setTouched(prev => ({ ...prev, [field]: true }));
    });

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    setErrors({});

    const submitData = { ...formData };
    delete submitData.confirmPassword;

    try {
      const response = await fetch(' https://serverdatahub.onrender.com/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setSuccess(true);
        // Clear form after 3 seconds and redirect
        setTimeout(() => {
          window.location.href = '/Signin';
        }, 3000);
      } else {
        setErrors({ general: data.message || 'Signup failed. Please try again.' });
        setLoading(false);
      }
    } catch (error) {
      setErrors({ general: 'Network error. Please check your connection.' });
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  if (success) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 border border-green-400/20 shadow-2xl max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-400 mb-2">Account Created Successfully!</h2>
          <p className="text-green-400/70">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-8 px-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-32 right-32 w-96 h-96 bg-yellow-400/10 rounded-full filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-32 left-32 w-72 h-72 bg-yellow-400/5 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="relative z-10 max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl mb-4 shadow-lg shadow-yellow-400/20">
            <Sparkles className="w-10 h-10 text-black" />
          </div>
          <h1 className="text-4xl font-bold text-yellow-400 mb-2">Join DataHub Ghana</h1>
          <p className="text-yellow-400/60">Create your account in 3 simple steps</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                  step === currentStep 
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black shadow-lg shadow-yellow-400/30' 
                    : step < currentStep 
                    ? 'bg-green-500 text-white' 
                    : 'bg-yellow-400/20 text-yellow-400/50'
                }`}>
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div className={`w-16 h-1 ml-2 transition-all duration-300 ${
                    step < currentStep ? 'bg-green-500' : 'bg-yellow-400/20'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form card */}
        <div className="bg-black/50 backdrop-blur-xl rounded-2xl p-8 border border-yellow-400/20 shadow-2xl">
          {errors.general && (
            <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span className="text-red-400 text-sm">{errors.general}</span>
            </div>
          )}

          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-yellow-400/80 text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('firstName')}
                    className={`w-full px-4 py-3 bg-black border ${errors.firstName ? 'border-red-500' : 'border-yellow-400/30'} rounded-lg text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20`}
                    placeholder="John"
                  />
                  {errors.firstName && <p className="text-red-400 text-xs">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-yellow-400/80 text-sm font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Second Name
                  </label>
                  <input
                    type="text"
                    name="secondName"
                    value={formData.secondName}
                    onChange={handleChange}
                    onBlur={() => handleBlur('secondName')}
                    className={`w-full px-4 py-3 bg-black border ${errors.secondName ? 'border-red-500' : 'border-yellow-400/30'} rounded-lg text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20`}
                    placeholder="Doe"
                  />
                  {errors.secondName && <p className="text-red-400 text-xs">{errors.secondName}</p>}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-yellow-400/80 text-sm font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={() => handleBlur('email')}
                  className={`w-full px-4 py-3 bg-black border ${errors.email ? 'border-red-500' : 'border-yellow-400/30'} rounded-lg text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20`}
                  placeholder="john.doe@example.com"
                />
                {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-yellow-400/80 text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  onBlur={() => handleBlur('phoneNumber')}
                  className={`w-full px-4 py-3 bg-black border ${errors.phoneNumber ? 'border-red-500' : 'border-yellow-400/30'} rounded-lg text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20`}
                  placeholder="+233 XX XXX XXXX or 0XX XXX XXXX"
                />
                {errors.phoneNumber && <p className="text-red-400 text-xs">{errors.phoneNumber}</p>}
              </div>
            </div>
          )}

          {/* Step 2: Business Information */}
          {currentStep === 2 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Business Information</h2>
              <div className="space-y-2">
                <label className="text-yellow-400/80 text-sm font-medium flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Business Name *
                </label>
                <input
                  type="text"
                  name="business.name"
                  value={formData.business.name}
                  onChange={handleChange}
                  onBlur={() => handleBlur('business.name')}
                  className={`w-full px-4 py-3 bg-black border ${errors['business.name'] ? 'border-red-500' : 'border-yellow-400/30'} rounded-lg text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20`}
                  placeholder="Your Business Name"
                />
                {errors['business.name'] && <p className="text-red-400 text-xs">{errors['business.name']}</p>}
              </div>
              <div className="space-y-2">
                <label className="text-yellow-400/80 text-sm font-medium flex items-center gap-2">
                  <Hash className="w-4 h-4" />
                  Registration Number (Optional)
                </label>
                <input
                  type="text"
                  name="business.registrationNumber"
                  value={formData.business.registrationNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-black border border-yellow-400/30 rounded-lg text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  placeholder="Business Registration Number"
                />
              </div>
              <div className="space-y-2">
                <label className="text-yellow-400/80 text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Business Address (Optional)
                </label>
                <textarea
                  name="business.address"
                  value={formData.business.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full px-4 py-3 bg-black border border-yellow-400/30 rounded-lg text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  placeholder="Business Address"
                />
              </div>
            </div>
          )}

          {/* Step 3: Security */}
          {currentStep === 3 && (
            <div className="space-y-5">
              <h2 className="text-xl font-semibold text-yellow-400 mb-4">Set Your Password</h2>
              <div className="space-y-2">
                <label className="text-yellow-400/80 text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={() => handleBlur('password')}
                    className={`w-full px-4 py-3 bg-black border ${errors.password ? 'border-red-500' : 'border-yellow-400/30'} rounded-lg text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 pr-12`}
                    placeholder="Enter a strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400/50 hover:text-yellow-400"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
                {formData.password && !errors.password && (
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-1 flex-1 rounded-full transition-all ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-yellow-400/20'}`}></div>
                      <span className="text-xs text-yellow-400/60">8+ characters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-1 flex-1 rounded-full transition-all ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-yellow-400/20'}`}></div>
                      <span className="text-xs text-yellow-400/60">Uppercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-1 flex-1 rounded-full transition-all ${/[a-z]/.test(formData.password) ? 'bg-green-500' : 'bg-yellow-400/20'}`}></div>
                      <span className="text-xs text-yellow-400/60">Lowercase letter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-1 flex-1 rounded-full transition-all ${/\d/.test(formData.password) ? 'bg-green-500' : 'bg-yellow-400/20'}`}></div>
                      <span className="text-xs text-yellow-400/60">Number</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-yellow-400/80 text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onBlur={() => handleBlur('confirmPassword')}
                    className={`w-full px-4 py-3 bg-black border ${errors.confirmPassword ? 'border-red-500' : 'border-yellow-400/30'} rounded-lg text-yellow-400 placeholder-yellow-400/30 focus:outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 pr-12`}
                    placeholder="Re-enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-yellow-400/50 hover:text-yellow-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword}</p>}
                {formData.confirmPassword && !errors.confirmPassword && formData.confirmPassword === formData.password && (
                  <p className="text-green-400 text-xs flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />
                    Passwords match
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between items-center mt-8">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-6 py-2 border border-yellow-400/30 rounded-lg text-yellow-400 hover:bg-yellow-400/10 transition-all"
              >
                Previous
              </button>
            )}
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="ml-auto px-6 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-400/20 transition-all"
              >
                Next Step
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="ml-auto px-8 py-2 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-lg font-semibold hover:shadow-lg hover:shadow-yellow-400/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            )}
          </div>

          {/* Sign in link */}
          <div className="mt-6 text-center">
            <p className="text-yellow-400/60 text-sm">
              Already have an account?{' '}
              <a href="/Signin" className="text-yellow-400 hover:text-yellow-500 font-medium">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;