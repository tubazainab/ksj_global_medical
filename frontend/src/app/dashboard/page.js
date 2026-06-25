'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import {
  User,
  ShoppingBag,
  Heart,
  MapPin,
  Truck,
  Download,
  Calendar,
  ShieldCheck,
  UserCog
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function UserDashboard() {
  const { token, user, refreshUser, logout } = useAuth();
  const { wishlist, toggleWishlist } = useCart();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'orders');
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Profile forms
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  // Address inputs
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  // Check authentication
  useEffect(() => {
    if (!token) {
      router.push('/auth/login?redirect=/dashboard');
    } else if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone);
    }
  }, [token, user]);

  // Fetch orders when orders tab becomes active
  useEffect(() => {
    if (activeTab === 'orders' && token) {
      const fetchOrders = async () => {
        setLoadingOrders(true);
        try {
          const res = await fetch(`${API_URL}/orders/customer`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            setOrders(data.data);
          }
        } catch (err) {
          console.error('Error fetching customer orders:', err);
        } finally {
          setLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [activeTab, token]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'POST', // or PUT depending on routing mapping. userRoutes uses PUT /profile
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: profileName, phone: profilePhone })
      });
      const data = await res.json();
      if (data.success) {
        setProfileSuccess('Profile details updated.');
        await refreshUser();
      } else {
        setProfileError(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileError('Server connection error.');
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!street || !city || !state || !zip) return;

    try {
      const res = await fetch(`${API_URL}/users/address`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ street, city, state, postalCode: zip })
      });
      const data = await res.json();
      if (data.success) {
        setStreet('');
        setCity('');
        setState('');
        setZip('');
        await refreshUser();
      }
    } catch (err) {
      console.error('Error adding address:', err);
    }
  };

  const handleDeleteAddress = async (addrId) => {
    try {
      const res = await fetch(`${API_URL}/users/address/${addrId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        await refreshUser();
      }
    } catch (err) {
      console.error('Error deleting address:', err);
    }
  };

  if (!user) {
    return <div className="text-center py-20">Loading Account Dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Vertical tab navigation */}
        <aside className="w-full lg:w-64 space-y-2 text-left">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-medical-100 text-medical-800 flex items-center justify-center font-black text-sm">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-sm leading-none">{user.name}</h3>
                <span className="text-xxs text-slate-400 block mt-1">{user.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs rounded-xl font-bold transition-colors ${
                  activeTab === 'orders' ? 'bg-medical-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <ShoppingBag size={16} /> <span>Order History</span>
              </button>
              <button
                onClick={() => setActiveTab('wishlist')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs rounded-xl font-bold transition-colors ${
                  activeTab === 'wishlist' ? 'bg-medical-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <Heart size={16} /> <span>My Wishlist</span>
              </button>
              <button
                onClick={() => setActiveTab('addresses')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs rounded-xl font-bold transition-colors ${
                  activeTab === 'addresses' ? 'bg-medical-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <MapPin size={16} /> <span>Addresses</span>
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 text-xs rounded-xl font-bold transition-colors ${
                  activeTab === 'profile' ? 'bg-medical-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                }`}
              >
                <UserCog size={16} /> <span>Account Profile</span>
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800 my-2 pt-2">
                <button
                  onClick={logout}
                  className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs rounded-xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Side: Tab specifications content */}
        <section className="flex-grow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 min-h-[450px]">
          
          {/* ORDERS TAB */}
          {activeTab === 'orders' && (
            <div className="space-y-6 text-left">
              <h2 className="text-xl font-black">Your Orders</h2>

              {loadingOrders ? (
                <p className="text-xs text-slate-500">Loading your purchase records...</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-10 space-y-2 text-slate-400">
                  <ShoppingBag size={32} className="mx-auto" />
                  <p className="text-sm">You haven't placed any orders yet.</p>
                  <Link href="/shop" className="inline-block text-xs font-bold text-medical-600 underline">Shop Now</Link>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((ord) => (
                    <div
                      key={ord._id}
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 space-y-4 shadow-sm"
                    >
                      {/* Summary line */}
                      <div className="flex flex-wrap justify-between items-center bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg text-xs gap-3">
                        <div>
                          <span className="text-slate-400">Order ID: </span>
                          <span className="font-bold uppercase text-slate-800 dark:text-white">{ord.orderId}</span>
                        </div>
                        <div>
                          <span className="text-slate-400">Placed on: </span>
                          <span className="font-semibold">{new Date(ord.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="font-bold">
                          <span>Total: ₹{ord.totals.grandTotal}</span>
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 rounded text-xxs font-bold ${
                            ord.paymentStatus === 'Paid' ? 'bg-pharmacy-100 text-pharmacy-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.paymentStatus}
                          </span>
                        </div>
                      </div>

                      {/* Items loop */}
                      <div className="space-y-2 text-xs">
                        {ord.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between py-1 border-b border-slate-50 dark:border-slate-800/20">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{it.name}</span>
                            <span className="text-slate-400">x{it.quantity}</span>
                          </div>
                        ))}
                      </div>

                      {/* Tracking stepper */}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 text-xs space-y-4">
                        <h4 className="font-bold flex items-center">
                          <Truck size={14} className="mr-1 text-medical-600" /> Tracking Status:
                          <span className="ml-1 text-pharmacy-600 capitalize font-extrabold">{ord.orderStatus}</span>
                        </h4>

                        {/* Stepper bar visualization */}
                        <div className="relative flex justify-between items-center w-full max-w-md mx-auto pt-2 pb-6">
                          <div className="absolute top-[17px] left-0 right-0 h-0.5 bg-slate-200 dark:bg-slate-800 z-0"></div>
                          
                          {['Pending', 'Processing', 'Shipped', 'Delivered'].map((step, stepIdx) => {
                            const steps = ['Pending', 'Processing', 'Shipped', 'Delivered'];
                            const currentIdx = steps.indexOf(ord.orderStatus);
                            const completed = stepIdx <= currentIdx;

                            return (
                              <div key={step} className="flex flex-col items-center relative z-10">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xxs font-bold ${
                                  completed
                                    ? 'bg-pharmacy-600 border-pharmacy-600 text-white'
                                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'
                                }`}>
                                  {stepIdx + 1}
                                </div>
                                <span className={`text-[10px] mt-1.5 font-semibold ${
                                  completed ? 'text-slate-800 dark:text-white' : 'text-slate-400'
                                }`}>
                                  {step}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Invoice & Return actions */}
                      <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                        <Link
                          href={`${API_URL}/orders/${ord._id}/invoice`} // mock trigger for direct download
                          target="_blank"
                          className="inline-flex items-center text-medical-600 hover:text-medical-700 font-semibold"
                        >
                          <Download size={14} className="mr-1" /> Invoice Receipt
                        </Link>

                        {ord.orderStatus === 'Delivered' && (
                          <button
                            onClick={async () => {
                              const reason = prompt('Please specify return reason:');
                              if (reason) {
                                const res = await fetch(`${API_URL}/orders/${ord._id}/return`, {
                                  method: 'POST',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ reason })
                                });
                                const rData = await res.json();
                                if (rData.success) {
                                  alert('Return request registered.');
                                  window.location.reload();
                                }
                              }
                            }}
                            className="text-red-500 hover:text-red-600 font-semibold"
                          >
                            Return Order
                          </button>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* WISHLIST TAB */}
          {activeTab === 'wishlist' && (
            <div className="space-y-6 text-left">
              <h2 className="text-xl font-black">Saved Wishlist</h2>

              {!wishlist.medicines || wishlist.medicines.length === 0 ? (
                <p className="text-xs text-slate-500">Your wishlist is empty.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wishlist.medicines.map((med) => (
                    <div
                      key={med._id}
                      className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex justify-between items-center shadow-sm"
                    >
                      <div className="flex items-center space-x-3 text-xs">
                        <HeartPulse size={20} className="text-medical-600/50" />
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-white">{med.name}</h4>
                          <span className="text-xxs text-slate-400 block">{med.brand}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <button
                          onClick={() => toggleWishlist(med)}
                          className="text-red-500 font-semibold hover:underline"
                        >
                          Remove
                        </button>
                        <Link
                          href={`/product/${med._id}`}
                          className="bg-medical-600 text-white font-bold px-3 py-1 rounded-lg"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ADDRESS TAB */}
          {activeTab === 'addresses' && (
            <div className="space-y-6 text-left">
              <h2 className="text-xl font-black">Shipping Addresses</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.addresses?.map((addr) => (
                  <div
                    key={addr._id}
                    className="border border-slate-200 dark:border-slate-800 p-4 rounded-2xl relative"
                  >
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {addr.street}, {addr.city}, {addr.state} - {addr.postalCode}
                    </p>
                    <button
                      onClick={() => handleDeleteAddress(addr._id)}
                      className="text-xxs text-red-500 hover:underline font-bold mt-2 block"
                    >
                      Delete Address
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Address Form */}
              <form onSubmit={handleAddAddress} className="border-t pt-6 space-y-4 max-w-md text-xs">
                <h4 className="font-bold text-sm">Add New Address</h4>
                <div className="space-y-1">
                  <label className="text-slate-400">Street Address</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                    placeholder="Apartment, Street Name"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="PIN"
                    value={zip}
                    onChange={(e) => setZip(e.target.value)}
                    className="p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-medical-600 text-white font-bold px-4 py-2 rounded-lg"
                >
                  Save Address
                </button>
              </form>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <div className="space-y-6 text-left max-w-md">
              <h2 className="text-xl font-black">Account Profile Settings</h2>

              {profileError && <p className="text-xs text-red-500 font-bold">{profileError}</p>}
              {profileSuccess && <p className="text-xs text-pharmacy-600 font-bold">{profileSuccess}</p>}

              <form onSubmit={handleProfileUpdate} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-400">Account Name</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Email Address (Read-Only)</label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full p-2.5 border rounded-lg bg-slate-100 dark:bg-slate-800/40 text-slate-400"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-medical-600 text-white font-bold px-6 py-2.5 rounded-lg hover:bg-medical-700 shadow-md transition-colors"
                >
                  Save Changes
                </button>
              </form>
            </div>
          )}

        </section>

      </div>
    </div>
  );
}
