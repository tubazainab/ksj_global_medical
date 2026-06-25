import React from 'react';
import Link from 'next/link';
import { ShieldCheck, HeartPulse, CreditCard, HelpCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 dark:bg-slate-950 border-t border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand details */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold tracking-wide">KSJ Global Medical</h3>
            <p className="text-sm">
              Your trusted online pharmacy store. We deliver high-quality prescription medicines, OTC drugs, health supplements, and medical devices directly to your doorstep.
            </p>
            <div className="flex items-center space-x-2 text-pharmacy-500 font-semibold text-sm">
              <HeartPulse size={16} />
              <span>License No: DL-39281-KSJ</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Shop Categories</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/shop?category=Tablets" className="hover:text-white">Tablets</Link></li>
              <li><Link href="/shop?category=Syrups" className="hover:text-white">Syrups</Link></li>
              <li><Link href="/shop?category=Injections" className="hover:text-white">Injections</Link></li>
              <li><Link href="/shop?category=Vitamins%20%26%20Supplements" className="hover:text-white">Vitamins & Supplements</Link></li>
              <li><Link href="/shop?category=Diabetic%20Care" className="hover:text-white">Diabetic Care</Link></li>
            </ul>
          </div>

          {/* Col 3: Quick Links */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Customer Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/dashboard" className="hover:text-white">My Dashboard</Link></li>
              <li><Link href="/cart" className="hover:text-white">Shopping Cart</Link></li>
              <li><Link href="/shop" className="hover:text-white">Track Order</Link></li>
              <li><Link href="/auth/login" className="hover:text-white">Employee Login</Link></li>
              <li><Link href="/faq" className="hover:text-white">Support & FAQs</Link></li>
            </ul>
          </div>

          {/* Col 4: Quality & Verification */}
          <div className="space-y-4">
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase">Secure Shopping</h4>
            <p className="text-sm">
              We process secure payments with industry-leading tools like Stripe and Razorpay. All transactions are fully encrypted.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center space-x-1 text-xs bg-slate-800 text-slate-300 px-2 py-1.5 rounded">
                <ShieldCheck size={14} className="text-pharmacy-500" />
                <span>GST Compliant</span>
              </div>
              <div className="flex items-center space-x-1 text-xs bg-slate-800 text-slate-300 px-2 py-1.5 rounded">
                <CreditCard size={14} className="text-medical-500" />
                <span>Stripe/Razorpay</span>
              </div>
            </div>
          </div>

        </div>

        <div className="mt-8 pt-8 border-t border-slate-800 text-center text-xs">
          <p>&copy; {new Date().getFullYear()} KSJ Global Medical. All rights reserved. Registered trademark of KSJ Pharmacy Pvt. Ltd.</p>
          <p className="mt-1 text-slate-600">Designed with a professional pharmacy and healthcare system architecture.</p>
        </div>
      </div>
    </footer>
  );
}
