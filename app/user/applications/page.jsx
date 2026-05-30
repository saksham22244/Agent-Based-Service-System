'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { FaEye, FaPrint } from 'react-icons/fa';

export default function UserApplicationsPage() {
  // Router for navigation between pages
  const router = useRouter();
  
  // State: Stores all user applications
  const [applications, setApplications] = useState([]);
  // State: Maps service IDs to service objects for quick lookup
  const [servicesMap, setServicesMap] = useState({});
  
  // Pagination state: Current page number
  const [currentPage, setCurrentPage] = useState(1);
  // How many items to show per page
  const itemsPerPage = 8;
  // Loading state for data fetching
  const [loading, setLoading] = useState(true);

  // Runs when page loads - checks auth and fetches user's applications
  useEffect(() => {
    // Get logged-in user from localStorage
    const userStr = localStorage.getItem('user');
    // If not logged in or not a regular user, redirect to login
    if (!userStr || JSON.parse(userStr).role !== 'user') {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);

    // Fetch both services and user applications in parallel
    Promise.all([
      fetch('/api/admin/services').then(res => res.json()),      // Get all services
      fetch(`/api/applications?userId=${user.id}`).then(res => res.json()) // Get user's apps
    ]).then(([servicesData, appsData]) => {
      // Build lookup map: service ID -> service object
      const sMap = {};
      (servicesData.services || []).forEach(s => { sMap[s.id] = s; });
      setServicesMap(sMap);
      
      // Filter out completed applications (only show active ones)
      const activeApps = (appsData || []).filter(app => app.status !== 'work_completed');
      setApplications(activeApps);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [router]);

  // Returns different background/text colors based on application status
  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Returns user-friendly status labels for display
  const getStatusLabel = (status) => {
    switch(status) {
      case 'approved': return 'Approved - Processing finalization';
      case 'rejected': return 'Rejected';
      case 'pending_payment': return 'Awaiting Payment Configuration';
      case 'pending_review': return 'Under Operational Review';
      default: return status;
    }
  };

  // Calculate total number of pages needed
  const totalPages = Math.max(1, Math.ceil(applications.length / itemsPerPage));
  // Prevent going beyond last page or below first page
  const safeCurrentPage = Math.min(currentPage, totalPages);
  // Calculate starting index for slicing the array
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  // Get current page's applications from the filtered array
  const paginatedApps = applications.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        {/* Top gradient bar - visual accent */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-[#5C5470] flex-shrink-0"></div>
        
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          {/* Page title */}
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Active Service Tracker</h2>
        
        {/* Show loading spinner while fetching data */}
        {loading ? (
          <div className="flex justify-center items-center h-48">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : applications.length === 0 ? (
          // Empty state - no applications found
          <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
             <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-100">
               <span className="text-3xl">📁</span>
             </div>
             <p className="text-gray-600 mb-8 font-medium">You have not submitted any service applications yet to the operations desk.</p>
             <Link href="/user/services" className="inline-block px-8 py-3 bg-blue-600 hover:bg-blue-700 transition shadow-lg text-white font-bold rounded-xl text-lg">
               Browse Available Services Directory ➔
             </Link>
          </div>
        ) : (
          // Applications table - shows all user requests
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              {/* Table header */}
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service Requested</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Logged</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Operational Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Loop through applications for current page */}
                {paginatedApps.map(app => (
                  <tr key={app.id} className="hover:bg-blue-50/40 transition-colors">
                    {/* Service name and ticket ID */}
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-900 text-base">
                        {servicesMap[app.serviceId] ? servicesMap[app.serviceId].name.replace('\n', ' ') : 'Unknown Process Configuration'}
                      </div>
                      {/* Ticket ID - shows last 8 characters of application ID */}
                      <div className="text-xs font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded w-max mt-1.5">
                        TKT-{app.id.slice(-8).toUpperCase()}
                      </div>
                    </td>
                    
                    {/* Submission date and time */}
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-600">
                      {new Date(app.createdAt).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    
                    {/* Status badge with color coding */}
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-4 py-1.5 inline-flex text-xs font-bold uppercase tracking-wider rounded-full border shadow-sm ${getStatusColor(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                    
                    {/* Action buttons based on status */}
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      
                      {/* If approved: Show Print button */}
                      {app.status === 'approved' ? (
                        <button className="text-green-600 hover:text-green-800 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 inline-flex items-center gap-2 transition-colors">
                          <FaPrint /> Print Validated Receipt
                        </button>
                      ) : (
                        // If not approved: Show Inspection/View button
                        <button className="text-gray-500 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 inline-flex items-center gap-2 transition-colors">
                          <FaEye /> Inspection Open
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls - shows page numbers */}
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-1.5 text-xs text-gray-700 bg-gray-50 px-4 py-3 border-t border-gray-200">
                <span className="mr-0.5">Show</span>
                {/* Generate buttons for each page */}
                {Array.from({ length: totalPages }).map((_, index) => {
                  const pageNumber = index + 1;
                  return (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setCurrentPage(pageNumber)}
                      className={`px-2 py-0.5 rounded border text-xs transition-colors ${
                        safeCurrentPage === pageNumber
                          ? 'bg-blue-600 text-white border-blue-600' // Active page style
                          : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-100' // Inactive page style
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
    </div>
  );
}