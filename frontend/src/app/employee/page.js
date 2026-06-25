'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  Briefcase,
  Layers,
  ClipboardList,
  RefreshCw,
  AlertTriangle,
  ShoppingCart,
  UserCheck,
  CheckSquare
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function EmployeeDashboard() {
  const { token, employee, logout } = useAuth();
  const router = useRouter();

  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Task states
  const [tasks, setTasks] = useState([]);

  // Order management queue
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Inventory warnings
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    if (!token || !employee) {
      router.push('/auth/login?redirect=/employee');
    }
  }, [token, employee]);

  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      // 1. Fetch dashboard metrics
      const metricRes = await fetch(`${API_URL}/employees/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const mData = await metricRes.json();
      if (mData.success) {
        setMetrics(mData.data);
        setTasks(mData.data.tasks || []);
      }

      // 2. Fetch order queues (for order/sales coordination roles)
      const rolesWithOrders = ['Admin', 'Manager', 'Sales Executive', 'Delivery Coordinator', 'Pharmacist'];
      if (employee && rolesWithOrders.includes(employee.role)) {
        setLoadingOrders(true);
        const orderRes = await fetch(`${API_URL}/orders/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const oData = await orderRes.json();
        if (oData.success) {
          setOrders(oData.data);
        }
        setLoadingOrders(false);
      }

      // 3. Fetch low stock items (for inventory roles)
      const rolesWithInventory = ['Admin', 'Manager', 'Inventory Manager', 'Pharmacist'];
      if (employee && rolesWithInventory.includes(employee.role)) {
        const stockRes = await fetch(`${API_URL}/medicines/alerts/low-stock`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const sData = await stockRes.json();
        if (sData.success) {
          setLowStockItems(sData.data);
        }
      }
    } catch (err) {
      console.error('Error fetching employee dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && employee) {
      fetchDashboardData();
    }
  }, [token, employee]);

  const handleUpdateTaskStatus = async (taskId, newStatus) => {
    try {
      const res = await fetch(`${API_URL}/employees/tasks/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ taskId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const comment = `Status updated by ${employee.role} ${employee.name}`;
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ orderStatus: newStatus, comment })
      });
      const data = await res.json();
      if (data.success) {
        alert('Order status successfully updated.');
        // Refresh orders queue
        const orderRes = await fetch(`${API_URL}/orders/all`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const oData = await orderRes.json();
        if (oData.success) setOrders(oData.data);
      }
    } catch (err) {
      console.error('Error updating order status:', err);
    }
  };

  if (!employee || loading) {
    return <div className="text-center py-20">Loading Employee Dashboard...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-left space-y-8">
      
      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-medical-800 to-pharmacy-800 text-white rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row justify-between items-start md:items-center shadow-lg gap-4">
        <div>
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xxs font-bold uppercase tracking-wider">
            {employee.role} Account
          </span>
          <h1 className="text-2xl font-black mt-2">Welcome Back, {employee.name}</h1>
          <p className="text-xs text-slate-200 mt-1">ID: <b>{employee.employeeId}</b> | Status: Active | Rating: ★{employee.performanceRating || '5.0'}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchDashboardData}
            className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl flex items-center justify-center transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Grid Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Col 1 & 2: Main queues depending on roles */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Order Queue Management (Sales, Delivery, Pharmacists, Admins) */}
          {orders.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold flex items-center border-b pb-3">
                <ShoppingCart size={18} className="mr-1.5 text-medical-600" /> Incoming Order Pipeline
              </h3>

              {loadingOrders ? (
                <p className="text-xs text-slate-500">Updating pipeline list...</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 no-scrollbar text-xs">
                  {orders.map((ord) => (
                    <div
                      key={ord._id}
                      className="border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:border-slate-300 transition-colors gap-3"
                    >
                      <div>
                        <div className="font-bold flex items-center">
                          <span className="uppercase text-slate-900 dark:text-white mr-2">{ord.orderId}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            ord.orderStatus === 'Delivered' ? 'bg-pharmacy-100 text-pharmacy-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.orderStatus}
                          </span>
                        </div>
                        <p className="text-xxs text-slate-400 mt-1">Placed: {new Date(ord.createdAt).toLocaleDateString()}</p>
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                          Items: {ord.items.map(it => `${it.name} (x${it.quantity})`).join(', ')}
                        </p>
                      </div>

                      {/* Status select controllers */}
                      <div className="flex items-center space-x-2">
                        <select
                          value={ord.orderStatus}
                          onChange={(e) => handleUpdateOrderStatus(ord._id, e.target.value)}
                          className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 p-1.5 rounded-lg text-xxs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-medical-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Low Stock Alerts (Inventory, Managers, Admins) */}
          {lowStockItems.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <h3 className="text-lg font-bold flex items-center text-red-500 border-b pb-3">
                <AlertTriangle size={18} className="mr-1.5 text-red-500 animate-pulse" /> Low Inventory Alerts
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {lowStockItems.map((med) => (
                  <div
                    key={med._id}
                    className="border border-red-200/50 bg-red-50/10 rounded-xl p-3 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">{med.name}</h4>
                      <p className="text-xxs text-slate-400">SKU: {med.sku}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-red-500 font-extrabold block">Stock: {med.stock}</span>
                      <span className="text-slate-400 text-xxs block">Min Limit: {med.minStockLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Col 3: Task Lists assigned to current employee */}
        <div className="space-y-6">
          
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center border-b pb-3">
              <ClipboardList size={18} className="mr-1.5 text-pharmacy-600" /> Assigned Task List
            </h3>

            {tasks.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No tasks assigned to your employee account.</p>
            ) : (
              <div className="space-y-3.5 text-xs">
                {tasks.map((task) => (
                  <div
                    key={task._id}
                    className={`p-3 rounded-xl border transition-colors ${
                      task.status === 'Completed'
                        ? 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/40 dark:border-slate-800'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold line-clamp-1">{task.title}</h4>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        task.status === 'Completed' ? 'bg-pharmacy-100 text-pharmacy-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    
                    <p className="text-xxs text-slate-500 mt-1.5">{task.description}</p>
                    {task.deadline && (
                      <p className="text-[10px] text-red-500 font-semibold mt-1">Deadline: {new Date(task.deadline).toLocaleDateString()}</p>
                    )}

                    {task.status !== 'Completed' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleUpdateTaskStatus(task._id, 'In Progress')}
                          className="bg-medical-50 text-medical-800 text-xxs font-bold px-2.5 py-1 rounded"
                        >
                          Start Work
                        </button>
                        <button
                          onClick={() => handleUpdateTaskStatus(task._id, 'Completed')}
                          className="bg-pharmacy-600 text-white text-xxs font-bold px-2.5 py-1 rounded flex items-center"
                        >
                          <CheckSquare size={12} className="mr-1" /> Mark Done
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
