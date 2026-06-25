'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import AddToCartButton from '../../components/AddToCartButton';
import { Search, SlidersHorizontal, Heart, HeartPulse, ShieldAlert } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const CATEGORIES = [
  'Tablets',
  'Capsules',
  'Syrups',
  'Injections',
  'Vitamins & Supplements',
  'Diabetic Care',
  'Ayurvedic Medicines'
];

function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToCart, wishlist, toggleWishlist } = useCart();

  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  // States for search and filter inputs
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [priceMax, setPriceMax] = useState(1000);
  const [onlyPrescription, setOnlyPrescription] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // React to URL parameter updates
  useEffect(() => {
    setKeyword(searchParams.get('keyword') || '');
    setSelectedCategory(searchParams.get('category') || '');
    setCurrentPage(1);
  }, [searchParams]);

  // Fetch medicines whenever search inputs or pages change
  useEffect(() => {
    const fetchFilteredMedicines = async () => {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (keyword) queryParams.append('keyword', keyword);
        if (selectedCategory) queryParams.append('category', selectedCategory);
        if (priceMax) queryParams.append('priceMax', priceMax);
        if (onlyPrescription) queryParams.append('requiresPrescription', 'true');

        const skip = (currentPage - 1) * itemsPerPage;
        queryParams.append('limit', itemsPerPage);
        queryParams.append('skip', skip);

        const res = await fetch(`${API_URL}/medicines?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success) {
          setMedicines(data.data);
          setTotalItems(data.total || 0);
        }
      } catch (err) {
        console.error('Error fetching filtered medicines:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredMedicines();
  }, [keyword, selectedCategory, priceMax, onlyPrescription, currentPage]);

  const handleClearFilters = () => {
    setKeyword('');
    setSelectedCategory('');
    setPriceMax(1000);
    setOnlyPrescription(false);
    router.push('/shop');
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Side: Sidebar Filters */}
        <aside className="w-full lg:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 h-fit shrink-0 space-y-6 text-left">
          
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <span className="font-bold flex items-center text-slate-800 dark:text-white">
              <SlidersHorizontal size={16} className="mr-2" /> Filters
            </span>
            <button onClick={handleClearFilters} className="text-xs text-medical-600 hover:text-medical-700 font-semibold">
              Clear All
            </button>
          </div>

          {/* Search Box */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Search Keywords</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Name or active ingredient..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-3 pr-8 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
              />
              <Search size={14} className="absolute right-3 top-2.5 text-slate-400" />
            </div>
          </div>

          {/* Categories select list */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Category</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
                  className={`w-full text-left px-2.5 py-1.5 text-xs rounded transition-colors ${
                    selectedCategory === cat
                      ? 'bg-medical-600 text-white font-semibold'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="font-bold uppercase tracking-wider text-slate-400">Max Price</label>
              <span className="font-semibold text-slate-700 dark:text-slate-300">₹{priceMax}</span>
            </div>
            <input
              type="range"
              min="10"
              max="1500"
              step="10"
              value={priceMax}
              onChange={(e) => setPriceMax(Number(e.target.value))}
              className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-medical-600"
            />
          </div>

          {/* Prescription Required Checklist */}
          <div className="flex items-center space-x-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <input
              type="checkbox"
              id="prescription"
              checked={onlyPrescription}
              onChange={(e) => setOnlyPrescription(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-medical-600 focus:ring-medical-500 cursor-pointer bg-white dark:bg-slate-800"
            />
            <label htmlFor="prescription" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Prescription Required Only
            </label>
          </div>

        </aside>

        {/* Right Side: Catalog grid list */}
        <section className="flex-grow space-y-6">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">
              Showing <b className="text-slate-800 dark:text-white">{medicines.length}</b> of {totalItems} items
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse bg-slate-200 dark:bg-slate-800 h-80 rounded-2xl"></div>
              ))}
            </div>
          ) : medicines.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
              <ShieldAlert size={48} className="mx-auto text-amber-500" />
              <h3 className="text-lg font-bold">No Medicines Found</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                We couldn't find matches for your search. Try resetting the filters or typing a generic brand.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {medicines.map((med) => {
                  const inWishlist = wishlist.medicines?.some(m => m._id === med._id);
                  const activePrice = med.discountPrice > 0 ? med.discountPrice : med.price;

                  return (
                    <div
                      key={med._id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:shadow-lg transition-shadow relative text-left"
                    >
                      {/* prescription sticker */}
                      {med.requiresPrescription && (
                        <span className="absolute top-4 left-4 bg-amber-500 text-white rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider z-10">
                          Prescription Rx
                        </span>
                      )}

                      {/* Wishlist toggle */}
                      <button
                        onClick={() => toggleWishlist(med)}
                        className={`absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:scale-105 transition-transform z-10 ${
                          inWishlist ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'
                        }`}
                      >
                        <Heart size={16} fill={inWishlist ? 'currentColor' : 'none'} />
                      </button>

                      <Link href={`/product/${med._id}`} className="group block mb-4">
                        <div className="h-40 w-full bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 group-hover:opacity-95 transition-opacity">
                          <HeartPulse size={48} className="text-medical-600/30" />
                        </div>
                        <span className="text-[10px] font-bold text-pharmacy-600 uppercase tracking-wider block mt-2">
                          {med.brand}
                        </span>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-white line-clamp-1 group-hover:text-medical-600 transition-colors">
                          {med.name}
                        </h4>
                        <p className="text-[11px] text-slate-400">Generic: {med.genericName}</p>
                      </Link>

                      <div className="space-y-3">
                        {/* Expiry alerts */}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="text-slate-400">Exp: {new Date(med.expiryDate).toLocaleDateString()}</span>
                          {med.stock <= med.minStockLevel ? (
                            <span className="text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 px-1.5 rounded">Low Stock</span>
                          ) : (
                            <span className="text-pharmacy-600 font-semibold bg-pharmacy-50 dark:bg-pharmacy-950/20 px-1.5 rounded">In Stock</span>
                          )}
                        </div>

                        {/* Price & Add triggers */}
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                          <div>
                            {med.discountPrice > 0 ? (
                              <div className="flex items-baseline space-x-1.5">
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
                            className="text-xs font-semibold px-3.5 py-1.5 rounded-full shadow-sm hover:scale-102 transition-transform"
                          />
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>

              {/* Pagination triggers */}
              {totalPages > 1 && (
                <div className="flex justify-center space-x-2 pt-8">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handlePageChange(index + 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        currentPage === index + 1
                          ? 'bg-medical-600 text-white'
                          : 'border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-3.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

        </section>

      </div>
    </div>
  );
}

export default function Shop() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading Shop Catalog...</div>}>
      <ShopContent />
    </Suspense>
  );
}
