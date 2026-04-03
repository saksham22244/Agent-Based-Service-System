'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { FaHistory, FaCheckCircle, FaPrint } from 'react-icons/fa';

export default function UserHistoryPage() {
  const router = useRouter();
  const [applications, setApplications] = useState([]);
  const [servicesMap, setServicesMap] = useState({});
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
      
      const historyApps = (appsData || []).filter(app => app.status === 'work_completed');
      setApplications(historyApps);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [router]);

  const totalPages = Math.max(1, Math.ceil(applications.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedApps = applications.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Task History</h2>
            <p className="text-sm text-gray-500 mt-1">Archive of your completed service requests</p>
          </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-48">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-100 text-center">
             <p className="text-gray-500 mb-6 font-medium">No completed tasks yet.</p>
             <Link href="/user/applications" className="text-indigo-600 hover:underline font-semibold">
               Check Active Tracker
             </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-100 font-sans">
              <thead className="bg-gray-50/50">
                <tr>
                  <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Service Item</th>
                  <th scope="col" className="px-6 py-4 text-left text-[11px) font-bold text-gray-400 uppercase tracking-widest">Completed On</th>
                  <th scope="col" className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">Status</th>
                  <th scope="col" className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedApps.map(app => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-semibold text-gray-800 text-sm">
                        {servicesMap[app.serviceId] ? servicesMap[app.serviceId].name.replace('\n', ' ') : 'Service'}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        TKT-{app.id.slice(-8).toUpperCase()}
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-xs text-gray-500 font-medium">
                      {new Date(app.updatedAt || app.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="px-2.5 py-0.5 inline-flex text-[10px] font-bold rounded bg-green-50 text-green-600 border border-green-100">
                        COMPLETED
                      </span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <button 
                        className="text-gray-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-all"
                        onClick={() => window.print()}
                        title="Print Certificate"
                      >
                        <FaPrint className="text-sm" />
                      </button>
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
                          ? 'bg-indigo-600 text-white border-indigo-600'
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
