'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '../../../context/CartContext';
import { useAuth } from '../../../context/AuthContext';
import {
  HeartPulse,
  AlertTriangle,
  CheckCircle,
  ShieldCheck,
  Star,
  FileUp,
  Plus,
  Minus
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function ProductDetails() {
  const { id } = useParams();
  const router = useRouter();
  const { token, user } = useAuth();
  const { addToCart, wishlist, toggleWishlist } = useCart();

  const [medicine, setMedicine] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);

  // Review form states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');

  // Prescription states
  const [prescriptionFile, setPrescriptionFile] = useState(null);
  const [prescriptionUploaded, setPrescriptionUploaded] = useState(false);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await fetch(`${API_URL}/medicines/${id}`);
        const data = await res.json();
        if (data.success) {
          setMedicine(data.data);
          setReviews(data.reviews || []);
        } else {
          router.push('/shop');
        }
      } catch (err) {
        console.error('Error fetching details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [id]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');

    if (!token) {
      setReviewError('You must sign in to submit a product review.');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/medicines/${id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rating, comment })
      });
      const data = await res.json();

      if (data.success) {
        setReviewSuccess('Review submitted successfully!');
        setReviews([data.data, ...reviews]);
        setComment('');
        // Refresh product details to show updated avg rating
        const freshRes = await fetch(`${API_URL}/medicines/${id}`);
        const freshData = await freshRes.json();
        if (freshData.success) setMedicine(freshData.data);
      } else {
        setReviewError(data.message || 'Failed to submit review.');
      }
    } catch (err) {
      setReviewError('Connection error encountered.');
    }
  };

  const handlePrescriptionUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPrescriptionFile(e.target.files[0]);
      setPrescriptionUploaded(true);
    }
  };

  if (loading) {
    return <div className="text-center py-20">Loading Medicine Specifications...</div>;
  }

  if (!medicine) {
    return <div className="text-center py-20 text-red-500">Medicine record not found.</div>;
  }

  const isWishlisted = wishlist.medicines?.some(m => m._id === medicine._id);
  const activePrice = medicine.discountPrice > 0 ? medicine.discountPrice : medicine.price;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      
      {/* Product Spec Panel */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-12 text-left">
        
        {/* Left: Product Media Block */}
        <div className="space-y-4">
          <div className="h-[350px] w-full bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400 relative">
            <HeartPulse size={96} className="text-medical-600/30" />
            
            {medicine.requiresPrescription && (
              <span className="absolute top-4 left-4 bg-amber-500 text-white rounded px-3 py-1 text-xs font-bold uppercase tracking-wider">
                Prescription Rx Required
              </span>
            )}
          </div>
        </div>

        {/* Right: Spec details */}
        <div className="space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-pharmacy-600 uppercase tracking-widest">{medicine.brand}</span>
            <h1 className="text-3xl font-extrabold">{medicine.name}</h1>
            <p className="text-sm text-slate-500">Active Ingredient: <b>{medicine.genericName}</b></p>
          </div>

          {/* Pricing Row */}
          <div className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
            {medicine.discountPrice > 0 ? (
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">₹{medicine.discountPrice}</span>
                <span className="text-sm line-through text-slate-400">₹{medicine.price}</span>
                <span className="text-xs text-pharmacy-600 font-bold bg-pharmacy-50 dark:bg-pharmacy-950/20 px-2 py-0.5 rounded">
                  Save ₹{medicine.price - medicine.discountPrice}
                </span>
              </div>
            ) : (
              <span className="text-3xl font-black text-slate-900 dark:text-white">₹{medicine.price}</span>
            )}
          </div>

          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            <p>{medicine.description}</p>
          </div>

          {/* Expiry and SKU info */}
          <div className="grid grid-cols-2 gap-4 text-xs border-y border-slate-100 dark:border-slate-800 py-3">
            <div>
              <span className="text-slate-400 block">SKU Code</span>
              <span className="font-semibold">{medicine.sku}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Expiry Date</span>
              <span className="font-semibold text-rose-500">{new Date(medicine.expiryDate).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Prescription Upload Form (Visible if Rx required) */}
          {medicine.requiresPrescription && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-start space-x-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div className="text-xs leading-relaxed">
                  <span className="font-bold">Prescription Document Needed:</span> This medicine contains clinical compounds requiring pharmacist audit. Please upload a scan.
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <label className="cursor-pointer inline-flex items-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 px-4 py-2 rounded-lg text-xs font-semibold hover:bg-slate-50">
                  <FileUp size={14} className="mr-2 text-amber-500" />
                  {prescriptionUploaded ? 'Change Document' : 'Upload Rx Scan'}
                  <input type="file" className="hidden" accept="image/*,.pdf" onChange={handlePrescriptionUpload} />
                </label>
                {prescriptionUploaded && (
                  <span className="text-xxs text-pharmacy-600 flex items-center">
                    <CheckCircle size={12} className="mr-1" /> Ready ({prescriptionFile?.name.substring(0, 15)}...)
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Add to Cart Controls */}
          <div className="flex items-center space-x-4 pt-2">
            
            {/* Quantity Selector */}
            <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600"
              >
                <Minus size={14} />
              </button>
              <span className="px-4 text-xs font-bold">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="p-2.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              onClick={() => addToCart(medicine, qty)}
              className="flex-grow inline-flex items-center justify-center bg-medical-600 hover:bg-medical-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors"
            >
              Add {qty} to Cart
            </button>

            <button
              onClick={() => toggleWishlist(medicine)}
              className={`p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 ${
                isWishlisted ? 'text-rose-500 border-rose-200' : 'text-slate-400 border-slate-300'
              }`}
            >
              &hearts;
            </button>

          </div>

        </div>

      </section>

      {/* Warnings & Dosage info */}
      <section className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200/50 rounded-3xl p-6 lg:p-10 space-y-6 text-left">
        <h3 className="text-xl font-bold border-b border-slate-200/50 pb-3">Clinical Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
              <CheckCircle size={16} className="mr-1.5 text-pharmacy-500" /> Dosage Instruction
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {medicine.dosage || 'Take only as specified by a certified physician.'}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center">
              <AlertTriangle size={16} className="mr-1.5 text-amber-500" /> Side Effects
            </h4>
            <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
              {medicine.sideEffects || 'None reported at standard dose levels. Consult pharmacist if issues persist.'}
            </p>
          </div>
        </div>
      </section>

      {/* Review Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        
        {/* Left Side: Summary & Form */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="text-lg font-bold">Reviews & Ratings</h3>
            <div className="flex items-center space-x-3">
              <div className="text-4xl font-extrabold text-slate-800 dark:text-white">
                {medicine.rating ? medicine.rating.toFixed(1) : '0.0'}
              </div>
              <div>
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      fill={i < Math.round(medicine.rating || 0) ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <span className="text-xs text-slate-400">{medicine.numReviews} product reviews</span>
              </div>
            </div>
          </div>

          {/* Add Review Form */}
          {user ? (
            <form onSubmit={handleReviewSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 space-y-4">
              <h4 className="font-bold text-sm">Write a Customer Review</h4>

              {reviewError && <p className="text-xs text-red-500 font-semibold">{reviewError}</p>}
              {reviewSuccess && <p className="text-xs text-pharmacy-600 font-semibold">{reviewSuccess}</p>}

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Rating Score</label>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRating(val)}
                      className={`p-1 rounded ${rating >= val ? 'text-amber-500' : 'text-slate-300'}`}
                    >
                      <Star size={20} fill="currentColor" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-400">Review Comments</label>
                <textarea
                  required
                  rows="3"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 rounded-lg focus:outline-none"
                  placeholder="Share details of your experience with this medicine..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-medical-600 hover:bg-medical-700 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                Submit Review
              </button>
            </form>
          ) : (
            <div className="bg-slate-100 dark:bg-slate-900 text-center p-6 rounded-3xl text-xs text-slate-400">
              Please <Link href="/auth/login" className="text-medical-600 underline">Sign In</Link> to post reviews.
            </div>
          )}

        </div>

        {/* Right Side: Comments Grid */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg">Customer Comments</h3>
          {reviews.length === 0 ? (
            <p className="text-slate-400 text-sm">No reviews posted yet for this medicine. Be the first to share your experience!</p>
          ) : (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2 no-scrollbar">
              {reviews.map((rev) => (
                <div
                  key={rev._id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-2 border-l-4 border-l-medical-600"
                >
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 dark:text-white">{rev.name}</span>
                    <span className="text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} fill={i < rev.rating ? 'currentColor' : 'none'} />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </section>

    </div>
  );
}
