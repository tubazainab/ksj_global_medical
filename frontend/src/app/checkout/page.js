'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  CreditCard,
  MapPin,
  Truck,
  Plus,
  CheckCircle,
  HelpCircle,
  FileCheck2,
  CalendarDays
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function CheckoutPage() {
  const { token, user, refreshUser } = useAuth();
  const { cart, grandTotal, subtotal, gst, shipping, discount, couponCode, clearCartState } = useCart();
  const router = useRouter();

  // Redirect to login if guest
  useEffect(() => {
    if (!token) {
      router.push('/auth/login?redirect=/checkout');
    }
  }, [token]);

  // Address states
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);
  const [addressType, setAddressType] = useState('saved'); // 'saved' | 'new'
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newZip, setNewZip] = useState('');
  const [saveToProfile, setSaveToProfile] = useState(true);

  // Sync addressType when user profile loads
  useEffect(() => {
    if (user) {
      if (!user.addresses || user.addresses.length === 0) {
        setAddressType('new');
      } else {
        setAddressType('saved');
      }
    }
  }, [user]);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('COD'); // COD, Stripe, Razorpay
  const [loading, setLoading] = useState(false);
  const [paymentOverlay, setPaymentOverlay] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Success states
  const [orderSuccess, setOrderSuccess] = useState(null);

  const handlePlaceOrder = async () => {
    if (!user) return;

    let shippingAddress = null;

    if (addressType === 'saved') {
      if (!user.addresses || user.addresses.length === 0) {
        alert('Please add or select a shipping address before checking out.');
        return;
      }
      shippingAddress = user.addresses[selectedAddressIndex];
    } else {
      if (!newStreet || !newCity || !newState || !newZip) {
        alert('Please fill out all address fields.');
        return;
      }
      shippingAddress = {
        street: newStreet,
        city: newCity,
        state: newState,
        postalCode: newZip,
        country: 'India'
      };

      if (saveToProfile) {
        try {
          await fetch(`${API_URL}/users/address`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              street: newStreet,
              city: newCity,
              state: newState,
              postalCode: newZip,
              isDefault: !user.addresses || user.addresses.length === 0
            })
          });
          await refreshUser();
        } catch (err) {
          console.error('Error saving new address during order placement:', err);
        }
      }
    }

    setLoading(true);

    try {
      const orderItems = cart.items.map(item => ({
        medicine: item.medicine._id,
        name: item.medicine.name,
        price: item.medicine.discountPrice > 0 ? item.medicine.discountPrice : item.medicine.price,
        quantity: item.quantity
      }));

      const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: orderItems,
          shippingAddress: {
            street: shippingAddress.street,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country || 'India'
          },
          paymentMethod,
          couponCode
        })
      });
      const data = await res.json();

      if (data.success) {
        if (paymentMethod === 'COD') {
          // Cash on Delivery triggers success immediately
          setOrderSuccess(data.order);
          clearCartState();
        } else {
          // Stripe / Razorpay displays overlay for card entry simulation
          setOrderSuccess(data.order); // cache details
          setPaymentOverlay(true);
        }
      } else {
        alert(data.message || 'Failed to place order.');
      }
    } catch (err) {
      alert('Checkout server connection failure.');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatedPaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate verifying transaction ID
      const verifyRes = await fetch(`${API_URL}/orders/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          orderId: orderSuccess.orderId,
          transactionId: 'TXN-SIM-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          paymentGateway: paymentMethod,
          status: 'success'
        })
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setPaymentOverlay(false);
        setOrderSuccess(verifyData.order);
        clearCartState();
      } else {
        alert('Simulated payment verification failed.');
      }
    } catch (err) {
      alert('Error verifying payment.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="text-center py-20">Loading Checkout Parameters...</div>;
  }

  // Render Success Screen
  if (orderSuccess && !paymentOverlay && cart.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-pharmacy-100 text-pharmacy-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black">Order Placed Successfully!</h2>
          <p className="text-xs text-slate-500 font-bold">
            Order Reference: <span className="text-medical-600 font-extrabold uppercase">{orderSuccess.orderId}</span>
          </p>
          <p className="text-sm text-slate-500">
            Thank you for shopping with KSJ Global Medical. We sent a notification receipt containing tracking details to your email.
          </p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200/50 p-6 rounded-2xl text-left space-y-3 text-xs">
          <h4 className="font-extrabold text-sm flex items-center">
            <Truck size={16} className="mr-1 text-pharmacy-600" /> Shipping Destination
          </h4>
          <p>
            {orderSuccess.shippingAddress?.street}, {orderSuccess.shippingAddress?.city}, {orderSuccess.shippingAddress?.state} - {orderSuccess.shippingAddress?.postalCode}
          </p>
          <div className="border-t border-slate-200 dark:border-slate-800 pt-2.5 flex justify-between font-bold">
            <span>Amount Paid ({orderSuccess.paymentMethod})</span>
            <span>₹{orderSuccess.totals?.grandTotal}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center bg-medical-600 hover:bg-medical-700 text-white font-semibold px-6 py-2.5 rounded-full text-xs shadow-md"
          >
            Track Order Status
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center border border-slate-300 hover:bg-slate-50 rounded-full px-6 py-2.5 text-xs font-semibold"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-extrabold text-left mb-8">Secure Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Address & Payment configs */}
        <div className="lg:col-span-2 space-y-6 text-left">
          
          {/* Section 1: Address selection */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold flex items-center">
                <MapPin size={18} className="mr-1.5 text-pharmacy-600" /> Delivery Address
              </h3>
            </div>

            {/* Address Tabs (if user has saved addresses) */}
            {user.addresses && user.addresses.length > 0 ? (
              <div className="flex border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 space-x-6">
                <button
                  type="button"
                  onClick={() => setAddressType('saved')}
                  className={`pb-2 text-xs font-black border-b-2 transition-all ${
                    addressType === 'saved'
                      ? 'border-medical-600 text-medical-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  Deliver to Saved Address
                </button>
                <button
                  type="button"
                  onClick={() => setAddressType('new')}
                  className={`pb-2 text-xs font-black border-b-2 transition-all ${
                    addressType === 'new'
                      ? 'border-medical-600 text-medical-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  Deliver to New Address
                </button>
              </div>
            ) : null}

            {addressType === 'saved' && user.addresses && user.addresses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.addresses.map((addr, idx) => (
                  <div
                    key={addr._id}
                    onClick={() => setSelectedAddressIndex(idx)}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      selectedAddressIndex === idx
                        ? 'border-medical-600 bg-medical-50/20 dark:bg-medical-950/10'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="selectedAddress"
                          checked={selectedAddressIndex === idx}
                          onChange={() => setSelectedAddressIndex(idx)}
                          className="h-4 w-4 text-medical-600 focus:ring-medical-500 cursor-pointer bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                        />
                        <span className="text-slate-800 dark:text-slate-200">Address #{idx + 1}</span>
                      </div>
                      {addr.isDefault && <span className="bg-pharmacy-100 text-pharmacy-800 px-1.5 py-0.5 rounded text-[10px] font-bold">Default</span>}
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                      {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="col-span-2 space-y-1">
                  <label className="text-slate-500 font-bold">Street Address</label>
                  <input
                    type="text"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                    placeholder="House No, Apartment, Street Name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">City</label>
                  <input
                    type="text"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                    placeholder="E.g. Delhi"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">State</label>
                  <input
                    type="text"
                    required
                    value={newState}
                    onChange={(e) => setNewState(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                    placeholder="E.g. Delhi"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-500 font-bold">Postal Code (PIN)</label>
                  <input
                    type="text"
                    required
                    value={newZip}
                    onChange={(e) => setNewZip(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                    placeholder="E.g. 110001"
                  />
                </div>
                <div className="col-span-2 flex items-center space-x-2 pt-2">
                  <input
                    type="checkbox"
                    id="saveToProfileCheckbox"
                    checked={saveToProfile}
                    onChange={(e) => setSaveToProfile(e.target.checked)}
                    className="h-4 w-4 rounded text-medical-600 focus:ring-medical-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                  <label htmlFor="saveToProfileCheckbox" className="text-slate-600 dark:text-slate-300 font-medium select-none cursor-pointer">
                    Save this address to my profile for future orders
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Payment select */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center">
              <CreditCard size={18} className="mr-1.5 text-pharmacy-600" /> Payment Method
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div
                onClick={() => setPaymentMethod('COD')}
                className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between h-24 ${
                  paymentMethod === 'COD' ? 'border-medical-600 bg-medical-50/20 dark:bg-medical-950/10' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className="text-xs font-bold">Cash on Delivery</span>
                <span className="text-xxs text-slate-400">Pay when drugs are delivered.</span>
              </div>

              <div
                onClick={() => setPaymentMethod('Stripe')}
                className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between h-24 ${
                  paymentMethod === 'Stripe' ? 'border-medical-600 bg-medical-50/20 dark:bg-medical-950/10' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className="text-xs font-bold">Stripe Card Pay</span>
                <span className="text-xxs text-slate-400">International cards supported.</span>
              </div>

              <div
                onClick={() => setPaymentMethod('Razorpay')}
                className={`p-4 rounded-xl border cursor-pointer flex flex-col justify-between h-24 ${
                  paymentMethod === 'Razorpay' ? 'border-medical-600 bg-medical-50/20 dark:bg-medical-950/10' : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <span className="text-xs font-bold">Razorpay UPI / Net</span>
                <span className="text-xxs text-slate-400">UPI, NetBanking and Indian cards.</span>
              </div>

            </div>
          </div>

        </div>

        {/* Right Side: Spec details */}
        <div className="space-y-6 text-left">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold border-b border-slate-100 dark:border-slate-800 pb-3">Review Purchase</h3>
            
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1 text-xs">
              {cart.items.map((item) => {
                if (!item || !item.medicine) return null;
                return (
                  <div key={item.medicine._id} className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/50">
                    <span className="line-clamp-1 w-32">{item.medicine.name}</span>
                    <span className="text-slate-400">x{item.quantity}</span>
                    <span className="font-semibold">₹{(item.medicine.discountPrice > 0 ? item.medicine.discountPrice : item.medicine.price) * item.quantity}</span>
                  </div>
                );
              })}
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span>GST Tax (12%)</span>
                <span>₹{gst}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fees</span>
                <span>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-pharmacy-600 font-semibold">
                  <span>Discount Code</span>
                  <span>- ₹{discount}</span>
                </div>
              )}
              
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex justify-between font-black text-slate-900 dark:text-white">
                <span>Amount Due</span>
                <span>₹{grandTotal}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="w-full inline-flex items-center justify-center bg-pharmacy-600 hover:bg-pharmacy-700 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing Order...' : `Place Order (₹${grandTotal})`}
            </button>

          </div>

        </div>

      </div>

      {/* Payment Gateway Modal Overlay */}
      {paymentOverlay && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full space-y-4 text-left shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h4 className="font-bold text-sm flex items-center text-slate-800 dark:text-white">
                <CreditCard size={16} className="mr-1.5 text-medical-600 animate-pulse" />
                {paymentMethod} Gateway Simulator
              </h4>
              <button
                onClick={() => { setPaymentOverlay(false); router.push('/dashboard'); }}
                className="text-xs text-red-500 font-semibold"
              >
                Abort
              </button>
            </div>

            <p className="text-xxs text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-800 p-3 rounded-lg">
              You are simulating a payment of <b className="text-slate-800 dark:text-white">₹{grandTotal}</b>. Enter card numbers to verify state change.
            </p>

            <form onSubmit={handleSimulatedPaymentSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Card Number</label>
                <input
                  type="text"
                  required
                  maxLength="19"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  placeholder="4111 2222 3333 4444"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-400 flex items-center">
                    <CalendarDays size={12} className="mr-1 text-slate-400" /> Expiry
                  </label>
                  <input
                    type="text"
                    required
                    maxLength="5"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                    placeholder="MM/YY"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-400 flex items-center">
                    <FileCheck2 size={12} className="mr-1 text-slate-400" /> CVV
                  </label>
                  <input
                    type="password"
                    required
                    maxLength="3"
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                    placeholder="123"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-medical-600 hover:bg-medical-700 text-white rounded-lg font-bold shadow-md transition-colors pt-2 disabled:opacity-50"
              >
                {loading ? 'Processing Payment...' : `Confirm Payment of ₹${grandTotal}`}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
