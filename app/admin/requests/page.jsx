'use client';

import Sidebar, { MobileHeader } from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaFileAlt, FaEye } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function RequestPage() {
  // ==================== STATE MANAGEMENT ====================
  
  // --- Data State Variables ---
  const [applications, setApplications] = useState([]);      // List of all applications/requests
  const [servicesMap, setServicesMap] = useState({});       // Maps service IDs to service objects for quick lookup
  const [usersMap, setUsersMap] = useState({});             // Maps user IDs to user objects for quick lookup
  const [agents, setAgents] = useState([]);                 // List of all agents for assignment
  const [currentUser, setCurrentUser] = useState(null);     // Currently logged-in user (admin or agent)
  
  // --- UI State Variables ---
  const [selectedAgentTransfer, setSelectedAgentTransfer] = useState(''); // Agent ID for transferring requests
  const [loading, setLoading] = useState(true);             // Loading state for data fetching
  const [viewURL, setViewURL] = useState(null);             // URL of attachment being viewed
  
  // --- Modal State Variables ---
  const [viewedApp, setViewedApp] = useState(null);         // Application currently being viewed in modal
  const [searchQuery, setSearchQuery] = useState('');       // Search filter for applications
  const [noticeModal, setNoticeModal] = useState(null);     // Notice modal data (userId, userName)
  const [noticeTitle, setNoticeTitle] = useState('');       // Title of notice being sent
  const [noticeMessage, setNoticeMessage] = useState('');   // Message content of notice
  const [isSendingNotice, setIsSendingNotice] = useState(false); // Loading state for notice sending
  
  // --- Pagination State Variables ---
  const [currentPage, setCurrentPage] = useState(1);        // Current page number
  const itemsPerPage = 8;                                   // Number of items per page
  
  // Helper: Check if current user is admin or super admin
  const isAdminOrSuperAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  // ==================== INITIALIZATION ====================
  useEffect(() => {
    fetchData(); // Load all data when component mounts
  }, []);

  // ==================== DATA FETCHING ====================
  
  /**
   * Fetches all required data: services, users, applications, agents
   * Uses role-based filtering for applications
   * - Agents: Only see applications assigned to them
   * - Admins: See all applications
   */
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user from localStorage
      const userStr = localStorage.getItem('user');
      const currentUserData = userStr ? JSON.parse(userStr) : null;
      setCurrentUser(currentUserData);
      if (!currentUserData) return;
 
      // ROLE-BASED URL: Agents only see assigned applications, admins see all
      const appsUrl = currentUserData.role === 'agent' 
        ? `/api/applications?agentId=${currentUserData.id}`  // Filter by agent ID
        : `/api/applications`; // All applications for admin/superadmin

      // Get authentication token for protected routes
      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      // PARALLEL FETCHING: All 4 API calls happen simultaneously for performance
      const [servicesRes, usersRes, appsRes, agentsRes] = await Promise.all([
        fetch('/api/admin/services', { headers: authHeaders }).then(r => r.json()),
        fetch('/api/users', { headers: authHeaders }).then(r => r.json()), 
        fetch(appsUrl).then(r => r.json()),
        fetch('/api/agents', { headers: authHeaders }).then(r => r.json())
      ]);

      // Build services lookup map (ID -> Service Object)
      const sMap = {};
      (servicesRes.services || []).forEach(s => { sMap[s.id] = s; });
      setServicesMap(sMap);

      // Build users lookup map (ID -> User Object)
      const uMap = {};
      (usersRes || []).forEach(u => { uMap[u.id] = u; });
      setUsersMap(uMap);

      setApplications(appsRes || []);
      setAgents(agentsRes || []);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ==================== APPLICATION ACTIONS ====================
  
  /**
   * Updates the status of an application (approve/reject)
   * Validates that an agent is assigned before approving (for admins)
   */
  const handleUpdateStatus = async (id, status) => {
    // Admin validation: Must have an agent assigned before approving
    const hasValidAgent = agents.some(a => a.id === viewedApp?.assignedAgentId);
    if (isAdminOrSuperAdmin && status === 'approved' && !hasValidAgent) {
      toast.warning('Please assign a valid agent to this request before approving it.');
      return;
    }

    // Confirm with user
    if (!window.confirm(`Mark this application as ${status.toUpperCase()}?`)) return;

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error('Failed to update status');

      // OPTIMISTIC UPDATE: Update UI immediately without waiting for refetch
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
      setViewedApp(null);
      toast.success('Application status updated successfully.');
    } catch (error) {
      toast.error('Error updating application. Please try again.');
      console.error(error);
    }
  };

  /**
   * Allows an agent to claim an unassigned application
   * Sets the agent as the responsible reviewer
   */
  const handleClaimRequest = async (id) => {
    if (!window.confirm('Are you sure you want to claim this application? You will be responsible for reviewing it.')) return;
    
    try {
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      if (!currentUser) return;

      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedAgentId: currentUser.id })
      });

      if (!res.ok) throw new Error('Failed to claim');

      // Update both applications list and current modal view
      setApplications(prev => prev.map(app => app.id === id ? { ...app, assignedAgentId: currentUser.id } : app));
      setViewedApp(prev => ({ ...prev, assignedAgentId: currentUser.id }));
      toast.success('Application claimed successfully! You can now review and approve/reject it.');
    } catch (err) {
      toast.error('Error claiming application. It might have been claimed by someone else already.');
      console.error(err);
    }
  };

  /**
   * Transfers an application to another agent (admin only)
   * Allows reassigning responsibility
   */
  const handleTransferRequest = async (id) => {
    if (!selectedAgentTransfer) return toast.warning('Please select an agent to transfer to.');
    if (!window.confirm('Are you sure you want to transfer this application to the selected agent?')) return;
    
    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedAgentId: selectedAgentTransfer })
      });

      if (!res.ok) throw new Error('Failed to transfer');

      // Update both applications list and current modal view
      setApplications(prev => prev.map(app => app.id === id ? { ...app, assignedAgentId: selectedAgentTransfer } : app));
      setViewedApp(prev => ({ ...prev, assignedAgentId: selectedAgentTransfer }));
      toast.success('Application transferred successfully!');
      setSelectedAgentTransfer(''); // Reset selection
    } catch (err) {
      toast.error('Error transferring application.');
      console.error(err);
    }
  };

  /**
   * Permanently deletes an application record
   * Removes from both applications list and closes modal if open
   */
  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to completely delete this application record?')) return;
    
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');
      
      setApplications(prev => prev.filter(a => a.id !== id));
      if (viewedApp?.id === id) setViewedApp(null); // Close modal if deleting viewed app
      toast.success('Application record deleted successfully.');
    } catch (err) {
      toast.error('Failed to delete application record.');
      console.error(err);
    }
  };

  /**
   * Sends a notice/notification to the user who submitted the application
   * Used to communicate requirements, status updates, etc.
   */
  const handleSendNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeMessage) return toast.warning('Please fill in title and message.');
    
    setIsSendingNotice(true);
    try {
      const res = await fetch('/api/admin/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: noticeTitle,
          message: noticeMessage,
          recipientType: 'user',
          recipientId: noticeModal.userId,
          recipientName: noticeModal.userName || 'Unknown User'
        })
      });
      
      if (!res.ok) throw new Error('Failed to send notice');
      
      toast.success('Notice dispatched to user successfully!');
      setNoticeModal(null);
      setNoticeTitle('');
      setNoticeMessage('');
    } catch (err) {
      toast.error('Error sending notice. Try again.');
      console.error(err);
    } finally {
      setIsSendingNotice(false);
    }
  };

  // ==================== HELPER FUNCTIONS ====================
  
  /**
   * Returns styled badge component based on application status
   * Provides visual feedback for different states
   */
  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': 
        return <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Approved</span>;
      case 'rejected': 
        return <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Rejected</span>;
      case 'pending_payment': 
        return <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Pending Payment</span>;
      case 'pending_review': 
        return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse shadow-sm">Needs Validation</span>;
      case 'work_completed': 
        return <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Completed</span>;
      default: 
        return <span className="bg-gray-100 text-gray-800 border px-3 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  // ==================== FILTERING & PAGINATION ====================
  
  /**
   * Filter applications based on search query
   * Excludes 'work_completed' applications (moved to history)
   * Searches by: service name, user name, user email, or ticket ID
   */
  const filteredApps = applications.filter(app => {
    // Hide completed applications (they go to history page)
    if (app.status === 'work_completed') return false;
    
    const svc = servicesMap[app.serviceId]?.name || '';
    const usr = usersMap[app.userId];
    const uName = usr?.name || '';
    const uEmail = usr?.email || '';
    const tkId = app.id.slice(-8); // Last 8 chars of ID as ticket number
    const q = searchQuery.toLowerCase();
    
    return (svc.toLowerCase().includes(q) || 
            uName.toLowerCase().includes(q) || 
            uEmail.toLowerCase().includes(q) || 
            tkId.toLowerCase().includes(q)) || !searchQuery;
  });

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredApps.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedApps = filteredApps.slice(startIndex, startIndex + itemsPerPage);

  // ==================== RENDER UI ====================
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <MobileHeader title="Applications" subtitle="Review and manage recent requests." />
        
        {/* Desktop Header with Gradient Bar */}
        <div className="hidden lg:block h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
        <div className="hidden lg:flex bg-white px-6 py-4 border-b flex-shrink-0 items-center justify-between shadow-sm gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Applications</h1>
            <p className="text-xs text-gray-500 mt-1">Review and manage recent requests.</p>
          </div>
          
          {/* Search and Stats Bar */}
          <div className="flex items-center gap-3 flex-wrap">
            <input 
              type="text" 
              placeholder="Search by ticket, user, or email..." 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-64 placeholder-gray-500"
            />
            
            {/* Pending Review Counter Badge */}
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 tracking-wide whitespace-nowrap">
              {applications.filter(a => a.status === 'pending_review').length} Pending Reviews
            </span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-4 w-full">
          
          {/* ===== LOADING STATE ===== */}
          {loading ? (
             <div className="flex items-center justify-center h-64">
               <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
             </div>
          ) : applications.length === 0 ? (
            // ===== EMPTY STATE =====
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center max-w-lg mx-auto mt-10">
              <FaFileAlt className="text-5xl text-blue-100 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Requests Found</h2>
              <p className="text-gray-500 text-sm">You do not have any applications waiting for review at the moment.</p>
            </div>
          ) : (
            // ===== APPLICATIONS TABLE/CARDS =====
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              
              {/* DESKTOP VIEW: Table Layout */}
              <div className="hidden lg:block">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service Details</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Applicant</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Submitted</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedApps.map((app) => {
                      const svc = servicesMap[app.serviceId];
                      const usr = usersMap[app.userId];
                      return (
                        <tr key={app.id} className="hover:bg-blue-50/50 transition-colors">
                          {/* Service Name + Ticket ID */}
                          <td className="px-6 py-4">
                            <div className="font-bold text-gray-900">{svc ? svc.name.replace('\n', ' ') : 'Unknown Service'}</div>
                            <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 w-max font-mono mt-1">
                              TKT-{app.id.slice(-8).toUpperCase()}
                            </div>
                          </td>
                          
                          {/* User Info */}
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-800">{usr ? usr.name : 'Unknown User'}</div>
                            <div className="text-xs text-gray-500">{usr ? usr.email : ''}</div>
                          </td>
                          
                          {/* Submission Date */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                            {new Date(app.createdAt).toLocaleString(undefined, { 
                              month: 'short', day: 'numeric', year: 'numeric', 
                              hour: '2-digit', minute: '2-digit' 
                            })}
                          </td>
                          
                          {/* Status Badge */}
                          <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(app.status)}</td>
                          
                          {/* View Details Button */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => setViewedApp(app)} className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg transition-colors border border-blue-200">
                              <FaEye className="mr-2" /> View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* MOBILE/TABLET VIEW: Card Layout */}
              <div className="lg:hidden divide-y divide-gray-200">
                {paginatedApps.map((app) => {
                  const svc = servicesMap[app.serviceId];
                  const usr = usersMap[app.userId];
                  return (
                    <div key={app.id} className="p-4">
                      {/* Header: Service Name + Ticket + Status */}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="font-bold text-gray-900 text-sm">{svc ? svc.name.replace('\n', ' ') : 'Unknown Service'}</div>
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono mt-1 w-fit">
                            TKT-{app.id.slice(-8).toUpperCase()}
                          </div>
                        </div>
                        {getStatusBadge(app.status)}
                      </div>
                      
                      {/* Applicant Info */}
                      <div className="flex gap-2 mb-1">
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0">Applicant:</span>
                        <div>
                          <div className="text-xs font-semibold text-gray-800">{usr ? usr.name : 'Unknown User'}</div>
                          <div className="text-xs text-gray-500">{usr ? usr.email : ''}</div>
                        </div>
                      </div>
                      
                      {/* Date Info */}
                      <div className="flex gap-2 mb-3">
                        <span className="text-xs text-gray-400 w-16 flex-shrink-0">Date:</span>
                        <span className="text-xs text-gray-600">
                          {new Date(app.createdAt).toLocaleString(undefined, { 
                            month: 'short', day: 'numeric', year: 'numeric', 
                            hour: '2-digit', minute: '2-digit' 
                          })}
                        </span>
                      </div>
                      
                      {/* View Details Button */}
                      <button onClick={() => setViewedApp(app)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg transition-colors border border-blue-200 text-sm">
                        <FaEye /> View Details
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
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
                            ? 'bg-blue-600 text-white border-blue-600' // Active page
                            : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100' // Inactive page
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ==================== REVIEW MODAL ==================== */}
      {/* Deep inspection tool for viewing full application details */}
      {viewedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
             
             {/* Modal Header */}
             <div className="bg-white px-8 py-6 flex justify-between items-center border-b border-gray-100">
               <div>
                 <h3 className="text-xl font-bold text-gray-900">Application Review</h3>
                 <p className="text-gray-500 text-sm mt-1">
                   Ticket #{viewedApp.id.slice(-8).toUpperCase()} • Service: {servicesMap[viewedApp.serviceId]?.name.replace('\n', ' ')}
                 </p>
               </div>
               <button onClick={() => setViewedApp(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
                 ✕
               </button>
             </div>

             {/* Modal Body - Scrollable Content */}
             <div className="flex-1 overflow-y-auto p-8 bg-gray-50 flex flex-col gap-8">
               
               {/* Applicant Identity Section */}
               <div className="bg-white border border-gray-200 rounded-xl p-6">
                 <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">
                   Applicant Details
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Full Name</p>
                      <p className="text-gray-900">{usersMap[viewedApp.userId]?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Email Address</p>
                      <p className="text-gray-900">{usersMap[viewedApp.userId]?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Phone Number</p>
                      <p className="text-gray-900">{usersMap[viewedApp.userId]?.phoneNumber || 'Not provided'}</p>
                    </div>
                 </div>
                 
                 {/* Assigned Agent Display */}
                 {viewedApp.assignedAgentId && (
                   <div className="mt-4 pt-4 border-t border-gray-100">
                     <p className="text-sm font-medium text-gray-500 mb-1">Assigned Agent</p>
                     <p className="text-gray-900 font-semibold inline-flex items-center px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 border border-purple-100">
                       {(() => {
                         const ag = agents.find(a => a.id === viewedApp.assignedAgentId);
                         return ag ? `${ag.name} (${ag.email})` : 'Unknown Agent';
                       })()}
                     </p>
                   </div>
                 )}
               </div>

               {/* Form Data Section - All submitted fields */}
               <div className="bg-white border border-gray-200 rounded-xl p-6">
                 <h4 className="text-lg font-semibold text-gray-800 mb-4 border-b border-gray-100 pb-2">
                   Application Form Data
                 </h4>
                 <div className="space-y-4">
                    {Object.keys(viewedApp.formData || {}).length === 0 ? (
                      <div className="text-gray-500 text-sm italic">
                        No additional form data was provided.
                      </div>
                    ) : (
                      Object.entries(viewedApp.formData).map(([key, value]) => {
                         // Check if value is a file upload URL
                         const isFileObj = typeof value === 'string' && value.includes('/uploads/applications/');
                         return (
                           <div key={key} className="mb-4">
                             <p className="text-sm font-medium text-gray-500 mb-1 capitalize">
                               {key.replace(/([A-Z])/g, ' $1').trim()} {/* Convert camelCase to readable text */}
                             </p>
                             {isFileObj ? (
                               <button 
                                 type="button" 
                                 onClick={() => setViewURL(value)} 
                                 className="inline-flex py-2 px-4 bg-blue-50 text-blue-600 rounded mb-2 hover:bg-blue-100 transition-colors text-sm items-center font-medium"
                               >
                                 <FaFileAlt className="mr-2" /> View Attachment
                               </button>
                             ) : (
                               <p className="text-gray-900 bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg">{value}</p>
                             )}
                           </div>
                         );
                      })
                    )}
                 </div>
               </div>
             </div>
             
             {/* Modal Footer - Action Buttons */}
             <div className="bg-gray-50 border-t border-gray-200 p-6 flex flex-col xl:flex-row flex-wrap justify-between items-center gap-4 rounded-b-2xl">
               
               {/* Status Display */}
               <div className="flex items-center gap-3 w-full xl:w-auto">
                 <span className="text-sm font-medium text-gray-600">Status:</span>
                 {getStatusBadge(viewedApp.status)}
               </div>
               
               {/* Action Buttons Group */}
               <div className="flex flex-wrap gap-3 items-center w-full xl:w-auto xl:justify-end">
                 
                 {/* Delete Button */}
                 <button 
                   onClick={() => handleDeleteApplication(viewedApp.id)} 
                   className="text-red-600 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors text-sm shrink-0"
                 >
                   Delete
                 </button>
                 
                 {/* Send Notice Button */}
                 <button 
                   onClick={() => setNoticeModal({ userId: viewedApp.userId, userName: usersMap[viewedApp.userId]?.name })} 
                   className="text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-colors text-sm shrink-0"
                 >
                   Send Notice
                 </button>

                 {/* Transfer to Agent (Admin Only) */}
                 {isAdminOrSuperAdmin && (
                   <div className="flex items-center gap-2 mr-2 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
                     <select 
                       value={selectedAgentTransfer}
                       onChange={(e) => setSelectedAgentTransfer(e.target.value)}
                       className="border border-gray-300 rounded px-2 py-1 text-sm outline-none bg-white text-gray-700 min-w-[150px]"
                     >
                       <option value="">Transfer to Agent...</option>
                       {agents.map(ag => (
                         <option key={ag.id} value={ag.id}>{ag.name} ({ag.email})</option>
                       ))}
                     </select>
                     <button 
                       onClick={() => handleTransferRequest(viewedApp.id)}
                       className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded transition-colors text-sm shadow-sm"
                     >
                       Transfer
                     </button>
                   </div>
                 )}

                 {/* Claim Request (Agent Only - for unassigned applications) */}
                 {!viewedApp.assignedAgentId && viewedApp.status === 'pending_review' && !isAdminOrSuperAdmin ? (
                   <button 
                     onClick={() => handleClaimRequest(viewedApp.id)}
                     className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center shadow-md text-sm ml-2"
                   >
                     Claim Request to Review
                   </button>
                 ) : viewedApp.status === 'pending_review' ? (
                   // Approve/Reject Buttons (for assigned agents or admins)
                   <>
                     <button 
                       onClick={() => handleUpdateStatus(viewedApp.id, 'rejected')}
                       className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 bg-white font-medium rounded-lg transition-colors flex items-center text-sm ml-2"
                     >
                       Reject
                     </button>
                     <button 
                       onClick={() => handleUpdateStatus(viewedApp.id, 'approved')}
                       disabled={isAdminOrSuperAdmin && !agents.some(a => a.id === viewedApp.assignedAgentId)}
                       className={`px-4 py-2 font-medium rounded-lg transition-colors flex items-center text-sm ml-2 ${
                         isAdminOrSuperAdmin && !agents.some(a => a.id === viewedApp.assignedAgentId)
                           ? 'bg-blue-300 text-white/80 cursor-not-allowed'
                           : 'bg-blue-600 hover:bg-blue-700 text-white'
                       }`}
                       title={isAdminOrSuperAdmin && !agents.some(a => a.id === viewedApp.assignedAgentId) ? 'Assign an agent first' : ''}
                     >
                       Approve
                     </button>
                   </>
                 ) : (
                   // Close Button for completed/approved/rejected applications
                   <button 
                     onClick={() => setViewedApp(null)} 
                     className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors border border-gray-300 text-sm ml-2"
                   >
                     Close
                   </button>
                 )}
               </div>
             </div>
           </div>
        </div>
      )}

      {/* ==================== ATTACHMENT VIEWER MODAL ==================== */}
      {/* Displays uploaded files (images, PDFs, etc.) in an iframe */}
      {viewURL && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[80] p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col animate-fade-in-up overflow-hidden">
              
              {/* Viewer Header */}
              <div className="bg-gray-100 px-6 py-4 flex justify-between items-center border-b border-gray-200">
                 <h3 className="font-bold text-gray-800 flex items-center gap-2">
                   <FaFileAlt /> Attachment Viewer
                 </h3>
                 <div className="flex items-center gap-4">
                   {/* Download Button */}
                   <a 
                     href={viewURL}
                     download={viewURL.split('/').pop() || 'attachment'}
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors inline-block"
                     target="_blank" rel="noreferrer"
                   >
                     Download
                   </a>
                   {/* Close Button */}
                   <button 
                     onClick={() => setViewURL(null)} 
                     className="text-gray-500 hover:text-gray-800 bg-gray-200 hover:bg-gray-300 rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold transition-colors"
                   >
                     ✕
                   </button>
                 </div>
              </div>
              
              {/* File Viewer - Iframe displays the actual file */}
              <div className="flex-1 bg-gray-200 flex items-center justify-center">
                 <iframe 
                   src={viewURL} 
                   className="w-full h-full border-none bg-white"
                   title="Attachment Viewer"
                 ></iframe>
              </div>
           </div>
        </div>
      )}

      {/* ==================== NOTICE WRITING MODAL ==================== */}
      {/* Form for sending notifications to application submitters */}
      {noticeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-fade-in-up">
              
              {/* Modal Header */}
              <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
                 <h3 className="font-bold text-lg">Send Notice to {noticeModal.userName || 'Applicant'}</h3>
                 <button onClick={() => setNoticeModal(null)} className="opacity-80 hover:opacity-100 flex items-center justify-center font-bold">
                   ✕
                 </button>
              </div>
              
              {/* Notice Form */}
              <form onSubmit={handleSendNotice} className="p-6">
                 <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Notice Title</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Action Required on your Application"
                      value={noticeTitle}
                      onChange={e => setNoticeTitle(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                 </div>
                 
                 <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Notice Message</label>
                    <textarea 
                      required
                      placeholder="Detail instructions for the applicant..."
                      value={noticeMessage}
                      onChange={e => setNoticeMessage(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2 h-32 resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                 </div>
                 
                 {/* Submit Button */}
                 <button 
                  type="submit" 
                  disabled={isSendingNotice}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-xl transition-colors"
                 >
                    {isSendingNotice ? 'Sending...' : 'Send Notice'}
                 </button>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}