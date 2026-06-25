'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { ShieldCheck, Mail, Lock, User, Phone, Activity } from 'lucide-react';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const data = await register(name, email, phone, password);
      if (data.success) {
        router.push(`/auth/otp-verify?email=${encodeURIComponent(email)}`);
      } else {
        setErrorMsg(data.message || 'Registration failed.');
      }
    } catch (err) {
      setErrorMsg('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-xl space-y-6 text-left">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-medical-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Activity size={24} className="gradient-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Create Account</h2>
          <p className="text-xs text-slate-500">Sign up to buy medicines online and track orders</p>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200/50">
            {errorMsg}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1">
            <label className="text-slate-400">Full Name</label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                placeholder="John Doe"
              />
              <User size={14} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                placeholder="name@email.com"
              />
              <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">Phone Number</label>
            <div className="relative">
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                placeholder="+91 9988776655"
              />
              <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-slate-400">Password</label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                placeholder="•••••••• (Min 6 characters)"
              />
              <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-pharmacy-600 hover:bg-pharmacy-700 text-white rounded-lg font-bold shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting Registration...' : 'Create Account'}
          </button>

        </form>

        <p className="text-xs text-slate-500 text-center">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-medical-600 font-bold hover:underline">
            Sign In here
          </Link>
        </p>

        <div className="flex items-center justify-center space-x-1.5 text-xxs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
          <ShieldCheck size={14} className="text-pharmacy-500" />
          <span>GST Compliant Billing Integration</span>
        </div>

      </div>
    </div>
  );
}
