'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaCheckCircle, FaClock, FaDollarSign, FaTasks } from 'react-icons/fa';

export default function AgentWorkPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, completed

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'agent') {
      router.push('/dashboard');
      return;
    }

    setAgentData(parsedUser);
    fetchAgentData(parsedUser.id);
  }, [router]);

  // Check for new payments every 30 seconds
  useEffect(() => {
    if (!agentData?.id) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/agent/${agentData.id}/payments`);
        const newPayments = await response.json();
        
        if (Array.isArray(newPayments) && newPayments.length > (agentData?.payments?.length || 0)) {
          // New payment received!
          const latestPayment = newPayments[0];
          toast.success(`💰 New payment received: Rs. ${latestPayment.amount} - ${latestPayment.note || 'Direct payment from admin'}`, {
            autoClose: 8000,
            position: 'top-right'
          });
          
          // Update payments state
          setAgentData(prev => ({ ...prev, payments: newPayments }));
        }
      } catch (error) {
        console.error('Error checking for new payments:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [agentData?.id, agentData?.payments?.length || 0]);

  const fetchAgentData = async (agentId) => {
    try {
      const [appsRes, agentRes, paymentsRes] = await Promise.all([
        fetch(`/api/applications?agentId=${agentId}`).then(r => r.json()),
        fetch(`/api/agents/${agentId}`).then(r => r.json()),
        fetch(`/api/agent/${agentId}/payments`).then(r => r.json())
      ]);

      setApplications(appsRes || []);
      const paymentsData = Array.isArray(paymentsRes) ? paymentsRes : [];
      setAgentData(prev => ({ ...prev, ...agentRes, payments: paymentsData }));
    } catch (error) {
      console.error('Error fetching agent data:', error);
      toast.error('Failed to load work data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Mark this application as ${status.replace('_', ' ').toUpperCase()}?`)) return;

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error('Failed to update status');

      setApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
      
      // Refresh data after payment completion
    if (status === 'work_completed') {
      toast.success('Work completed! 80% payment has been added to your earnings.');
      fetchAgentData(agentData.id); // Refresh agent data to show updated earnings and payments
    } else {
      toast.success('Application status updated successfully.');
    }
    } catch (error) {
      toast.error('Error updating application. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Rejected</span>;
      case 'pending_payment': return <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Pending Payment</span>;
      case 'pending_review': return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse shadow-sm">Needs Review</span>;
      case 'work_completed': return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Work Completed</span>;
      case 'in_progress': return <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">In Progress</span>;
      default: return <span className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">{status}</span>;
    }
  };

  const getFilteredApplications = () => {
    switch (filter) {
      case 'pending':
        return applications.filter(app => app.status === 'pending_review');
      case 'approved':
        return applications.filter(app => app.status === 'approved');
      case 'completed':
        return applications.filter(app => app.status === 'work_completed');
      default:
        return applications;
    }
  };

  const filteredApps = getFilteredApplications();
  const payments = Array.isArray(agentData?.payments) ? agentData.payments : [];
  const totalEarnings = agentData?.totalEarnings || 0;
  
  // Dynamically calculate total paid from transaction history (fallback for older DB records)
  const totalPaid = payments
    .filter(p => p.type === 'direct_payment' && p.status !== 'FAILED')
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    
  const pendingDebt = Math.max(0, totalEarnings - totalPaid);
  const recentPayments = payments.slice(0, 5); // Show 5 most recent payments

  // Debug logging
  console.log('Agent Data:', agentData);
  console.log('Payments:', payments);
  console.log('Recent Payments:', recentPayments);

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending_review').length,
    approved: applications.filter(app => app.status === 'approved').length,
    completed: applications.filter(app => app.status === 'work_completed').length,
    pendingPayments: applications.filter(app => app.status === 'approved').length,
    totalPayments: payments.length,
    totalEarned: payments.reduce((sum, payment) => sum + (payment.amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-[#5C5470] flex-shrink-0"></div>
        
        <div className="flex-1 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Work Dashboard</h1>
              <p className="text-gray-600">Manage your assigned applications and track earnings</p>
            </div>
            {/* Top Right Profile Actions */}
            <TopHeader user={agentData} setUser={setAgentData} noticesCount={stats.pending} />
          </div>
          
          <div className="flex gap-6 text-right mb-8">
              <div>
                <p className="text-sm text-gray-500 font-medium">Gross Earnings</p>
                <p className="text-2xl font-bold text-slate-800">Rs. {totalEarnings}</p>
                <div className="text-xs text-gray-400 mt-1">
                  Task generation (80%)
                </div>
              </div>

              <div className="border-l border-gray-200 pl-6">
                <p className="text-sm text-gray-500 font-medium">Total Paid (By Admin)</p>
                <p className="text-2xl font-bold text-blue-600">Rs. {totalPaid}</p>
                <div className="text-xs text-gray-400 mt-1">
                  <span>{payments.filter(p => p.type === 'direct_payment').length} payouts received</span>
                  {recentPayments.length > 0 && (
                    <span className="ml-2 text-green-600">
                      +Rs. {recentPayments[0]?.amount || 0} (latest)
                    </span>
                  )}
                </div>
              </div>
              
              <div className="border-l border-gray-200 pl-6">
                <p className="text-sm text-gray-500 font-medium">Pending Payout (Owed)</p>
                <p className="text-2xl font-bold text-red-500">Rs. {pendingDebt}</p>
                <div className="text-xs text-gray-400 mt-1 bg-red-50 px-2 rounded font-medium text-red-600 inline-block">
                  Awaiting Transfer
                </div>
              </div>
            </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FaTasks className="text-3xl text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
                </div>
                <FaClock className="text-3xl text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                </div>
                <FaCheckCircle className="text-3xl text-green-500" />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payment</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.pendingPayments}</p>
                  <p className="text-xs text-gray-500">Complete work to receive 80%</p>
                </div>
                <FaDollarSign className="text-3xl text-purple-500" />
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Pending Review ({stats.pending})
              </button>
              <button
                onClick={() => setFilter('approved')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'approved'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Approved ({stats.approved})
              </button>
              <button
                onClick={() => setFilter('completed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'completed'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Completed ({stats.completed})
              </button>
            </div>
          </div>

          {/* Applications List */}
          {filteredApps.length === 0 ? (
            <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaTasks className="text-3xl text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Applications Found</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {filter === 'all' 
                  ? 'You have no assigned applications yet.' 
                  : `No applications with status: ${filter.replace('_', ' ')}`
                }
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Application</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApps.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">#{app.id.slice(-8).toUpperCase()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{app.userId}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(app.status)}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                          {app.status === 'approved' && (
                            <button
                              onClick={() => handleUpdateStatus(app.id, 'work_completed')}
                              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm"
                              title="Complete work to receive 80% payment"
                            >
                              <FaCheckCircle className="inline mr-2" />
                              Complete Work
                            </button>
                          )}
                          {app.status === 'pending_review' && (
                            <button
                              onClick={() => router.push('/request')}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm"
                            >
                              Review Application
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recent Payment History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mt-8">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaDollarSign className="text-green-600" />
                  Recent Payment History
                </h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentPayments.map((payment, index) => (
                      <tr key={payment.id} className={`hover:bg-gray-50 ${index === 0 ? 'bg-green-50 border-l-4 border-green-500' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {index === 0 && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                                NEW
                              </span>
                            )}
                            <div className="text-sm font-bold text-green-600">Rs. {payment.amount}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">
                              {payment.type === 'agent_payment' ? '💼 Work Completion' : 
                               payment.type === 'direct_payment' ? '💰 Direct Payment' : '📄 Other'}
                            </div>
                            {payment.type === 'direct_payment' && (
                              <div className="text-xs text-blue-600 mt-1">From Admin</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="font-medium" title={payment.note}>
                              {payment.note || 'No note'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">
                            {new Date(payment.createdAt).toLocaleDateString()}
                            <div className="text-xs text-gray-400">
                              {new Date(payment.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase">
                            Complete
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {payments.length > 5 && (
                <div className="px-6 py-4 border-t border-gray-200 text-center">
                  <button className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                    View All Payments ({payments.length - 5} more)
                  </button>
                </div>
              )}
            </div>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
