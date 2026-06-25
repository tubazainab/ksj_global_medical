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
  Plus
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

    } catch (err) {
      console.error('Error loading admin details:', err);
    }
  };

  useEffect(() => {
    if (token && employee && employee.role === 'Admin') {
      fetchAdminDetails();
    }
  }, [token, employee]);

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
          requiresPrescription: medRx
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
      } else {
        setMedError(data.message || 'Failed to add medicine.');
      }
    } catch (err) {
      setMedError('Connection error.');
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
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 lg:p-8 space-y-6 max-w-xl mx-auto">
          <h3 className="text-lg font-bold border-b pb-3 flex items-center">
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
                className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800"
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
                className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800"
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
                className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800"
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
                className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800"
                placeholder="E.g. Micro Labs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Category</label>
              <select
                value={medCategory}
                onChange={(e) => setMedCategory(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold"
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
                className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Stock Count</label>
              <input
                type="number"
                required
                value={medStock}
                onChange={(e) => setMedStock(Number(e.target.value))}
                className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-400">Expiry Date</label>
              <input
                type="date"
                required
                value={medExpiry}
                onChange={(e) => setMedExpiry(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center space-x-2.5 pt-4">
              <input
                type="checkbox"
                id="medRx"
                checked={medRx}
                onChange={(e) => setMedRx(e.target.checked)}
                className="h-4 w-4 rounded cursor-pointer accent-medical-600"
              />
              <label htmlFor="medRx" className="font-bold text-slate-700 dark:text-slate-300 cursor-pointer">Requires Prescription</label>
            </div>

            <div className="col-span-2 space-y-1">
              <label className="text-slate-400">Description</label>
              <textarea
                required
                rows="3"
                value={medDesc}
                onChange={(e) => setMedDesc(e.target.value)}
                className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800"
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
                  className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800"
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
                  className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800"
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
                  className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800"
                  placeholder="••••••••"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400">Employee Role</label>
                <select
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  className="w-full p-2.5 border rounded-lg bg-slate-50 dark:bg-slate-800 font-semibold"
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

    </div>
  );
}
