'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCart } from '../context/CartContext';
import AddToCartButton from '../components/AddToCartButton';
import {
  ShieldCheck,
  Truck,
  HeartPulse,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const HERO_CATEGORIES = [
  { name: 'Tablets', slug: 'Tablets', desc: 'Fever & Pain relief', count: '100+ items', color: 'from-blue-500 to-indigo-600' },
  { name: 'Capsules', slug: 'Capsules', desc: 'Soft gel & multisize', count: '80+ items', color: 'from-teal-500 to-emerald-600' },
  { name: 'Syrups', slug: 'Syrups', desc: 'Suspensions & Cough', count: '50+ items', color: 'from-amber-500 to-orange-600' },
  { name: 'Injections', slug: 'Injections', desc: 'Prescription injectables', count: '20+ items', color: 'from-purple-500 to-pink-600' },
  { name: 'Vitamins & Supplements', slug: 'Vitamins & Supplements', desc: 'Daily nutrient boosters', count: '120+ items', color: 'from-rose-500 to-red-600' },
  { name: 'Diabetic Care', slug: 'Diabetic Care', desc: 'Sugar control & monitors', count: '40+ items', color: 'from-cyan-500 to-blue-600' }
];

export default function Home() {
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await fetch(`${API_URL}/medicines?limit=4`);
        const data = await res.json();
        if (data.success) {
          setFeaturedProducts(data.data);
        }
      } catch (err) {
        console.error('Error fetching home featured products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <div className="space-y-16 pb-20">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-medical-900 via-medical-800 to-pharmacy-950 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]"></div>
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-6 text-left">
            
            <div className="inline-flex items-center space-x-2 bg-pharmacy-500/20 text-pharmacy-300 px-3 py-1.5 rounded-full text-xs font-semibold">
              <Sparkles size={14} />
              <span>Flat 10% Off First Purchase with code: <b>WELCOME10</b></span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none">
              Your Trusted <span className="text-pharmacy-400">Online</span> Medical Store
            </h1>
            
            <p className="text-lg text-slate-300 max-w-lg">
              Order certified prescription medicines, healthcare devices, and daily vitamins online. Fast, verified home delivery backed by professional pharmacists.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center px-6 py-3 font-medium bg-pharmacy-500 hover:bg-pharmacy-600 rounded-full text-white shadow-lg transition-transform transform hover:-translate-y-0.5"
              >
                Browse Shop <ShoppingBag size={16} className="ml-2" />
              </Link>
              <Link
                href="/dashboard?tab=prescription"
                className="inline-flex items-center justify-center px-6 py-3 font-medium border border-white/30 bg-white/10 hover:bg-white/20 rounded-full text-white shadow-md transition-colors"
              >
                Upload Prescription <FileText size={16} className="ml-2" />
              </Link>
            </div>

          </div>

          {/* Visual Presentation / Trust Panel */}
          <div className="rounded-3xl p-8 bg-white/10 border border-white/10 backdrop-blur-sm text-white space-y-6 max-w-md mx-auto lg:ml-auto">
            <div className="flex items-center space-x-4 border-b border-white/10 pb-4">
              <div className="bg-pharmacy-500 p-3 rounded-2xl">
                <HeartPulse size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">KSJ Pharmacy Verification</h3>
                <p className="text-xs text-slate-300">Lic. DL-39281-KSJ | Approved Drugs</p>
              </div>
            </div>

            <div className="space-y-4 text-sm text-slate-100">
              <div className="flex items-start space-x-3">
                <ShieldCheck size={18} className="text-pharmacy-300 mt-0.5 shrink-0" />
                <p>100% Genuine brand medicines sourced from audited pharmaceutical manufacturers.</p>
              </div>
              <div className="flex items-start space-x-3">
                <Truck size={18} className="text-pharmacy-300 mt-0.5 shrink-0" />
                <p>Safe shipping and contactless deliveries under standard temperature controls.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight">Browse Medicines by Category</h2>
          <p className="text-slate-500 dark:text-slate-400">Select standard drug groups to filter matching solutions</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
          {HERO_CATEGORIES.map((cat, idx) => (
            <Link
              key={idx}
              href={`/shop?category=${encodeURIComponent(cat.name)}`}
              className="group relative overflow-hidden rounded-2xl shadow-md bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-6 flex items-center justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">{cat.count}</span>
                <h4 className="text-lg font-bold text-slate-800 dark:text-white group-hover:text-medical-600 transition-colors">
                  {cat.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{cat.desc}</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 group-hover:bg-medical-50 dark:group-hover:bg-medical-950 p-3 rounded-full text-slate-400 group-hover:text-medical-600 transition-colors">
                <ArrowRight size={18} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Medicines Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1 text-left">
            <h2 className="text-3xl font-extrabold tracking-tight">Featured Health Essentials</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Top verified brands with exclusive online pricing</p>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-medical-600 hover:text-medical-700 flex items-center">
            View All Shop <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-800 h-80 rounded-2xl"></div>
            ))}
          </div>
        ) : featuredProducts.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 text-slate-500">
            No featured medicines found in catalog. Start the backend API server to seed default products.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((med) => {
              const inWishlist = wishlist.medicines?.some(m => m._id === med._id);
              const activePrice = med.discountPrice > 0 ? med.discountPrice : med.price;

              return (
                <div
                  key={med._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:shadow-lg transition-shadow relative"
                >
                  {/* Requires prescription label */}
                  {med.requiresPrescription && (
                    <span className="absolute top-4 left-4 bg-amber-500 text-white rounded px-2 py-0.5 text-xxs font-bold uppercase">
                      Prescription Required
                    </span>
                  )}

                  {/* Wishlist toggle */}
                  <button
                    onClick={() => toggleWishlist(med)}
                    className={`absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 ${
                      inWishlist ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                    }`}
                  >
                    <span className="sr-only">Wishlist</span>
                    &hearts;
                  </button>

                  <div className="h-40 w-full bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 flex items-center justify-center text-slate-400 overflow-hidden relative">
                    {med.imageURIs && med.imageURIs.length > 0 && med.imageURIs[0] ? (
                      <img
                        src={med.imageURIs[0]}
                        alt={med.name}
                        className="w-full h-full object-contain p-2 rounded-xl transition-transform hover:scale-105 duration-300"
                      />
                    ) : (
                      <HeartPulse size={48} className="text-medical-500/40" />
                    )}
                  </div>

                  <div className="space-y-1 text-left flex-grow">
                    <span className="text-xxs font-semibold text-pharmacy-600 uppercase tracking-wider">{med.brand}</span>
                    <Link href={`/product/${med._id}`}>
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1 hover:text-medical-600 transition-colors">
                        {med.name}
                      </h4>
                    </Link>
                    <p className="text-xxs text-slate-400 mb-2">Gen: {med.genericName}</p>
                    
                    {/* Price and Add button */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        {med.discountPrice > 0 ? (
                          <div className="flex items-baseline space-x-1">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">₹{med.discountPrice}</span>
                            <span className="text-xxs line-through text-slate-400">₹{med.price}</span>
                          </div>
                        ) : (
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white">₹{med.price}</span>
                        )}
                      </div>

                      <AddToCartButton
                        medicine={med}
                        quantity={1}
                        className="text-xxs font-semibold px-3 py-1.5 rounded-full transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Professional Health Features Banner */}
      <section className="bg-slate-100 dark:bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div className="space-y-3">
            <div className="w-12 h-12 bg-pharmacy-100 dark:bg-pharmacy-950 text-pharmacy-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck size={24} />
            </div>
            <h4 className="font-bold text-lg">Safe & Sealed Medicines</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Every item is stored under strict warehouse temperature regulations and batch verified for absolute safety.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 bg-medical-100 dark:bg-medical-950 text-medical-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <TrendingUp size={24} />
            </div>
            <h4 className="font-bold text-lg">Real-Time Analytics</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Integrate with hospital networks, inventory alerts, and tracking status schedules for maximum corporate efficiency.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <HeartPulse size={24} />
            </div>
            <h4 className="font-bold text-lg">AI Medical Chatbot</h4>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Get immediate drug information and recommendations from our floating assistant, warning you of prescription safety guidelines.
            </p>
          </div>
        </div>
      </section>
      
    </div>
  );
}
