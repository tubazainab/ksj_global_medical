'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { ShieldCheck, Mail, Lock, UserCheck, Activity } from 'lucide-react';

export default function LoginPage() {
  const { login, loginEmployee } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isEmployee, setIsEmployee] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectUrl = searchParams.get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      let data;
      if (isEmployee) {
        data = await loginEmployee(email, password);
      } else {
        data = await login(email, password);
      }

      if (data.success) {
        if (isEmployee) {
          router.push(data.employee.role === 'Admin' ? '/admin' : '/employee');
        } else {
          router.push(redirectUrl);
        }
      } else {
        if (data.requiresVerification) {
          router.push(`/auth/otp-verify?email=${encodeURIComponent(data.email)}`);
        } else {
          setErrorMsg(data.message || 'Login failed.');
        }
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
        
        {/* Header logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-medical-600 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Activity size={24} className="gradient-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-tight">Sign In to KSJ</h2>
          <p className="text-xs text-slate-500">"Your Trusted Online Medical Store"</p>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200/50">
            {errorMsg}
          </p>
        )}

        {/* Mode Selector */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setIsEmployee(false)}
            className={`flex-1 py-2 text-center rounded-lg transition-all ${
              !isEmployee ? 'bg-white dark:bg-slate-700 shadow text-medical-600' : 'text-slate-500'
            }`}
          >
            Customer Account
          </button>
          <button
            type="button"
            onClick={() => setIsEmployee(true)}
            className={`flex-1 py-2 text-center rounded-lg transition-all ${
              isEmployee ? 'bg-white dark:bg-slate-700 shadow text-medical-600' : 'text-slate-500'
            }`}
          >
            Pharmacy Staff
          </button>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1">
            <label className="text-slate-400">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border rounded-lg dark:bg-slate-800"
                placeholder="name@email.com"
              />
              <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-slate-400">Password</label>
              {!isEmployee && (
                <Link href="/auth/forgot-password" className="text-xxs text-medical-600 font-semibold hover:underline">
                  Forgot Password?
                </Link>
              )}
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border rounded-lg dark:bg-slate-800"
                placeholder="••••••••"
              />
              <Lock size={14} className="absolute left-3 top-3 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-medical-600 hover:bg-medical-700 text-white rounded-lg font-bold shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : `Sign In as ${isEmployee ? 'Staff' : 'Customer'}`}
          </button>

        </form>

        {/* Footer actions */}
        {!isEmployee && (
          <p className="text-xs text-slate-500 text-center">
            New customer?{' '}
            <Link href="/auth/register" className="text-medical-600 font-bold hover:underline">
              Create an Account
            </Link>
          </p>
        )}

        <div className="flex items-center justify-center space-x-1.5 text-xxs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
          <ShieldCheck size={14} className="text-pharmacy-500" />
          <span>SSL Secured API Login Gateway</span>
        </div>

      </div>
    </div>
  );
}
