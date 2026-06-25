'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../../context/AuthContext';
import { KeyRound, ShieldCheck, Activity } from 'lucide-react';

function OtpVerifyContent() {
  const { verifyOtp } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) {
      setEmail(queryEmail);
    } else {
      router.push('/auth/login');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const data = await verifyOtp(email, otpCode);
      if (data.success) {
        setSuccessMsg('Account verified successfully! Routing to shop...');
        setTimeout(() => {
          router.push('/');
        }, 1500);
      } else {
        setErrorMsg(data.message || 'OTP verification failed.');
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
          <h2 className="text-2xl font-black tracking-tight">Verify Account</h2>
          <p className="text-xs text-slate-500">
            Enter the 6-digit OTP verification pin sent to: <b className="text-slate-700 dark:text-slate-300">{email}</b>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div className="space-y-1">
            <label className="text-slate-400">6-Digit Verification PIN</label>
            <div className="relative">
              <input
                type="text"
                required
                maxLength="6"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500 text-center tracking-widest font-black text-lg"
                placeholder="000000"
              />
              <KeyRound size={16} className="absolute left-3 top-3.5 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-medical-600 hover:bg-medical-700 text-white rounded-lg font-bold shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Verifying OTP...' : 'Verify & Sign In'}
          </button>

        </form>

        <div className="flex items-center justify-center space-x-1.5 text-xxs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
          <ShieldCheck size={14} className="text-pharmacy-500" />
          <span>OTP verification simulates standard server mail deliveries.</span>
        </div>

      </div>
    </div>
  );
}

export default function OtpVerifyPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading OTP Portal...</div>}>
      <OtpVerifyContent />
    </Suspense>
  );
}
