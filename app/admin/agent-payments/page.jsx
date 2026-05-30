'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaDollarSign, FaSearch, FaUser, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

export default function AdminAgentPaymentsPage() {
  const router = useRouter();
  
  // ==================== STATE MANAGEMENT ====================
  const [agents, setAgents] = useState([]);              // List of all agents
  const [loading, setLoading] = useState(true);          // Loading state for UI
  const [searchQuery, setSearchQuery] = useState('');    // Search/filter query
  const [selectedAgent, setSelectedAgent] = useState(null); // Selected agent for payment
  const [paymentAmount, setPaymentAmount] = useState(''); // Payment amount input
  const [paymentNote, setPaymentNote] = useState('');     // Payment note/description
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Prevent double submission
  const [currentPage, setCurrentPage] = useState(1);     // Current pagination page
  const itemsPerPage = 6;                                // Items per page for grid

  // ==================== AUTHENTICATION & INITIALIZATION ====================
  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    // SECURITY: Verify admin/superadmin role
    const user = JSON.parse(userData);
    if (user.role !== 'admin' && user.role !== 'superadmin') {
      router.push('/dashboard');
      return;
    }

    // Fetch initial data
    fetchAgents();
  }, [router]);

  // ==================== DATA FETCHING ====================
  
  // ==================== DATA FETCHING ====================
  
  /**
   * Fetches all agents and calculates total paid amounts dynamically
   */
  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/agents');
      const data = await response.json();
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast.error('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  // ==================== PAYMENT PROCESSING ====================
  
  /**
   * Initiates a direct payment to an agent via eSewa
   * Redirects to eSewa payment page for processing
   */
  const handleDirectPayment = async () => {
    // Validate payment amount
    if (!selectedAgent || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast.error('Please select an agent and enter a valid amount');
      return;
    }

    setIsProcessingPayment(true);
    try {
      // Create unique product ID for this payment
      const productId = `direct_payment_${selectedAgent.id}_${Date.now()}`;
      
      // Initiate payment with eSewa
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

      // Redirect to eSewa payment page
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

  // ==================== HELPER FUNCTIONS ====================
  
  /**
   * Returns appropriate badge styling based on payment status
   * Used for visual status indicators in the table
   */
  const getStatusBadge = (status) => {
    switch(status) {
      case 'COMPLETE': 
        return <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase">Complete</span>;
      case 'PENDING': 
        return <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold uppercase">Pending</span>;
      case 'FAILED': 
        return <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase">Failed</span>;
      default: 
        return <span className="bg-gray-100 text-gray-800 border border-gray-200 px-3 py-1 rounded-full text-xs font-bold uppercase">{status}</span>;
    }
  };

  /**
   * Calculates remaining amount owed to an agent
   */
  const getRemainingOwed = (agent) => {
    return Math.max(0, (agent.totalEarnings || 0) - (agent.totalPaid || 0));
  };

  // ==================== FILTERING & PAGINATION ====================
  
  /**
   * Filter agents based on search query (name or email)
   */
  const filteredAgents = agents.filter(agent => 
    agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination calculations for agents grid
  const totalPages = Math.max(1, Math.ceil(filteredAgents.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedAgents = filteredAgents.slice(startIndex, startIndex + itemsPerPage);

  // ==================== LOADING STATE ====================
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

  // ==================== LOADING STATE ====================
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

  // ==================== RENDER MAIN PAGE ====================
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        {/* Top gradient bar - visual accent */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 flex-shrink-0"></div>
        
        <div className="flex-1 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 w-full">
          
          {/* ==================== HEADER SECTION ==================== */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Payments</h1>
              <p className="text-gray-600">Send payments to agents via eSewa</p>
            </div>
          </div>

          {/* ==================== DIRECT PAYMENT FORM ==================== */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <FaDollarSign className="text-green-600" />
              Direct Payment to Agent
            </h2>
            
            {/* Payment Form - 4 column grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              
              {/* Agent Selection Dropdown */}
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
                  {agents.map(agent => (
                    <option key={agent.id} value={agent.id} className="font-bold text-gray-900">
                      {agent.name} ({agent.email}) - Remaining: Rs. {getRemainingOwed(agent)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Payment Amount Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Amount (Rs.)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
              
              {/* Payment Note Input - spans 2 columns on desktop */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Note (Optional)</label>
                <input
                  type="text"
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  placeholder="Payment description or note"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <button
              onClick={handleDirectPayment}
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

          {/* ==================== SEARCH BAR ==================== */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center gap-4">
              <FaSearch className="text-gray-400" />
              <input
                type="text"
                placeholder="Search agents by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
              />
            </div>
          </div>

          {/* ==================== AGENTS GRID ==================== */}
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-600 mx-auto"></div>
              <p className="text-slate-500 mt-6 font-medium">Loading agents...</p>
            </div>
          ) : filteredAgents.length > 0 ? (
            <div>
              {/* Agents Grid - Responsive: 1 column on mobile, 2 on tablet, 3 on desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {paginatedAgents.map((agent) => (
                  <div
                    key={agent.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
                  >
                    {/* Agent Avatar and Status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden border border-gray-200">
                          {agent.profilePicture || agent.photoUrl ? (
                            <img src={agent.profilePicture || agent.photoUrl} alt={agent.name} className="w-full h-full object-cover" />
                          ) : (
                            <FaUser className="text-gray-400 text-xl" />
                          )}
                        </div>
                      </div>
                      <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">
                        Active
                      </span>
                    </div>
                    
                    {/* Agent Basic Info */}
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{agent.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{agent.email}</p>
                    {agent.phoneNumber && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{agent.phoneNumber}</p>
                    )}
                    
                    {/* Financial Summary */}
                    <div className="space-y-3 mt-6">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Gross Earnings</span>
                        <span className="font-semibold text-gray-900">Rs. {agent.totalEarnings || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Paid by Admin</span>
                        <span className="font-semibold text-gray-900">Rs. {agent.totalPaid || 0}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm pt-3 border-t border-gray-100">
                        <span className="font-medium text-gray-900">Pending Owed</span>
                        <span className="font-bold text-red-600">Rs. {getRemainingOwed(agent)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Controls - Shows page numbers */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                  <span className="text-sm font-medium text-gray-500 mr-2">Page:</span>
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setCurrentPage(pageNumber)}
                        className={`min-w-[40px] h-10 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
                          safeCurrentPage === pageNumber
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Empty State - No agents found
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                <FaUser className="text-slate-300 text-3xl" />
              </div>
              <p className="text-slate-600 text-xl font-bold mb-2">No agents found</p>
              <p className="text-slate-400 text-sm font-medium">Try adjusting your search criteria</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notifications Container */}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
}