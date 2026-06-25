'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  TrendingUp,
  Package,
  Users,
  ShieldCheck,
  UserPlus,
  BarChart3,
  Calendar,
  AlertCircle,
  Activity,
  Plus,
  X,
  ClipboardList,
  Trash2,
  Search,
  ShoppingBag,
  Eye,
  Check,
  Truck,
  HeartPulse,
  MessageSquare,
  User
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const PERMISSIONS_LIST = [
  'manage_inventory',
  'update_orders',
  'view_reports',
  'manage_employees'
];

export default function AdminDashboard() {
  const { token, employee } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('analytics');

  // Metrics
  const [salesSummary, setSalesSummary] = useState([]);
  const [topMedicines, setTopMedicines] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [categories, setCategories] = useState([]);

  // Catalog inventory & orders list
  const [medicines, setMedicines] = useState([]);
  const [loadingMeds, setLoadingMeds] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Search & Filter states
  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('All');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Order update states
  const [orderCarrier, setOrderCarrier] = useState('');
  const [orderTrackingNumber, setOrderTrackingNumber] = useState('');

  // Chat Log states
  const [conversations, setConversations] = useState([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatSearchQuery, setChatSearchQuery] = useState('');

  // Form states - Add Medicine
  const [medName, setMedName] = useState('');
  const [medSku, setMedSku] = useState('');
  const [medGeneric, setMedGeneric] = useState('');
  const [medBrand, setMedBrand] = useState('');
  const [medDesc, setMedDesc] = useState('');
  const [medCategory, setMedCategory] = useState('');
  const [medPrice, setMedPrice] = useState(100);
  const [medStock, setMedStock] = useState(50);
  const [medExpiry, setMedExpiry] = useState('');
  const [medRx, setMedRx] = useState(false);
  const [medImage, setMedImage] = useState('');
  const [medError, setMedError] = useState('');
  const [medSuccess, setMedSuccess] = useState('');

  // Form states - Add Employee
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empPassword, setEmpPassword] = useState('');
  const [empRole, setEmpRole] = useState('Pharmacist');
  const [empPerms, setEmpPerms] = useState([]);
  const [empError, setEmpError] = useState('');
  const [empSuccess, setEmpSuccess] = useState('');

  useEffect(() => {
    if (!token || !employee || employee.role !== 'Admin') {
      router.push('/auth/login?redirect=/admin');
    }
  }, [token, employee]);

  const fetchAdminDetails = async () => {
    if (!token) return;
    try {
      // 1. Fetch categories
      const catRes = await fetch(`${API_URL}/categories`);
      const catData = await catRes.json();
      if (catData.success) {
        setCategories(catData.data);
        if (catData.data.length > 0) setMedCategory(catData.data[0]._id);
      }

      // 2. Fetch sales charts
      const salesRes = await fetch(`${API_URL}/reports/sales?timeframe=monthly`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const salesData = await salesRes.json();
      if (salesData.success) setSalesSummary(salesData.data);

      // 3. Fetch top sellers
      const topRes = await fetch(`${API_URL}/reports/top-selling`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const topData = await topRes.json();
      if (topData.success) setTopMedicines(topData.data);

      // 4. Fetch employee lists
      const empRes = await fetch(`${API_URL}/employees/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const empData = await empRes.json();
      if (empData.success) setEmployees(empData.data);

      // 5. Fetch all medicines for inventory
      setLoadingMeds(true);
      const medRes = await fetch(`${API_URL}/medicines?limit=1000`);
      const medData = await medRes.json();
      if (medData.success) setMedicines(medData.data);
      setLoadingMeds(false);

      // 6. Fetch all orders
      setLoadingOrders(true);
      const ordersRes = await fetch(`${API_URL}/orders/all`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordersData = await ordersRes.json();
      if (ordersData.success) setOrders(ordersData.data);
      setLoadingOrders(false);

      // 7. Fetch all chatbot conversations for logs
      setLoadingChats(true);
      const chatsRes = await fetch(`${API_URL}/chatbot/conversations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const chatsData = await chatsRes.json();
      if (chatsData.success) setConversations(chatsData.data);
      setLoadingChats(false);

    } catch (err) {
      console.error('Error loading admin details:', err);
      setLoadingMeds(false);
      setLoadingOrders(false);
      setLoadingChats(false);
    }
  };

  useEffect(() => {
    if (token && employee && employee.role === 'Admin') {
      fetchAdminDetails();
    }
  }, [token, employee]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setMedImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    setMedError('');
    setMedSuccess('');

    try {
      const res = await fetch(`${API_URL}/medicines`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: medName,
          sku: medSku,
          genericName: medGeneric,
          brand: medBrand,
          description: medDesc,
          category: medCategory,
          price: Number(medPrice),
          stock: Number(medStock),
          expiryDate: new Date(medExpiry),
          requiresPrescription: medRx,
          imageURIs: medImage ? [medImage] : []
        })
      });
      const data = await res.json();
      if (data.success) {
        setMedSuccess(`Medicine ${medName} created in catalog!`);
        setMedName('');
        setMedSku('');
        setMedGeneric('');
        setMedBrand('');
        setMedDesc('');
        setMedImage('');
        // Refresh medicines inventory list
        const freshMedsRes = await fetch(`${API_URL}/medicines?limit=1000`);
        const freshMedsData = await freshMedsRes.json();
        if (freshMedsData.success) setMedicines(freshMedsData.data);
      } else {
        setMedError(data.message || 'Failed to add medicine.');
      }
    } catch (err) {
      setMedError('Connection error.');
    }
  };

  const handleDeleteMedicine = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from the catalog?`)) {
      return;
    }
    try {
      const res = await fetch(`${API_URL}/medicines/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setMedSuccess(`Medicine "${name}" successfully deleted!`);
        // Refresh medicines
        const freshMedsRes = await fetch(`${API_URL}/medicines?limit=1000`);
        const freshMedsData = await freshMedsRes.json();
        if (freshMedsData.success) setMedicines(freshMedsData.data);
      } else {
        setMedError(data.message || 'Failed to delete medicine.');
      }
    } catch (err) {
      setMedError('Connection error deleting medicine.');
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus, carrier = '', trackingNumber = '') => {
    const comment = `Status updated to ${newStatus} by Admin`;
    try {
      const body = { orderStatus: newStatus, comment };
      if (carrier) body.carrier = carrier;
      if (trackingNumber) body.trackingNumber = trackingNumber;

      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        alert(`Order status updated to ${newStatus}`);
        // Refresh orders pipeline
        const ordersRes = await fetch(`${API_URL}/orders/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const ordersData = await ordersRes.json();
        if (ordersData.success) {
          setOrders(ordersData.data);
          // Update selectedOrder if open to show new status details
          const updated = ordersData.data.find(o => o._id === orderId);
          if (updated) setSelectedOrder(updated);
        }
      } else {
        alert(data.message || 'Failed to update order status.');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Connection error updating order status.');
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setEmpError('');
    setEmpSuccess('');

    try {
      const res = await fetch(`${API_URL}/auth/employee/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: empName,
          email: empEmail,
          password: empPassword,
          role: empRole,
          permissions: empPerms
        })
      });
      const data = await res.json();
      if (data.success) {
        setEmpSuccess(`Employee ${empName} onboarding complete with ID: ${data.employee.employeeId}`);
        setEmpName('');
        setEmpEmail('');
        setEmpPassword('');
        setEmpPerms([]);
        // Refresh employee list
        const freshEmp = await fetch(`${API_URL}/employees/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const freshData = await freshEmp.json();
        if (freshData.success) setEmployees(freshData.data);
      } else {
        setEmpError(data.message || 'Employee registration failed.');
      }
    } catch (err) {
      setEmpError('Connection error.');
    }
  };

  const handleToggleEmployeePerm = (perm) => {
    if (empPerms.includes(perm)) {
      setEmpPerms(empPerms.filter(p => p !== perm));
    } else {
      setEmpPerms([...empPerms, perm]);
    }
  };

  if (!employee || employee.role !== 'Admin') {
    return <div className="text-center py-20">Loading Admin Center...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left space-y-8">
      
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-md gap-4">
        <div>
          <span className="bg-medical-600 text-white px-3 py-1 rounded-full text-xxs font-bold uppercase tracking-wider">
            Enterprise Admin Portal
          </span>
          <h1 className="text-2xl font-black mt-2">KSJ Global Medical - Admin Dashboard</h1>
          <p className="text-xs text-slate-400 mt-1">Configure user accounts, medicine inventory registers, and employee permissions.</p>
        </div>

        <button
          onClick={() => router.push('/employee')}
          className="bg-medical-600 hover:bg-medical-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-md"
        >
          Access Staff Dashboard
        </button>
      </div>

      {/* Tabs list */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-fit text-xs font-semibold space-x-1">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'analytics' ? 'bg-white dark:bg-slate-700 shadow text-medical-800 dark:text-white' : 'text-slate-500'
          }`}
        >
          <BarChart3 size={14} className="inline mr-1" /> Revenue Reports
        </button>
        <button
          onClick={() => setActiveTab('medicine')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'medicine' ? 'bg-white dark:bg-slate-700 shadow text-medical-800 dark:text-white' : 'text-slate-500'
          }`}
        >
          <Package size={14} className="inline mr-1" /> Catalog Manager
        </button>
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'orders' ? 'bg-white dark:bg-slate-700 shadow text-medical-800 dark:text-white' : 'text-slate-500'
          }`}
        >
          <ShoppingBag size={14} className="inline mr-1" /> Manage Orders
        </button>
        <button
          onClick={() => setActiveTab('chats')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'chats' ? 'bg-white dark:bg-slate-700 shadow text-medical-800 dark:text-white' : 'text-slate-500'
          }`}
        >
          <MessageSquare size={14} className="inline mr-1" /> Chat Logs
        </button>
        <button
          onClick={() => setActiveTab('employee')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'employee' ? 'bg-white dark:bg-slate-700 shadow text-medical-800 dark:text-white' : 'text-slate-500'
          }`}
        >
          <Users size={14} className="inline mr-1" /> Staff Directory
        </button>
      </div>

      {/* TABS CONTENT */}
      
      {/* 1. ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          
          {/* Charts preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Monthly Revenue Trends</h3>
              {salesSummary.length === 0 ? (
                <p className="text-xs text-slate-500 py-10 text-center">No sales data recorded this month.</p>
              ) : (
                <div className="space-y-4">
                  {salesSummary.map((sum) => (
                    <div key={sum._id} className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-slate-800/40 pb-2">
                      <span className="font-bold">{sum._id}</span>
                      <span className="text-slate-500">Orders: {sum.orderCount}</span>
                      <span className="font-extrabold text-pharmacy-600">₹{sum.totalSales}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">Top-Selling Medicines</h3>
              {topMedicines.length === 0 ? (
                <p className="text-xs text-slate-500 py-10 text-center">Seeding data to configure charts...</p>
              ) : (
                <div className="space-y-4">
                  {topMedicines.map((med, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-slate-50 dark:border-slate-800/40 pb-2">
                      <span className="font-bold">{med.name}</span>
                      <span className="text-slate-500">Qty Sold: {med.totalQtySold}</span>
                      <span className="font-extrabold text-medical-600">₹{med.totalRevenue}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* 2. MEDICINE MANAGER */}
      {activeTab === 'medicine' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Add Medicine form on left */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 h-fit shadow-sm xl:col-span-1">
            <h3 className="text-base font-bold border-b pb-3 flex items-center">
              <Plus size={18} className="mr-1.5 text-medical-600" /> Add Medicine registers
            </h3>

            {medError && <p className="text-xs text-red-500 font-bold bg-red-50 p-2.5 rounded">{medError}</p>}
            {medSuccess && <p className="text-xs text-pharmacy-600 font-bold bg-pharmacy-50 p-2.5 rounded">{medSuccess}</p>}

            <form onSubmit={handleAddMedicine} className="grid grid-cols-2 gap-4 text-xs">
              <div className="col-span-2 space-y-1">
                <label className="text-slate-400">Medicine Name</label>
                <input
                  type="text"
                  required
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  placeholder="E.g. Paracetamol 650mg"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">SKU Code</label>
                <input
                  type="text"
                  required
                  value={medSku}
                  onChange={(e) => setMedSku(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  placeholder="E.g. MED-PARA-650"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Active Ingredient</label>
                <input
                  type="text"
                  required
                  value={medGeneric}
                  onChange={(e) => setMedGeneric(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  placeholder="E.g. Acetaminophen"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Brand Name</label>
                <input
                  type="text"
                  required
                  value={medBrand}
                  onChange={(e) => setMedBrand(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  placeholder="E.g. Micro Labs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Category</label>
                <select
                  value={medCategory}
                  onChange={(e) => setMedCategory(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500 font-semibold"
                >
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Price (INR)</label>
                <input
                  type="number"
                  required
                  value={medPrice}
                  onChange={(e) => setMedPrice(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Stock Count</label>
                <input
                  type="number"
                  required
                  value={medStock}
                  onChange={(e) => setMedStock(Number(e.target.value))}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={medExpiry}
                  onChange={(e) => setMedExpiry(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                />
              </div>

              <div className="flex items-center space-x-2.5 pt-4 col-span-2">
                <input
                  type="checkbox"
                  id="medRx"
                  checked={medRx}
                  onChange={(e) => setMedRx(e.target.checked)}
                  className="h-4 w-4 rounded cursor-pointer accent-medical-600"
                />
                <label htmlFor="medRx" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Requires Prescription</label>
              </div>

              <div className="col-span-2 space-y-1 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <label className="text-slate-400 font-bold block mb-1.5">Medicine Catalog Image</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-medical-50 file:text-medical-700 dark:file:bg-medical-950/40 dark:file:text-medical-300 hover:file:bg-medical-100 dark:hover:file:bg-medical-900 cursor-pointer"
                  />
                  {medImage && (
                    <div className="relative w-20 h-20 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                      <img src={medImage} alt="Preview" className="w-full h-full object-contain p-1" />
                      <button
                        type="button"
                        onClick={() => setMedImage('')}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 transition-colors shadow"
                        title="Remove image"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="col-span-2 space-y-1">
                <label className="text-slate-400">Description</label>
                <textarea
                  required
                  rows="3"
                  value={medDesc}
                  onChange={(e) => setMedDesc(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  placeholder="Product summary and clinical warnings..."
                />
              </div>

              <button
                type="submit"
                className="col-span-2 py-3 bg-medical-600 hover:bg-medical-700 text-white rounded-lg font-bold shadow-md transition-colors"
              >
                Add Medicine to Catalog
              </button>
            </form>
          </section>

          {/* Product Inventory details on right */}
          <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 xl:col-span-2 shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
              <h3 className="text-base font-bold flex items-center">
                <Package size={18} className="mr-1.5 text-medical-600" /> Product Inventory Details
              </h3>
              
              {/* Search input */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={medSearchQuery}
                  onChange={(e) => setMedSearchQuery(e.target.value)}
                  placeholder="Search inventory..."
                  className="pl-8 pr-3 py-1.5 w-full sm:w-56 text-xxs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500 font-semibold"
                />
              </div>
            </div>

            {loadingMeds ? (
              <p className="text-xs text-slate-500 py-10 text-center">Loading inventory list...</p>
            ) : medicines.length === 0 ? (
              <p className="text-xs text-slate-500 py-10 text-center">No medicines in catalog. Register your first item.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Product Info</th>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Price (INR)</th>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Stock Level</th>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rx</th>
                      <th className="px-4 py-3 text-center text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 bg-white dark:bg-slate-900">
                    {medicines
                      .filter(med => {
                        const q = medSearchQuery.toLowerCase();
                        return (
                          med.name.toLowerCase().includes(q) ||
                          med.sku.toLowerCase().includes(q) ||
                          med.brand.toLowerCase().includes(q) ||
                          (med.genericName && med.genericName.toLowerCase().includes(q))
                        );
                      })
                      .map((med) => {
                        const isLowStock = med.stock < 20 && med.stock > 0;
                        const isOutOfStock = med.stock === 0;
                        
                        return (
                          <tr key={med._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                                  {med.imageURIs && med.imageURIs[0] ? (
                                    <img src={med.imageURIs[0]} alt={med.name} className="w-full h-full object-contain p-0.5" />
                                  ) : (
                                    <HeartPulse size={16} className="text-slate-400" />
                                  )}
                                </div>
                                <div className="text-left">
                                  <div className="font-extrabold text-slate-800 dark:text-white line-clamp-1">{med.name}</div>
                                  <div className="text-[10px] text-slate-400 font-medium">SKU: {med.sku} | Brand: {med.brand}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-left">
                              <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider">
                                {med.category && med.category.name ? med.category.name : 'Unassigned'}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-left font-extrabold text-slate-900 dark:text-white">
                              ₹{med.price}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-left">
                              <div className="flex items-center space-x-1.5">
                                <span className={`w-2 h-2 rounded-full ${
                                  isOutOfStock ? 'bg-red-500' : isLowStock ? 'bg-amber-500' : 'bg-pharmacy-500'
                                }`} />
                                <span className={`text-[11px] font-black ${
                                  isOutOfStock ? 'text-red-600 dark:text-red-400' : isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-pharmacy-600 dark:text-pharmacy-400'
                                }`}>
                                  {med.stock} ({isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'})
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-left font-bold text-xxs">
                              {med.requiresPrescription ? (
                                <span className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded font-black border border-red-200/50">Rx Req</span>
                              ) : (
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">OTC</span>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleDeleteMedicine(med._id, med.name)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-lg transition-colors inline-block"
                                title="Delete product"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      )}

      {/* 3. STAFF DIRECTORY / EMPLOYEE ONBOARDING */}
      {activeTab === 'employee' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Onboarding Register */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold border-b pb-2 flex items-center">
              <UserPlus size={16} className="mr-1.5 text-pharmacy-600" /> Onboard Pharmacy Staff
            </h3>

            {empError && <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded">{empError}</p>}
            {empSuccess && <p className="text-xs text-pharmacy-600 font-bold bg-pharmacy-50 p-2 rounded">{empSuccess}</p>}

            <form onSubmit={handleAddEmployee} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400">Staff Full Name</label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  placeholder="E.g. Dr. Sarah Connor"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={empEmail}
                  onChange={(e) => setEmpEmail(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  placeholder="sarah@ksjmedical.com"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Password</label>
                <input
                  type="password"
                  required
                  value={empPassword}
                  onChange={(e) => setEmpPassword(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Employee Role</label>
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500 font-semibold"
                >
                  <option value="Manager">Manager</option>
                  <option value="Pharmacist">Pharmacist</option>
                  <option value="Inventory Manager">Inventory Manager</option>
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Delivery Coordinator">Delivery Coordinator</option>
                  <option value="Customer Support">Customer Support</option>
                </select>
              </div>

              {/* Checkboxes for permissions */}
              <div className="space-y-2 pt-2 border-t">
                <label className="text-slate-400 font-bold block">Access Scope Permissions</label>
                <div className="space-y-1.5">
                  {PERMISSIONS_LIST.map((perm) => (
                    <div key={perm} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`perm-${perm}`}
                        checked={empPerms.includes(perm)}
                        onChange={() => handleToggleEmployeePerm(perm)}
                        className="h-4 w-4 rounded cursor-pointer accent-medical-600"
                      />
                      <label htmlFor={`perm-${perm}`} className="text-xxs font-medium cursor-pointer uppercase tracking-wider">{perm.replace('_', ' ')}</label>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-pharmacy-600 hover:bg-pharmacy-700 text-white rounded-lg font-bold shadow-md transition-colors"
              >
                Register Staff Account
              </button>
            </form>
          </div>

          {/* Directory list */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold border-b pb-2">Active Staff Directory</h3>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1 no-scrollbar text-xs">
              {employees.map((emp) => (
                <div
                  key={emp._id}
                  className="border rounded-xl p-4 flex justify-between items-center hover:border-slate-300 transition-all"
                >
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{emp.name}</h4>
                    <span className="text-[10px] text-slate-400 font-medium block">ID: {emp.employeeId} | Role: <b>{emp.role}</b></span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {emp.permissions.map(p => (
                        <span key={p} className="bg-slate-100 dark:bg-slate-800 text-slate-500 rounded px-1.5 py-0.5 text-[9px] uppercase tracking-wider font-bold">
                          {p.split('_')[1]}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-right space-y-1.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black inline-block ${
                      emp.status === 'Active' ? 'bg-pharmacy-100 text-pharmacy-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {emp.status}
                    </span>

                    <button
                      onClick={async () => {
                        const newStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
                        const res = await fetch(`${API_URL}/employees/${emp._id}/status`, {
                          method: 'PUT',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                          },
                          body: JSON.stringify({ status: newStatus })
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert(`Employee status successfully toggled to: ${newStatus}`);
                          // Refresh list
                          const freshEmp = await fetch(`${API_URL}/employees/all`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                          });
                          const freshData = await freshEmp.json();
                          if (freshData.success) setEmployees(freshData.data);
                        }
                      }}
                      className="text-[10px] font-bold text-medical-600 hover:underline block"
                    >
                      Toggle Access
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 5. CUSTOMER CHAT LOGS */}
      {activeTab === 'chats' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chat Sessions Directory (Left Col) */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[600px]">
            <div className="border-b pb-3.5 mb-4">
              <h3 className="text-base font-bold flex items-center">
                <MessageSquare size={18} className="mr-1.5 text-medical-600" /> Chat Logs Directory
              </h3>
              <p className="text-[10px] text-slate-400 mt-1">Select a patient session to inspect dialogue log histories.</p>
            </div>

            {/* Local Search input */}
            <div className="relative mb-4 shrink-0">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={chatSearchQuery}
                onChange={(e) => setChatSearchQuery(e.target.value)}
                placeholder="Search by User or Session..."
                className="pl-8 pr-3 py-1.5 w-full text-xxs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500 font-semibold"
              />
            </div>

            {loadingChats ? (
              <p className="text-xs text-slate-500 text-center py-10">Loading chatbot logs...</p>
            ) : conversations.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-10">No chat sessions recorded yet.</p>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-2.5">
                {conversations
                  .filter(c => {
                    const q = chatSearchQuery.toLowerCase();
                    const matchesSession = c.sessionId.toLowerCase().includes(q);
                    const matchesUser = c.user && (
                      c.user.name.toLowerCase().includes(q) ||
                      c.user.email.toLowerCase().includes(q)
                    );
                    return matchesSession || matchesUser;
                  })
                  .map((chat) => {
                    const lastMsg = chat.messages[chat.messages.length - 1];
                    const isSelected = selectedChat && selectedChat._id === chat._id;
                    const formattedTime = new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                      <button
                        key={chat._id}
                        onClick={() => setSelectedChat(chat)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col space-y-1 hover:border-slate-350 ${
                          isSelected
                            ? 'bg-medical-50 border-medical-250 dark:bg-slate-800 dark:border-slate-700'
                            : 'border-slate-150 bg-white dark:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="font-extrabold text-slate-800 dark:text-white truncate max-w-[70%]">
                            {chat.user ? chat.user.name : 'Guest User'}
                          </span>
                          <span className="text-[9px] text-slate-400 shrink-0">{formattedTime}</span>
                        </div>
                        {chat.user && (
                          <span className="text-[10px] text-slate-450 dark:text-slate-400 truncate">{chat.user.email}</span>
                        )}
                        {!chat.user && (
                          <span className="text-[9px] text-slate-400 font-mono select-all uppercase">SESS: {chat.sessionId.substring(5)}</span>
                        )}
                        <p className="text-[10px] text-slate-500 line-clamp-1 italic pt-1 border-t border-slate-50 dark:border-slate-800/40">
                          {lastMsg ? lastMsg.text.replace(/⚠️.*?\*/g, '').substring(0, 50) : 'No messages'}
                        </p>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Dialogue Log Inspector (Right Col) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col h-[600px]">
            {selectedChat ? (
              <div className="flex flex-col h-full overflow-hidden text-xs">
                
                {/* Header */}
                <div className="border-b pb-3 mb-4 flex justify-between items-center shrink-0">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">
                      Session Inspector: {selectedChat.sessionId.substring(5)}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      User: <b>{selectedChat.user ? selectedChat.user.name : 'Guest Patient'}</b>
                      {selectedChat.user && ` | Email: ${selectedChat.user.email}`}
                    </p>
                  </div>
                  <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 rounded px-2 py-0.5 font-bold uppercase tracking-wider">
                    {selectedChat.messages.length} messages
                  </span>
                </div>

                {/* Dialog Messages list */}
                <div className="flex-1 overflow-y-auto pr-1 no-scrollbar space-y-4 p-2 bg-slate-50 dark:bg-slate-955/20 rounded-2xl border mb-2">
                  {selectedChat.messages.map((msg, idx) => {
                    const isUser = msg.sender === 'user';
                    return (
                      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex items-start space-x-2 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
                          
                          {/* Avatar icon */}
                          <div className={`p-1 rounded-full text-xxs flex items-center justify-center shrink-0 mt-0.5 ${
                            isUser ? 'bg-medical-100 text-medical-800' : 'bg-pharmacy-100 text-pharmacy-800'
                          }`}>
                            {isUser ? <User size={10} /> : <HeartPulse size={10} />}
                          </div>

                          {/* Message text bubble */}
                          <div className="text-left">
                            <div className={`p-3 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                              isUser
                                ? 'bg-medical-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/50 dark:border-slate-700/50'
                            }`}>
                              {msg.text}
                            </div>
                            <span className="block text-[8px] text-slate-400 text-right mt-0.5 font-medium">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3">
                <MessageSquare size={36} className="text-slate-300 animate-pulse" />
                <p className="text-xs font-semibold">Select a chat dialogue session from the directory list to inspect the logs.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* 4. ORDER PIPELINE MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6">
            
            {/* Filter controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
              <div>
                <h3 className="text-lg font-bold flex items-center">
                  <ShoppingBag size={20} className="mr-1.5 text-medical-600" /> Customer Order Pipeline
                </h3>
                <p className="text-xxs text-slate-400 mt-1">Review customer sales, update dispatch statuses, and register tracking information.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Search query */}
                <div className="relative shrink-0">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Search by ID or customer..."
                    className="pl-8 pr-3 py-1.5 w-full sm:w-56 text-xxs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500 font-semibold"
                  />
                </div>

                {/* Status selector filter */}
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1.5 rounded-xl text-xxs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500 font-semibold"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>
            </div>

            {/* Loading / Empty states */}
            {loadingOrders ? (
              <p className="text-xs text-slate-500 py-10 text-center">Loading orders queue...</p>
            ) : orders.length === 0 ? (
              <p className="text-xs text-slate-500 py-10 text-center">No orders record found in database.</p>
            ) : (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/60">
                    <tr>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order ID & Placed</th>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</th>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Items Summary</th>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payment Status</th>
                      <th className="px-4 py-3 text-left text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Order Status</th>
                      <th className="px-4 py-3 text-center text-xxs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 bg-white dark:bg-slate-900 text-xs">
                    {orders
                      .filter(ord => {
                        const matchesSearch =
                          ord.orderId.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
                          (ord.customer && ord.customer.name.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
                          (ord.customer && ord.customer.email.toLowerCase().includes(orderSearchQuery.toLowerCase()));
                        const matchesStatus = orderStatusFilter === 'All' || ord.orderStatus === orderStatusFilter;
                        return matchesSearch && matchesStatus;
                      })
                      .map((ord) => {
                        const totalQty = ord.items.reduce((acc, it) => acc + it.quantity, 0);
                        const displayItems = ord.items.map(it => `${it.name} (x${it.quantity})`).join(', ');

                        return (
                          <tr key={ord._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="font-extrabold text-slate-850 dark:text-white uppercase">{ord.orderId}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{new Date(ord.createdAt).toLocaleString()}</div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-left">
                              <div className="font-bold text-slate-800 dark:text-slate-200">{ord.customer ? ord.customer.name : 'Guest User'}</div>
                              <div className="text-[10px] text-slate-450 dark:text-slate-400">{ord.customer ? ord.customer.email : ''}</div>
                            </td>
                            <td className="px-4 py-3 max-w-[200px] truncate text-left" title={displayItems}>
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{displayItems}</span>
                              <span className="block text-[10px] text-slate-400">{totalQty} items total</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-left font-extrabold text-slate-900 dark:text-white">
                              ₹{ord.totals.grandTotal}
                              <span className="block text-[9px] text-slate-400 font-normal">Method: {ord.paymentMethod}</span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-left">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black inline-block ${
                                ord.paymentStatus === 'Paid' ? 'bg-pharmacy-100 text-pharmacy-850 dark:bg-pharmacy-950/40 dark:text-pharmacy-400 border border-pharmacy-200/50' : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-400 border border-red-200/50'
                              }`}>
                                {ord.paymentStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-left">
                              <select
                                value={ord.orderStatus}
                                onChange={(e) => handleUpdateOrderStatus(ord._id, e.target.value)}
                                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1.5 rounded-lg text-xxs font-extrabold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500 font-semibold"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                                <option value="Returned">Returned</option>
                              </select>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Eye details view */}
                                <button
                                  onClick={() => {
                                    setSelectedOrder(ord);
                                    setOrderCarrier(ord.trackingDetails?.carrier || 'KSJ Delivery Partner');
                                    setOrderTrackingNumber(ord.trackingDetails?.trackingNumber || '');
                                  }}
                                  className="text-medical-600 hover:text-medical-800 hover:bg-medical-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
                                  title="View Order Details"
                                >
                                  <Eye size={15} />
                                </button>

                                {/* Quick Mark as Delivered */}
                                {ord.orderStatus !== 'Delivered' && ord.orderStatus !== 'Cancelled' && (
                                  <button
                                    onClick={() => handleUpdateOrderStatus(ord._id, 'Delivered')}
                                    className="text-pharmacy-600 hover:text-pharmacy-800 hover:bg-pharmacy-50 dark:hover:bg-slate-800 p-1.5 rounded-lg transition-colors"
                                    title="Quick Deliver"
                                  >
                                    <Check size={15} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Selected Order Detail Modal Drawer */}
          {selectedOrder && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto text-left border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-350">
                
                {/* Close button */}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="border-b pb-4 flex items-center justify-between">
                  <div>
                    <span className="bg-medical-50 dark:bg-medical-950/40 text-medical-700 dark:text-medical-300 font-bold px-2 py-0.5 rounded uppercase tracking-wider text-[10px]">
                      Order Record
                    </span>
                    <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1 uppercase">ID: {selectedOrder.orderId}</h2>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xxs font-black tracking-wide border uppercase ${
                    selectedOrder.orderStatus === 'Delivered'
                      ? 'bg-pharmacy-100 border-pharmacy-250 text-pharmacy-800 dark:bg-pharmacy-950/40 dark:text-pharmacy-400'
                      : 'bg-amber-100 border-amber-250 text-amber-850 dark:bg-amber-950/40 dark:text-amber-400'
                  }`}>
                    {selectedOrder.orderStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Left Column: Customer & Delivery Details */}
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-850/20 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-[13px] border-b pb-1.5 flex items-center">
                        <Users size={14} className="mr-1 text-slate-500" /> Customer Information
                      </h4>
                      <div className="grid grid-cols-3 gap-y-1">
                        <span className="text-slate-455">Name:</span>
                        <span className="col-span-2 font-bold text-slate-900 dark:text-white">{selectedOrder.customer?.name || 'Guest User'}</span>
                        <span className="text-slate-455">Email:</span>
                        <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200 break-all">{selectedOrder.customer?.email || 'N/A'}</span>
                        <span className="text-slate-455">Phone:</span>
                        <span className="col-span-2 font-semibold text-slate-855 dark:text-slate-350">{selectedOrder.shippingAddress?.phone || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-850/20 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-[13px] border-b pb-1.5 flex items-center">
                        <Truck size={14} className="mr-1 text-slate-500" /> Delivery Address
                      </h4>
                      <p className="font-medium text-slate-800 dark:text-slate-300">
                        {selectedOrder.shippingAddress?.streetAddress || 'N/A'}<br />
                        {selectedOrder.shippingAddress?.city || 'N/A'}, {selectedOrder.shippingAddress?.state || 'N/A'}<br />
                        Postal Code: <b>{selectedOrder.shippingAddress?.postalCode || 'N/A'}</b><br />
                        Country: <b>{selectedOrder.shippingAddress?.country || 'India'}</b>
                      </p>
                    </div>

                    {/* Order Status Timeline Log */}
                    <div className="bg-slate-50 dark:bg-slate-855/20 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl space-y-2">
                      <h4 className="font-bold text-slate-900 dark:text-white text-[13px] border-b pb-1.5">
                        Status Log History
                      </h4>
                      <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 no-scrollbar text-xxs">
                        {selectedOrder.trackingDetails?.statusUpdates?.map((upd, idx) => (
                          <div key={idx} className="border-l-2 border-medical-500 pl-2 py-0.5">
                            <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                              <span>{upd.status}</span>
                              <span className="text-slate-400 font-normal">{new Date(upd.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-500 italic">{upd.comment}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Order Items, Totals & Tracking Form */}
                  <div className="space-y-4">
                    
                    {/* Items table */}
                    <div className="border border-slate-250 dark:border-slate-800 rounded-2xl overflow-hidden">
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 font-bold border-b dark:border-slate-800 text-[13px] flex items-center">
                        Items Ordered
                      </div>
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/40 max-h-[160px] overflow-y-auto no-scrollbar">
                        {selectedOrder.items.map((item, idx) => (
                          <div key={idx} className="p-2.5 flex justify-between items-center bg-white dark:bg-slate-900">
                            <div>
                              <p className="font-bold text-slate-800 dark:text-slate-200">{item.name}</p>
                              <p className="text-[10px] text-slate-400">Qty: {item.quantity} x ₹{item.price}</p>
                            </div>
                            <span className="font-extrabold text-slate-955 dark:text-white">₹{item.quantity * item.price}</span>
                          </div>
                        ))}
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 font-bold border-t dark:border-slate-800 text-right space-y-1">
                        <div className="flex justify-between text-xxs font-normal text-slate-500">
                          <span>Subtotal</span>
                          <span>₹{selectedOrder.totals?.subtotal}</span>
                        </div>
                        <div className="flex justify-between text-xxs font-normal text-slate-500">
                          <span>GST (18%)</span>
                          <span>₹{selectedOrder.totals?.gst}</span>
                        </div>
                        <div className="flex justify-between text-xxs font-normal text-slate-500">
                          <span>Shipping</span>
                          <span>₹{selectedOrder.totals?.shipping}</span>
                        </div>
                        <div className="flex justify-between text-slate-900 dark:text-white text-[13px] font-black pt-1 border-t border-dashed">
                          <span>Grand Total</span>
                          <span className="text-medical-600 dark:text-medical-455">₹{selectedOrder.totals?.grandTotal}</span>
                        </div>
                      </div>
                    </div>

                    {/* Dispatch & Dispatch Partner Details Form */}
                    <div className="bg-slate-50 dark:bg-slate-850/20 border border-slate-150 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                      <h4 className="font-bold text-slate-900 dark:text-white text-[13px] border-b pb-1.5 flex items-center">
                        <Truck size={14} className="mr-1 text-slate-500" /> Dispatch & Tracking Details
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-slate-400 font-bold block">Delivery Carrier</label>
                          <input
                            type="text"
                            value={orderCarrier}
                            onChange={(e) => setOrderCarrier(e.target.value)}
                            className="w-full p-2 border border-slate-350 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                            placeholder="E.g. BlueDart / Delhivery"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-slate-400 font-bold block">Tracking Number</label>
                          <input
                            type="text"
                            value={orderTrackingNumber}
                            onChange={(e) => setOrderTrackingNumber(e.target.value)}
                            className="w-full p-2 border border-slate-350 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-medical-500"
                            placeholder="E.g. KD817482"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1.5">
                        <button
                          onClick={() => handleUpdateOrderStatus(selectedOrder._id, 'Shipped', orderCarrier, orderTrackingNumber)}
                          className="flex-1 py-2 bg-slate-900 hover:bg-slate-950 text-white dark:bg-slate-700 dark:hover:bg-slate-650 rounded-lg font-bold shadow-md transition-colors"
                        >
                          Mark as Shipped
                        </button>
                        <button
                          onClick={() => handleUpdateOrderStatus(selectedOrder._id, 'Delivered', orderCarrier, orderTrackingNumber)}
                          className="flex-1 py-2 bg-pharmacy-600 hover:bg-pharmacy-700 text-white rounded-lg font-bold shadow-md transition-colors"
                        >
                          Mark as Delivered
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-450 text-center italic">Updating tracking details will automatically send status update notifications to the client.</p>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
