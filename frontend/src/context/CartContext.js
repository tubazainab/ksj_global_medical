'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const CartProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [cart, setCart] = useState({ items: [] });
  const [wishlist, setWishlist] = useState({ medicines: [] });
  const [couponCode, setCouponCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);

  // Sync Cart and Wishlist when token or user changes
  useEffect(() => {
    const fetchCartAndWishlist = async () => {
      if (token && user) {
        try {
          const cartRes = await fetch(`${API_URL}/users/cart`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const cartData = await cartRes.json();
          if (cartData.success) setCart(cartData.data);

          const wishRes = await fetch(`${API_URL}/users/wishlist`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const wishData = await wishRes.json();
          if (wishData.success) setWishlist(wishData.data);
        } catch (err) {
          console.error('Error fetching cart/wishlist:', err);
        }
      } else {
        // Guest mode fallback local storage
        const localCart = localStorage.getItem('ksj-guest-cart');
        if (localCart) setCart(JSON.parse(localCart));
        const localWish = localStorage.getItem('ksj-guest-wish');
        if (localWish) setWishlist(JSON.parse(localWish));
      }
    };

    fetchCartAndWishlist();
  }, [token, user]);

  // Add / Update item in cart
  const addToCart = async (medicine, quantity = 1) => {
    if (token && user) {
      try {
        const res = await fetch(`${API_URL}/users/cart`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ medicineId: medicine._id, quantity })
        });
        const data = await res.json();
        if (data.success) {
          setCart(data.data);
        }
        return data;
      } catch (err) {
        console.error('Cart add error:', err);
        return { success: false, message: 'Cart server sync error' };
      }
    } else {
      // Guest local storage update
      const items = [...cart.items];
      const existIndex = items.findIndex(item => item.medicine._id === medicine._id);
      if (existIndex > -1) {
        items[existIndex].quantity = quantity;
      } else {
        items.push({ medicine, quantity });
      }
      const newCart = { items };
      setCart(newCart);
      localStorage.setItem('ksj-guest-cart', JSON.stringify(newCart));
      return { success: true, message: 'Item added to local cart' };
    }
  };

  // Remove item from cart
  const removeFromCart = async (medicineId) => {
    if (token && user) {
      try {
        const res = await fetch(`${API_URL}/users/cart/${medicineId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setCart(data.data);
        }
        return data;
      } catch (err) {
        console.error('Cart remove error:', err);
        return { success: false, message: 'Cart server sync error' };
      }
    } else {
      // Guest local storage remove
      const items = cart.items.filter(item => item.medicine._id !== medicineId);
      const newCart = { items };
      setCart(newCart);
      localStorage.setItem('ksj-guest-cart', JSON.stringify(newCart));
      return { success: true, message: 'Item removed from local cart' };
    }
  };

  // Toggle wishlist item
  const toggleWishlist = async (medicine) => {
    if (token && user) {
      try {
        const res = await fetch(`${API_URL}/users/wishlist`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ medicineId: medicine._id })
        });
        const data = await res.json();
        if (data.success) {
          const freshWish = await fetch(`${API_URL}/users/wishlist`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const freshData = await freshWish.json();
          if (freshData.success) setWishlist(freshData.data);
        }
        return data;
      } catch (err) {
        console.error('Wishlist toggle error:', err);
        return { success: false, message: 'Wishlist sync error' };
      }
    } else {
      // Guest local storage wishlist
      let medicines = [...wishlist.medicines];
      const existIndex = medicines.findIndex(m => m._id === medicine._id);
      let action = 'added';
      if (existIndex > -1) {
        medicines.splice(existIndex, 1);
        action = 'removed';
      } else {
        medicines.push(medicine);
      }
      const newWishlist = { medicines };
      setWishlist(newWishlist);
      localStorage.setItem('ksj-guest-wish', JSON.stringify(newWishlist));
      return { success: true, message: `Wishlist ${action} successfully`, action };
    }
  };

  // Apply discount coupon
  const applyCoupon = (code) => {
    if (code.toUpperCase() === 'WELCOME10') {
      setCouponCode('WELCOME10');
      setDiscountPercent(10);
      return { success: true, message: 'Coupon WELCOME10 (10% discount) applied!' };
    }
    return { success: false, message: 'Invalid coupon code.' };
  };

  // Totals calculations
  const subtotal = cart.items.reduce((sum, item) => {
    const price = item.medicine.discountPrice > 0 ? item.medicine.discountPrice : item.medicine.price;
    return sum + price * item.quantity;
  }, 0);

  const gst = parseFloat((subtotal * 0.12).toFixed(2));
  const shipping = subtotal === 0 ? 0 : (subtotal > 500 ? 0 : 50);
  const discount = parseFloat((subtotal * (discountPercent / 100)).toFixed(2));
  const grandTotal = parseFloat((subtotal + gst + shipping - discount).toFixed(2));

  const clearCartState = () => {
    setCart({ items: [] });
    setCouponCode('');
    setDiscountPercent(0);
    localStorage.removeItem('ksj-guest-cart');
  };

  return (
    <CartContext.Provider value={{
      cart,
      wishlist,
      couponCode,
      discountPercent,
      subtotal,
      gst,
      shipping,
      discount,
      grandTotal,
      addToCart,
      removeFromCart,
      toggleWishlist,
      applyCoupon,
      clearCartState
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
