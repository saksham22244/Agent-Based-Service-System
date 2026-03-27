'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { FaWallet, FaRegMoneyBillAlt, FaChartLine, FaCalendarCheck } from 'react-icons/fa';

export default function PaymentHistoryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvedApplications, setApprovedApplications] = useState([]);
  const [servicesMap, setServicesMap] = useState({});
  const [agentData, setAgentData] = useState({});

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        router.push('/login');
        return;
      }
      
      const userData = JSON.parse(userStr);
      setCurrentUser(userData);

      // Fetch Applications, Services, and Agent Details concurrently
      const [appsRes, servicesRes, agentsRes] = await Promise.all([
        fetch(`/api/applications?agentId=${userData.id}`).then(r => r.json()),
        fetch('/api/admin/services').then(r => r.json()),
        fetch('/api/agents').then(r => r.json())
      ]);

      // Service lookup map for getting price & name
      const sMap = {};
      (servicesRes.services || []).forEach(s => { sMap[s.id] = s; });
      setServicesMap(sMap);

      // Identify the agent specifically
      const agentObj = (agentsRes || []).find(a => a.id === userData.id) || {};
      setAgentData(agentObj);

      // Only count "approved" (completed jobs where payment is finalized)
      const completedApps = (appsRes || []).filter(app => app.status === 'approved');
      
      // Sort newest top
      completedApps.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      setApprovedApplications(completedApps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalEarnings = () => {
    let total = 0;
    approvedApplications.forEach(app => {
      const price = parseFloat(servicesMap[app.serviceId]?.price) || 0;
      total += price * 0.8;
    });
    return total;
  };

  const totalEarnings = calculateTotalEarnings();

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto w-full">
        {/* Header Ribbon */}
        <div className="h-1 bg-gradient-to-r from-blue-600 to-indigo-700 flex-shrink-0"></div>
        <div className="bg-white px-8 py-6 border-b flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-wide">Earnings Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">Track your completed services and financial history.</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 max-w-6xl mx-auto w-full space-y-8">
          
          {loading ? (
             <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
          ) : (
            <>
              {/* Financial Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 
                 {/* Total Earnings Card */}
                 <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 shadow-lg shadow-green-500/20 text-white flex flex-col justify-between transform transition hover:-translate-y-1">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="text-green-100 font-semibold text-sm uppercase tracking-wider mb-1">Total Earnings</p>
                        <h3 className="text-4xl font-black">Rs. {totalEarnings.toFixed(2)}</h3>
                      </div>
                      <div className="bg-white/20 p-3 rounded-full border border-white/30 backdrop-blur-sm">
                        <FaWallet size={24} />
                      </div>
                   </div>
                   <p className="text-xs text-green-100 font-medium">Accumulated from 80% commission share</p>
                 </div>

                 {/* eSewa Details Card */}
                 <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 shadow-lg shadow-blue-600/20 text-white flex flex-col justify-between transform transition hover:-translate-y-1 md:col-span-2">
                   <div className="flex justify-between items-start">
                      <div>
                        <p className="text-blue-100 font-semibold text-sm uppercase tracking-wider mb-2">Active Payout Account</p>
                        <div className="flex items-center gap-3">
                          <span className="bg-white/20 font-mono text-xl tracking-widest px-4 py-1.5 rounded-lg border border-white/30 backdrop-blur-sm shadow-inner">
                            {agentData.paymentDetails || 'NOT CONFIGURED'}
                          </span>
                        </div>
                      </div>
                      <div className="bg-white/20 p-3 rounded-full border border-white/30 backdrop-blur-sm">
                        <FaRegMoneyBillAlt size={24} />
                      </div>
                   </div>
                   <p className="text-xs text-blue-100 font-medium mt-6">
                     This is the verified eSewa account the system expects the admin to transfer payouts into.
                   </p>
                 </div>
              </div>

              {/* Transactions List */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                 <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-800 tracking-wide flex items-center gap-2">
                      <FaChartLine className="text-blue-600" /> Payment History Log
                    </h3>
                    <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-full border border-blue-200">
                      {approvedApplications.length} Completed Tasks
                    </span>
                 </div>
                 
                 {approvedApplications.length === 0 ? (
                   <div className="p-12 text-center text-gray-500">
                     <p className="text-lg font-medium text-gray-600 mb-1">No completed jobs yet.</p>
                     <p className="text-sm">Approve a service application to see your generated earnings here!</p>
                   </div>
                 ) : (
                   <div className="overflow-x-auto">
                     <table className="w-full text-left border-collapse">
                       <thead>
                         <tr className="bg-gray-50 border-b border-gray-200">
                           <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date & Time</th>
                           <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Service Task</th>
                           <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Gross Amount</th>
                           <th className="px-6 py-4 text-xs font-semibold text-green-600 uppercase tracking-wider">Your Cut (80%)</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100">
                         {approvedApplications.map(app => {
                           const svc = servicesMap[app.serviceId] || {};
                           const price = parseFloat(svc.price) || 0;
                           const cut = price * 0.8;
                           
                           return (
                             <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                               <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                     <FaCalendarCheck className="text-green-500 opacity-70" />
                                     <div>
                                        <div className="text-sm font-bold text-gray-800">{new Date(app.updatedAt || app.createdAt).toLocaleDateString()}</div>
                                        <div className="text-xs text-gray-500">{new Date(app.updatedAt || app.createdAt).toLocaleTimeString()}</div>
                                     </div>
                                  </div>
                               </td>
                               <td className="px-6 py-4 text-sm font-semibold text-blue-700">
                                 {svc.name || 'Unknown Service'}
                               </td>
                               <td className="px-6 py-4 text-sm font-medium text-gray-600">
                                 Rs. {price.toFixed(2)}
                               </td>
                               <td className="px-6 py-4">
                                 <span className="bg-green-50 text-green-700 border border-green-200 font-bold px-3 py-1 rounded-full shadow-sm text-sm">
                                   + Rs. {cut.toFixed(2)}
                                 </span>
                               </td>
                             </tr>
                           );
                         })}
                       </tbody>
                     </table>
                   </div>
                 )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
