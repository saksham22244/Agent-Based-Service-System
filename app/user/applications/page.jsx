'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { FaEye, FaPrint } from 'react-icons/fa';

export default function UserApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [servicesMap, setServicesMap] = useState({});
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (!userStr || JSON.parse(userStr).role !== 'user') {
      router.push('/login');
      return;
    }
    const user = JSON.parse(userStr);

    Promise.all([
      fetch('/api/admin/services').then(res => res.json()),
      fetch(`/api/applications?userId=${user.id}`).then(res => res.json())
    ]).then(([servicesData, appsData]) => {
      const sMap = {};
      (servicesData.services || []).forEach(s => { sMap[s.id] = s; });
      setServicesMap(sMap);
      const activeApps = (appsData || []).filter(app => app.status !== 'work_completed');
      setApplications(activeApps);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [router]);

  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending_payment': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'pending_review': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'approved': return 'Approved - Processing finalization';
      case 'rejected': return 'Rejected';
      case 'pending_payment': return 'Awaiting Payment Configuration';
      case 'pending_review': return 'Under Operational Review';
      default: return status;
    }
  };

  const totalPages = Math.max(1, Math.ceil(applications.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedApps = applications.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-[#5C5470] flex-shrink-0"></div>
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-6">Active Service Tracker</h2>
        
        {loading ? (
          <div className="flex justify-center items-center h-48">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : applications.length === 0 ? (
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
          <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Service Requested</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date Logged</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Operational Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedApps.map(app => (
                  <tr key={app.id} className="hover:bg-blue-50/40 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-gray-900 text-base">
                        {servicesMap[app.serviceId] ? servicesMap[app.serviceId].name.replace('\n', ' ') : 'Unknown Process Configuration'}
                      </div>
                      <div className="text-xs font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded w-max mt-1.5">
                        TKT-{app.id.slice(-8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium text-gray-600">
                      {new Date(app.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className={`px-4 py-1.5 inline-flex text-xs font-bold uppercase tracking-wider rounded-full border shadow-sm ${getStatusColor(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm font-medium">
                      
                      {app.status === 'approved' ? (
                        <button className="text-green-600 hover:text-green-800 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200 inline-flex items-center gap-2 transition-colors">
                          <FaPrint /> Print Validated Receipt
                        </button>
                      ) : (
                        <button className="text-gray-500 hover:text-gray-900 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 inline-flex items-center gap-2 transition-colors">
                          <FaEye /> Inspection Open
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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
    </div>
  );
}
