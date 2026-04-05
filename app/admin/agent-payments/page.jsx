'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaDollarSign, FaSearch, FaUser, FaCalendar, FaCheckCircle, FaTimesCircle, FaClock } from 'react-icons/fa';

export default function AdminAgentPaymentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

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
    fetchPayments();
  }, [router]);

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/admin/agent-payments');
      const data = await response.json();
      
      // Ensure data is an array
      const paymentsArray = Array.isArray(data) ? data : (data?.payments || data?.transactions || []);
      setPayments(paymentsArray);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payment history');
      setPayments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAgent || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please select an agent and enter a valid amount');
      return;
    }

    setIsProcessingPayment(true);

    try {
      const productId = `direct_payment_${selectedAgent.id}_${Date.now()}`;
      
      const esewaRes = await fetch('/api/esewa/initiate-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          productId: productId,
          userId: selectedAgent.id,
          type: 'direct_payment',
          note: paymentNote || 'Direct payment from admin to agent'
        })
      });

      const esewaData = await esewaRes.json();

      if (esewaData.url) {
        window.location.href = esewaData.url;
      } else {
        throw new Error(esewaData.message || 'Failed to retrieve eSewa payment URL');
      }
    } catch (error) {
      console.error('Error routing to eSewa:', error);
      toast.error('Failed to initiate eSewa payment');
      setIsProcessingPayment(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'COMPLETE': return <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase">Complete</span>;
      case 'PENDING': return <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending</span>;
      case 'FAILED': return <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase">Failed</span>;
      default: return <span className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1 rounded-full text-xs font-bold uppercase">{status}</span>;
    }
  };

  const getRemainingOwed = (agent) => {
    const agentPayments = payments.filter(p => 
      p.userId === agent.id && 
      p.type === 'direct_payment' && 
      p.status !== 'FAILED'
    );
    const totalPaid = agentPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
    return Math.max(0, (agent.totalEarnings || 0) - totalPaid);
  };

  const filteredAgents = agents.filter(agent => 
    agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPayments = payments.filter(payment => {
    const agent = agents.find(a => a.id === payment.userId);
    return payment.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           agent?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           agent?.email?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage);

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
        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 flex-shrink-0"></div>
        
        <div className="flex-1 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Payments</h1>
              <p className="text-gray-600">Manage agent payments and view payment history</p>
            </div>
          </div>

          {/* Direct Payment Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaDollarSign className="text-green-600" />
              Direct Payment to Agent
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Agent</label>
                <select
                  value={selectedAgent?.id || ''}
                  onChange={(e) => {
                    const agent = agents.find(a => a.id === e.target.value);
                    setSelectedAgent(agent);
                  }}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-gray-800"
                >
                  <option value="" className="font-normal">Choose an agent...</option>
                  {filteredAgents.map(agent => (
                    <option key={agent.id} value={agent.id} className="font-bold text-gray-900">
                      {agent.name} ({agent.email}) - Remaining to Pay: Rs. {getRemainingOwed(agent)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount (Rs.)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Note (Optional)</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Payment description or note"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <button
              onClick={handlePaymentSubmit}
              disabled={isProcessingPayment || !selectedAgent || !paymentAmount}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center gap-2"
            >
              {isProcessingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing Payment...
                </>
              ) : (
                <>
                  <FaDollarSign />
                  Send Payment to {selectedAgent?.name || 'Agent'}
                </>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                placeholder="Search agents or payments by name, email, or note..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Payment History</h2>
            </div>
            
            {filteredPayments.length === 0 ? (
              <div className="p-12 text-center">
                <FaDollarSign className="text-5xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Records Found</h3>
                <p className="text-gray-500">No payments found matching your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedPayments.map((payment) => {
                      const agent = agents.find(a => a.id === payment.userId);
                      return (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <FaUser className="text-blue-600 text-sm" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{agent?.name || 'Unknown Agent'}</div>
                                <div className="text-xs text-gray-500">{agent?.email || 'N/A'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-bold text-green-600">Rs. {payment.amount}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">
                              {payment.type === 'agent_payment' ? 'Work Completion' : 
                               payment.type === 'direct_payment' ? 'Direct Payment' : 'Other'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate" title={payment.note}>
                              {payment.note || 'No note'}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-500">
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(payment.status)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {!loading && totalPages > 1 && (
              <div className="flex items-center justify-end gap-1.5 text-xs text-gray-700 bg-gray-50 px-4 py-3 border-t border-gray-200">
                <span className="mr-0.5">Show</span>
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-2 py-0.5 rounded border text-xs transition-colors ${
                        safeCurrentPage === pageNumber
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100'
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
      </div>

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}
