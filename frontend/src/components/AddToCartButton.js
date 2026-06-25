'use client';

import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { Check } from 'lucide-react';

export default function AddToCartButton({ medicine, quantity = 1, className = "", children }) {
  const { addToCart } = useCart();
  const [status, setStatus] = useState('idle'); // 'idle' | 'adding' | 'added'

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    setStatus('adding');
    try {
      await addToCart(medicine, quantity);
      setStatus('added');
      setTimeout(() => setStatus('idle'), 1200);
    } catch (err) {
      setStatus('idle');
    }
  };

  return (
    <button
      onClick={handleAdd}
      disabled={status === 'adding'}
      className={`relative overflow-hidden transition-all duration-300 flex items-center justify-center active:scale-95 ${
        status === 'adding' ? 'cursor-not-allowed opacity-90' : ''
      } ${
        status === 'added' ? 'bg-pharmacy-600 hover:bg-pharmacy-700 text-white' : 'bg-medical-600 hover:bg-medical-700 text-white'
      } ${className}`}
    >
      {/* Idle Content: determines size of button */}
      <span className={`inline-flex items-center justify-center transition-all duration-300 ${
        status !== 'idle' ? 'opacity-0 scale-75 select-none pointer-events-none' : 'opacity-100 scale-100'
      }`}>
        {children || <span>Add to Cart</span>}
      </span>
      
      {/* Adding Overlay */}
      <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
        status === 'adding' ? 'opacity-100 scale-100' : 'opacity-0 scale-75 select-none pointer-events-none'
      }`}>
        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5 shrink-0"></span>
        <span className="whitespace-nowrap font-bold">Adding...</span>
      </span>
      
      {/* Added Overlay */}
      <span className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
        status === 'added' ? 'opacity-100 scale-100' : 'opacity-0 scale-75 select-none pointer-events-none'
      }`}>
        <Check size={14} className="mr-1.5 shrink-0 animate-bounce" />
        <span className="whitespace-nowrap font-bold">Added!</span>
      </span>
    </button>
  );
}
