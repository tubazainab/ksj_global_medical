'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { Trash2, ArrowRight, ShoppingCart, Percent, ShieldCheck, HeartPulse } from 'lucide-react';

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    addToCart,
    applyCoupon,
    couponCode,
    subtotal,
    gst,
    shipping,
    discount,
    grandTotal
  } = useCart();

  const [couponInput, setCouponInput] = useState('');
  const [couponMsg, setCouponMsg] = useState({ text: '', type: '' });

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponMsg({ text: '', type: '' });
    if (!couponInput.trim()) return;

    const res = applyCoupon(couponInput.trim());
    if (res.success) {
      setCouponMsg({ text: res.message, type: 'success' });
    } else {
      setCouponMsg({ text: res.message, type: 'error' });
    }
  };

  const handleQuantityChange = (item, action) => {
    const newQty = action === 'inc' ? item.quantity + 1 : item.quantity - 1;
    if (newQty < 1) {
      removeFromCart(item.medicine._id);
    } else {
      addToCart(item.medicine, newQty);
    }
  };

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <ShoppingCart size={32} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">Your Cart is Empty</h2>
        <p className="text-sm text-slate-500 max-w-sm mx-auto">
          Add medicines or dietary wellness products from our shop page to fill your medicine cabinet.
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center bg-medical-600 hover:bg-medical-700 text-white font-semibold px-6 py-2.5 rounded-full text-sm shadow-md"
        >
          Browse Medicines
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-left mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Items list table */}
        <div className="lg:col-span-2 space-y-4 text-left">
          {cart.items.map((item) => {
            const med = item.medicine;
            if (!med) return null;
            const price = med.discountPrice > 0 ? med.discountPrice : med.price;

            return (
              <div
                key={item._id || med._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm"
              >
                
                {/* Product spec summary */}
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center shrink-0">
                    <HeartPulse size={24} className="text-medical-600/40" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1">{med.name}</h3>
                    <span className="text-xxs font-bold text-pharmacy-600 block uppercase">{med.brand}</span>
                    <span className="text-xs text-slate-400 font-bold mt-1 block">₹{price} / unit</span>
                  </div>
                </div>

                {/* Controls & Delete */}
                <div className="flex items-center space-x-6">
                  
                  {/* Quantity adjust */}
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800 text-xs">
                    <button
                      onClick={() => handleQuantityChange(item, 'dec')}
                      className="px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                    >
                      -
                    </button>
                    <span className="px-3 font-bold">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item, 'inc')}
                      className="px-2 py-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 font-semibold"
                    >
                      +
                    </button>
                  </div>

                  {/* Total price for product line */}
                  <div className="text-sm font-bold text-slate-950 dark:text-white w-16 text-right">
                    ₹{price * item.quantity}
                  </div>

                  {/* Remove button */}
                  <button
                    onClick={() => removeFromCart(med._id)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>

                </div>

              </div>
            );
          })}
        </div>

        {/* Right Side: Totals summary cards */}
        <div className="space-y-6 text-left">
          
          {/* Summary values */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3">Purchase Summary</h3>
            
            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (12% medicine rate)</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹{gst}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fees</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {shipping === 0 ? <b className="text-pharmacy-600">FREE</b> : `₹${shipping}`}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-pharmacy-600 font-semibold">
                  <span>Discount Applied</span>
                  <span>- ₹{discount}</span>
                </div>
              )}

              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                <span>Grand Total</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              className="w-full inline-flex items-center justify-center bg-medical-600 hover:bg-medical-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-colors"
            >
              Proceed to Checkout <ArrowRight size={16} className="ml-2" />
            </Link>

          </div>

          {/* Coupon form card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h4 className="font-bold text-sm flex items-center">
              <Percent size={16} className="mr-1 text-pharmacy-500" /> Apply Coupon
            </h4>

            {couponMsg.text && (
              <p className={`text-xxs font-semibold ${
                couponMsg.type === 'success' ? 'text-pharmacy-600' : 'text-red-500'
              }`}>
                {couponMsg.text}
              </p>
            )}

            <form onSubmit={handleApplyCoupon} className="flex space-x-2">
              <input
                type="text"
                placeholder="Enter coupon (e.g. WELCOME10)"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value)}
                className="flex-1 text-xs px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500 rounded-lg"
              />
              <button
                type="submit"
                className="bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 px-4 py-2 rounded-lg text-xs font-semibold"
              >
                Apply
              </button>
            </form>
          </div>

          {/* Trust note */}
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900/50 p-4 rounded-2xl text-xxs text-slate-500 leading-relaxed">
            <ShieldCheck size={20} className="text-pharmacy-500 shrink-0" />
            <p>Your order values include full pharmaceutical tax bills (GST/invoice download). Deliveries follow proper safety hygiene.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
