'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import {
  ShoppingCart,
  Heart,
  User,
  Sun,
  Moon,
  Search,
  Menu,
  X,
  ChevronDown,
  Activity
} from 'lucide-react';

const CATEGORIES = [
  'Tablets',
  'Capsules',
  'Syrups',
  'Injections',
  'Vitamins & Supplements',
  'Diabetic Care',
  'Ayurvedic Medicines'
];

export default function Navbar() {
  const { user, employee, logout } = useAuth();
  const { cart, wishlist } = useCart();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();

  const [searchVal, setSearchVal] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [catMenuOpen, setCatMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const catMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (catMenuRef.current && !catMenuRef.current.contains(event.target)) {
        setCatMenuOpen(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/shop?keyword=${encodeURIComponent(searchVal.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const activeUser = user || employee;
  const isEmployee = !!employee;

  return (
    <nav className="sticky top-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo Section */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-medical-600 text-white p-2 rounded-lg shadow-md flex items-center justify-center">
                <Activity size={22} className="gradient-pulse" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-medical-800 dark:text-medical-400 block leading-none">
                  KSJ Global
                </span>
                <span className="text-xs font-medium text-pharmacy-600 dark:text-pharmacy-400 block mt-0.5">
                  Medical Store
                </span>
              </div>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 max-w-md mx-8 relative">
            <input
              type="text"
              placeholder="Search medicines, active ingredients, or brands..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
            <button type="submit" className="absolute right-3 text-slate-400 hover:text-medical-600">
              <Search size={18} />
            </button>
          </form>

          {/* Links and Actions - Desktop */}
          <div className="hidden lg:flex items-center space-x-6">
            
            {/* Category Dropdown */}
            <div className="relative" ref={catMenuRef}>
              <button
                onClick={() => setCatMenuOpen(!catMenuOpen)}
                className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-medical-600 focus:outline-none"
              >
                Categories <ChevronDown size={14} className="ml-1" />
              </button>
              {catMenuOpen && (
                <div className="absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    {CATEGORIES.map((cat) => (
                      <Link
                        key={cat}
                        href={`/shop?category=${encodeURIComponent(cat)}`}
                        onClick={() => setCatMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        {cat}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link href="/shop" className="text-sm font-medium text-slate-700 dark:text-slate-200 hover:text-medical-600">
              Browse Medicines
            </Link>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              title="Toggle Dark/Light Mode"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Wishlist */}
            {!isEmployee && (
              <Link href="/dashboard?tab=wishlist" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative">
                <Heart size={20} />
                {wishlist.medicines?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full text-xxs w-4 h-4 flex items-center justify-center font-bold">
                    {wishlist.medicines.length}
                  </span>
                )}
              </Link>
            )}

            {/* Cart */}
            {!isEmployee && (
              <Link href="/cart" className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative">
                <ShoppingCart size={20} />
                {cart.items?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pharmacy-600 text-white rounded-full text-xxs w-4 h-4 flex items-center justify-center font-bold">
                    {cart.items.reduce((acc, i) => acc + i.quantity, 0)}
                  </span>
                )}
              </Link>
            )}

            {/* User Session Menu */}
            {activeUser ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                  className="flex items-center space-x-2 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-medical-100 dark:bg-medical-900 text-medical-800 dark:text-medical-300 flex items-center justify-center font-bold">
                    {activeUser.name ? activeUser.name.charAt(0).toUpperCase() : ''}
                  </div>
                  <span className="hidden xl:inline">{activeUser.name ? activeUser.name.split(' ')[0] : ''}</span>
                  <ChevronDown size={14} />
                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 py-1 z-50">
                    <Link
                      href={isEmployee ? `/employee` : `/dashboard`}
                      onClick={() => setProfileMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      {isEmployee ? 'Employee Panel' : 'My Dashboard'}
                    </Link>
                    {isEmployee && employee.role === 'Admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setProfileMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={() => { setProfileMenuOpen(false); logout(); }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-medical-600 rounded-full hover:bg-medical-700 shadow-md transition-colors"
              >
                Sign In
              </Link>
            )}

          </div>

          {/* Mobile Hamburger menu toggle */}
          <div className="flex lg:hidden items-center space-x-3">
            <button onClick={toggleTheme} className="p-2 rounded-full text-slate-600 dark:text-slate-300">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-md text-slate-600 dark:text-slate-300">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-3">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-slate-400">
              <Search size={18} />
            </button>
          </form>

          <div className="space-y-1">
            <Link
              href="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              All Medicines
            </Link>
            <div className="pl-3 py-1 text-xs font-semibold text-slate-400 uppercase">Categories</div>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat}
                href={`/shop?category=${encodeURIComponent(cat)}`}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-6 py-1.5 text-sm rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {cat}
              </Link>
            ))}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-3">
            {activeUser ? (
              <div className="space-y-1">
                <div className="px-3 py-1.5 text-sm font-semibold text-slate-500">
                  Hi, {activeUser.name || ''}
                </div>
                <Link
                  href={isEmployee ? `/employee` : `/dashboard`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 text-base font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  My Dashboard
                </Link>
                {isEmployee && employee.role === 'Admin' && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 text-base font-medium rounded-md text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => { logout(); setMobileMenuOpen(false); }}
                  className="block w-full text-left px-3 py-2 text-base font-medium rounded-md text-red-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center px-4 py-2 font-medium text-white bg-medical-600 rounded-lg"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
