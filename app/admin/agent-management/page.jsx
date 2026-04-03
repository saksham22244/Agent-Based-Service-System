'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast, ToastContainer } from 'react-toastify';
import { FaUser, FaDollarSign, FaHistory, FaArrowLeft, FaPlus, FaCheckCircle, FaTimesCircle, FaSearch } from 'react-icons/fa';
import Sidebar from '@/components/Sidebar';

export default function AgentManagementPage() {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const user = JSON.parse(userData);
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      router.push('/dashboard');
      return;
    }

    fetchAgents();
  }, [router]);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      
      // Calculate dynamic totalPaid for each agent to avoid DB sync issues
      const agentsWithPayments = await Promise.all((data || []).map(async (agent) => {
        const payments = await fetchAgentPayments(agent.id);
        const totalPaid = payments
          .filter(p => p.type === 'direct_payment' && p.status !== 'FAILED')
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        return { ...agent, totalPaid };
      }));
      
      setAgents(agentsWithPayments);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgentPayments = async (agentId) => {
    try {
      const response = await fetch(`/api/agent/${agentId}/payments`);
      const payments = await response.json();
      return Array.isArray(payments) ? payments : [];
    } catch (error) {
      console.error('Error fetching agent payments:', error);
      return [];
    }
  };

  const handleAgentClick = async (agent) => {
    setLoading(true);
    try {
      const payments = await fetchAgentPayments(agent.id);
      setSelectedAgent({
        ...agent,
        payments: payments,
        totalPaid: payments
          .filter(p => p.type === 'direct_payment' && p.status !== 'FAILED')
          .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0),
        paymentCount: payments.filter(p => p.type === 'direct_payment').length
      });
    } catch (error) {
      console.error('Error loading agent details:', error);
      toast.error('Failed to load agent details');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectPayment = async () => {
    if (!selectedAgent || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/admin/agent-direct-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgent.id,
          amount: parseFloat(paymentAmount),
          note: paymentNote || 'Direct payment from admin'
        })
      });

      if (!response.ok) throw new Error('Payment failed');

      toast.success(`Successfully paid Rs. ${paymentAmount} to ${selectedAgent.name}`);
      
      // Reset form and refresh agent data
      setPaymentAmount('');
      setPaymentNote('');
      await handleAgentClick(selectedAgent); // Refresh agent details
      await fetchAgents(); // Refresh the list cards as well
      
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to process payment');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedAgents = filteredAgents.slice(startIndex, startIndex + itemsPerPage);

  if (selectedAgent) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1">
          <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setSelectedAgent(null)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium"
              >
                <FaArrowLeft />
                Back to Agents
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
                  {selectedAgent.profilePicture || selectedAgent.photoUrl ? (
                    <img src={selectedAgent.profilePicture || selectedAgent.photoUrl} alt={selectedAgent.name} className="w-full h-full object-cover" />
                  ) : (
                    <FaUser className="text-gray-400 text-2xl" />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {selectedAgent.name}
                  </h1>
                  <p className="text-gray-500 font-medium">Payment & Financial Management</p>
                </div>
              </div>
            </div>

            {/* Agent Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                    <p className="text-3xl font-bold text-green-600">Rs. {selectedAgent.totalEarnings || 0}</p>
                  </div>
                  <FaDollarSign className="text-green-600 text-2xl" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Paid by Admin</p>
                    <p className="text-3xl font-bold text-blue-600">Rs. {selectedAgent.totalPaid || 0}</p>
                  </div>
                  <FaUser className="text-blue-600 text-2xl" />
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Payment Count</p>
                    <p className="text-3xl font-bold text-purple-600">{selectedAgent.paymentCount || 0}</p>
                  </div>
                  <FaHistory className="text-purple-600 text-2xl" />
                </div>
              </div>
            </div>

            {/* Quick Payment */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Send Quick Payment</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (Rs.)</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Payment Note</label>
                  <input
                    type="text"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    placeholder="Payment description"
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleDirectPayment}
                    disabled={isProcessingPayment || !paymentAmount}
                    className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <FaDollarSign />
                        Send Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FaHistory />
                  Payment History
                </h2>
              </div>
              
              {selectedAgent.payments && selectedAgent.payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedAgent.payments.map((payment, index) => (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {new Date(payment.createdAt).toLocaleDateString()}
                              <div className="text-xs text-gray-500">
                                {new Date(payment.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              <div className="font-medium">
                                {payment.type === 'agent_payment' ? '💼 Work Completion' : 
                                 payment.type === 'direct_payment' ? '💰 Admin Payment' : '📄 Other'}
                              </div>
                              {payment.type === 'direct_payment' && (
                                <div className="text-xs text-blue-600 mt-1">Direct from Admin</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-green-600">Rs. {payment.amount}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs">
                              <div className="font-medium" title={payment.note}>
                                {payment.note || 'No note'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 w-fit">
                              <FaCheckCircle />
                              Complete
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FaDollarSign className="mx-auto text-gray-400 text-4xl mb-4" />
                  <p className="text-gray-500 text-lg">No payment history found</p>
                  <p className="text-gray-400 text-sm mt-2">Send a payment to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto p-8 lg:p-12">
          {/* Header & Search */}
          <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tight">Agent Payment Management</h1>
              <p className="text-slate-500 font-medium tracking-wide">Click on an agent to view their payment history</p>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <FaSearch className="text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search agents..."
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all duration-300 font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Agents Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-600 mx-auto"></div>
              <p className="text-slate-500 mt-6 font-medium">Loading agents...</p>
            </div>
          ) : filteredAgents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {paginatedAgents.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => handleAgentClick(agent)}
                  className="bg-white rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 p-7 cursor-pointer hover:shadow-2xl hover:border-indigo-100 hover:-translate-y-1.5 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:from-indigo-100 group-hover:to-blue-100 transition-all duration-300 shadow-sm border border-indigo-50/50 overflow-hidden">
                      {agent.profilePicture || agent.photoUrl ? (
                         <img src={agent.profilePicture || agent.photoUrl} alt={agent.name} className="w-full h-full object-cover" />
                      ) : (
                         <FaUser className="text-indigo-500 text-xl drop-shadow-sm" />
                      )}
                    </div>
                    <span className="bg-emerald-50 text-emerald-600 border border-emerald-100/50 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-sm">
                      Active
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors drop-shadow-sm">{agent.name}</h3>
                  <p className="text-sm text-slate-400 font-medium mb-7 truncate">{agent.email}</p>
                  
                  <div className="space-y-2 bg-slate-50/50 rounded-xl p-4 border border-slate-50 mb-7">
                    <div className="flex justify-between items-center text-sm p-1">
                      <span className="text-slate-500 font-medium">Gross Earnings</span>
                      <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100/50">Rs. {agent.totalEarnings || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-1">
                      <span className="text-slate-500 font-medium">Paid by Admin</span>
                      <span className="font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100/50">Rs. {agent.totalPaid || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm p-1 border-t border-slate-200/60 mt-1 pt-3">
                      <span className="text-slate-700 font-bold">Pending Owed</span>
                      <span className="font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100/50">Rs. {Math.max(0, (agent.totalEarnings || 0) - (agent.totalPaid || 0))}</span>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-slate-100">
                    <button className="w-full text-indigo-600 bg-indigo-50/50 group-hover:text-white group-hover:bg-indigo-600 font-semibold text-sm flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 shadow-sm group-hover:shadow-[0_4px_14px_0_rgba(99,102,241,0.39)]">
                      <FaHistory className="group-hover:-rotate-12 transition-transform duration-300" />
                      View Payment History
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                 <FaUser className="text-slate-300 text-3xl" />
              </div>
              <p className="text-slate-600 text-xl font-bold mb-2">No agents found</p>
              <p className="text-slate-400 text-sm font-medium">Try adjusting your search criteria</p>
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && totalPages > 1 && (
            <div className="mt-10 flex items-center justify-end gap-2">
              <span className="text-sm font-medium text-slate-500 mr-2">Show</span>
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNumber = i + 1;
                return (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`min-w-[36px] h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 ${
                      safeCurrentPage === pageNumber
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
