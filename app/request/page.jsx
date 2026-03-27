'use client';

import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaFileAlt, FaEye } from 'react-icons/fa';

export default function RequestPage() {
  const [applications, setApplications] = useState([]);
  const [servicesMap, setServicesMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Viewing application modal
  const [viewedApp, setViewedApp] = useState(null);

  // Search feature
  const [searchQuery, setSearchQuery] = useState('');

  // Notice modal
  const [noticeModal, setNoticeModal] = useState(null);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [isSendingNotice, setIsSendingNotice] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const userStr = localStorage.getItem('user');
      const currentUser = userStr ? JSON.parse(userStr) : null;
      if (!currentUser) return;

      const appsUrl = currentUser.role === 'agent' 
        ? `/api/applications?agentId=${currentUser.id}` 
        : `/api/applications`;

      const [servicesRes, usersRes, appsRes] = await Promise.all([
        fetch('/api/admin/services').then(r => r.json()),
        fetch('/api/users').then(r => r.json()), 
        fetch(appsUrl).then(r => r.json())
      ]);

      const sMap = {};
      (servicesRes.services || []).forEach(s => { sMap[s.id] = s; });
      setServicesMap(sMap);

      const uMap = {};
      (usersRes || []).forEach(u => { uMap[u.id] = u; });
      setUsersMap(uMap);

      setApplications(appsRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    if (!window.confirm(`Mark this application as ${status.toUpperCase()}?`)) return;

    try {
      const res = await fetch(`/api/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error('Failed to update status');

      // Optimistically update
      setApplications(prev => prev.map(app => app.id === id ? { ...app, status } : app));
      setViewedApp(null);
      alert('Application status updated successfully.');
    } catch (error) {
      alert('Error updating application. Please try again.');
    }
  };

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

      setApplications(prev => prev.map(app => app.id === id ? { ...app, assignedAgentId: currentUser.id } : app));
      setViewedApp(prev => ({ ...prev, assignedAgentId: currentUser.id }));
      alert('Application claimed successfully! You can now review and approve/reject it.');
    } catch (err) {
      alert('Error claiming application. It might have been claimed by someone else already.');
    }
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to completely delete this application record?')) return;
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');
      setApplications(prev => prev.filter(a => a.id !== id));
      if (viewedApp?.id === id) setViewedApp(null);
      alert('Application record deleted successfully.');
    } catch (err) {
      alert('Failed to delete application record.');
      console.error(err);
    }
  };

  const handleSendNotice = async (e) => {
    e.preventDefault();
    if (!noticeTitle || !noticeMessage) return alert('Please fill in title and message.');
    
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
      alert('Notice dispatched to user successfully!');
      setNoticeModal(null);
      setNoticeTitle('');
      setNoticeMessage('');
    } catch (err) {
      alert('Error sending notice. Try again.');
      console.error(err);
    } finally {
      setIsSendingNotice(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="bg-green-100 text-green-800 border border-green-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Rejected</span>;
      case 'pending_payment': return <span className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">Pending Payment</span>;
      case 'pending_review': return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide animate-pulse shadow-sm">Needs Validation</span>;
      default: return <span className="bg-gray-100 text-gray-800 border px-3 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  const filteredApps = applications.filter(app => {
    const svc = servicesMap[app.serviceId]?.name || '';
    const usr = usersMap[app.userId];
    const uName = usr?.name || '';
    const uEmail = usr?.email || '';
    const tkId = app.id.slice(-8);
    const q = searchQuery.toLowerCase();
    return svc.toLowerCase().includes(q) || uName.toLowerCase().includes(q) || uEmail.toLowerCase().includes(q) || tkId.toLowerCase().includes(q) || !searchQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedApps = filteredApps.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-600 flex-shrink-0"></div>
        <div className="bg-white px-6 py-4 border-b flex-shrink-0 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Applications</h1>
            <p className="text-xs text-gray-500 mt-1">Review and manage recent requests.</p>
          </div>
          <div className="flex items-center gap-4">
            <input 
              type="text" 
              placeholder="Search by ticket, user, or email..." 
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none w-64 placeholder-gray-500"
            />
            <span className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 tracking-wide">
              {applications.filter(a => a.status === 'pending_review').length} Pending Reviews
            </span>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto w-full">
          {loading ? (
             <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
          ) : applications.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center max-w-lg mx-auto mt-10">
              <FaFileAlt className="text-5xl text-blue-100 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-800 mb-2">No Requests Found</h2>
              <p className="text-gray-500 text-sm">You do not have any applications waiting for review at the moment.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service Details</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Submitted</th>
                    <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedApps.map((app) => {
                    const svc = servicesMap[app.serviceId];
                    const usr = usersMap[app.userId];
                    return (
                      <tr key={app.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{svc ? svc.name.replace('\n', ' ') : 'Unknown Service'}</div>
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 w-max font-mono mt-1 pt-0">TKT-{app.id.slice(-8).toUpperCase()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-gray-800">{usr ? usr.name : 'Unknown User'}</div>
                          <div className="text-xs text-gray-500">{usr ? usr.email : ''}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                          {new Date(app.createdAt).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(app.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            onClick={() => setViewedApp(app)}
                            className="inline-flex items-center px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 font-bold rounded-lg transition-colors border border-blue-200"
                          >
                            <FaEye className="mr-2" /> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

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
          )}
        </div>
      </div>

      {/* Review Modal Deep Insight Tool */}
      {viewedApp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-fade-in-up">
             
             <div className="bg-white px-8 py-6 flex justify-between items-center border-b border-gray-100">
               <div>
                 <h3 className="text-xl font-bold text-gray-900">Application Review</h3>
                 <p className="text-gray-500 text-sm mt-1">Ticket #{viewedApp.id.slice(-8).toUpperCase()} • Service: {servicesMap[viewedApp.serviceId]?.name.replace('\n', ' ')}</p>
               </div>
               <button onClick={() => setViewedApp(null)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
                 ✕
               </button>
             </div>

             <div className="flex-1 overflow-y-auto p-8 bg-gray-50 flex flex-col gap-8">
               {/* Applicant Identity Module */}
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
               </div>

               {/* Form Fields Payload Section */}
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
                         const isFileObj = typeof value === 'string' && value.includes('/uploads/applications/');
                         return (
                           <div key={key} className="mb-4">
                             <p className="text-sm font-medium text-gray-500 mb-1 capitalize">
                               {key.replace(/([A-Z])/g, ' $1').trim()}
                             </p>
                             {isFileObj ? (
                               <a href={value} target="_blank" rel="noreferrer" className="inline-flex py-2 px-4 bg-blue-50 text-blue-600 rounded mb-2 hover:bg-blue-100 transition-colors text-sm">
                                 <FaFileAlt className="mr-2" /> View Attachment
                               </a>
                             ) : (
                               <p className="text-gray-900 bg-gray-50 px-4 py-2 border border-gray-200 rounded-lg">{value}</p>
                             )}
                           </div>
                         );
                      })
                    )}
                 </div>
               </div>
             </div>              <div className="bg-gray-50 border-t border-gray-200 p-6 flex justify-between items-center rounded-b-2xl">
                 <div className="flex items-center gap-3">
                   <span className="text-sm font-medium text-gray-600">Status:</span>
                   {getStatusBadge(viewedApp.status)}
                </div>
                
                <div className="flex gap-3 items-center">
                  <button onClick={() => handleDeleteApplication(viewedApp.id)} className="text-red-600 hover:text-red-700 font-medium px-2 py-1 hover:bg-red-50 rounded transition-colors text-sm">
                    Delete
                  </button>
                  <button onClick={() => setNoticeModal({ userId: viewedApp.userId, userName: usersMap[viewedApp.userId]?.name })} className="text-blue-600 hover:text-blue-700 font-medium px-2 py-1 hover:bg-blue-50 rounded transition-colors text-sm">
                    Send Notice
                  </button>

                  {!viewedApp.assignedAgentId && viewedApp.status === 'pending_review' ? (
                     <button 
                       onClick={() => handleClaimRequest(viewedApp.id)}
                       className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center shadow-md text-sm ml-2"
                     >
                       Claim Request to Review
                     </button>
                  ) : viewedApp.status === 'pending_review' ? (
                    <>
                      <button 
                        onClick={() => handleUpdateStatus(viewedApp.id, 'rejected')}
                        className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 bg-white font-medium rounded-lg transition-colors flex items-center text-sm ml-2"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(viewedApp.id, 'approved')}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center text-sm ml-2"
                      >
                        Approve
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setViewedApp(null)} className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-medium rounded-lg transition-colors border border-gray-300 text-sm ml-2">
                      Close
                    </button>
                  )}
                </div>
             </div>

           </div>
        </div>
      )}

      {/* Notice Writing Modal */}
      {noticeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-fade-in-up">
              <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
                 <h3 className="font-bold text-lg">Send Notice to {noticeModal.userName || 'Applicant'}</h3>
                 <button onClick={() => setNoticeModal(null)} className="opacity-80 hover:opacity-100 flex items-center justify-center font-bold">✕</button>
              </div>
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
                    ></textarea>
                 </div>
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


