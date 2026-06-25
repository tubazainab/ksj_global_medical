'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, KeyRound, Lock, Activity } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState(1); // Step 1: Send Pin, Step 2: Reset Password

  const [resetPin, setResetPin] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendPin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg(data.message || 'Reset PIN sent successfully.');
        setStep(2);
      } else {
        setErrorMsg(data.message || 'Failed to trigger reset pin.');
      }
    } catch (err) {
      setErrorMsg('Connection error.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, resetPin, newPassword })
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg('Password changed successfully! Redirecting to login page...');
        setTimeout(() => {
          router.push('/auth/login');
        }, 1500);
      } else {
        setErrorMsg(data.message || 'Password reset failed.');
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
          <h2 className="text-2xl font-black tracking-tight">
            {step === 1 ? 'Forgot Password' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-500">
            {step === 1 ? 'Enter your email to receive a password reset PIN' : 'Verify reset PIN and choose a new password'}
          </p>
        </div>

        {errorMsg && (
          <p className="text-xs text-red-500 font-bold bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200/50">
            {errorMsg}
          </p>
        )}

        {successMsg && (
          <p className="text-xs text-pharmacy-600 font-bold bg-pharmacy-50 dark:bg-pharmacy-950/20 p-3 rounded-lg border border-pharmacy-200/50">
            {successMsg}
          </p>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendPin} className="space-y-4 text-xs">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-medical-600 hover:bg-medical-700 text-white rounded-lg font-bold shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending PIN...' : 'Send Reset PIN'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400">6-Digit Reset PIN</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength="6"
                  value={resetPin}
                  onChange={(e) => setResetPin(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg dark:bg-slate-800 text-center font-bold tracking-wider"
                  placeholder="000000"
                />
                <KeyRound size={14} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">New Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border rounded-lg dark:bg-slate-800"
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
              {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <p className="text-xs text-slate-500 text-center">
          Back to{' '}
          <Link href="/auth/login" className="text-medical-600 font-bold hover:underline">
            Sign In
          </Link>
        </p>

        <div className="flex items-center justify-center space-x-1.5 text-xxs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
          <ShieldCheck size={14} className="text-pharmacy-500" />
          <span>SSL Secured API Password Reset</span>
        </div>

      </div>
    </div>
  );
}
