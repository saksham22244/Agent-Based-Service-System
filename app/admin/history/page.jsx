'use client';

import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import { FaEye, FaTrash } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function HistoryPage() {
  // --- COMPONENT STATE EXPLANATION ---
  // `applications`: Holds the raw history records downloaded from MongoDB
  const [applications, setApplications] = useState([]);
  
  // `servicesMap` & `usersMap`: Used as fast lookup dictionaries. 
  // Instead of scanning the whole database every time we need a user's name, we can do usersMap[id].name
  const [servicesMap, setServicesMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [agents, setAgents] = useState([]);
  
  // Tracks who is explicitly viewing this page (Admin session)
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // `viewedApp`: Stores the specific application object when the Admin clicks the "Eye" icon to read form details
  const [viewedApp, setViewedApp] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom confirm modal state for deletion
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  
  // Pagination control variables
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  // --- DATABASE DOWNLOADING FUNCTION ---
  const fetchData = async () => {
    try {
      setLoading(true); // Spin the loading icon
      
      // 1. Verify the active session internally
      const userStr = localStorage.getItem('user');
      const currentUserData = userStr ? JSON.parse(userStr) : null;
      setCurrentUser(currentUserData);
      if (!currentUserData) return; // Halt execution if they bypassed login

      // 2. Decide Security Role boundaries (Agents only see their OWN history. Admins see ALL history)
      const appsUrl = currentUserData.role === 'agent' 
        ? `/api/applications?agentId=${currentUserData.id}` 
        : `/api/applications`;

      // 3. Parallel fetching: Download all 4 datasets absolutely simultaneously to minimize loading screen time
      const [servicesRes, usersRes, appsRes, agentsRes] = await Promise.all([
        fetch('/api/admin/services').then(r => r.json()),
        fetch('/api/users').then(r => r.json()), 
        fetch(appsUrl).then(r => r.json()), // Uses our dynamic URL from step 2
        fetch('/api/agents').then(r => r.json())
      ]);

      // 4. Optimization: Convert Lists into Dictionaries (HashMaps)
      // This is crucial for rendering speed! Finding a user's name by ID normally loops an entire array.
      // Dictionaries allow instant lookups O(1) time complexity.
      const sMap = {};
      (servicesRes.services || []).forEach(s => { sMap[s.id] = s; });
      setServicesMap(sMap);

      const uMap = {};
      (usersRes || []).forEach(u => { uMap[u.id] = u; });
      setUsersMap(uMap);

      // Save arrays to state
      setApplications(appsRes || []);
      setAgents(agentsRes || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await fetch(`/api/applications/${deleteConfirmId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');
      setApplications(prev => prev.filter(a => a.id !== deleteConfirmId));
      if (viewedApp?.id === deleteConfirmId) setViewedApp(null);
      toast.success('Record deleted.');
    } catch (err) {
      toast.error('Failed to delete.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // --- LOCAL SEARCH BAR LOGIC ---
  // React calculates this filter logic in real-time as the Admin types globally without calling the DB again.
  const filteredApps = applications.filter(app => {
    // Security Rule: The 'History' page ONLY formats apps that are officially completed!
    if (app.status !== 'work_completed') return false; 
    
    // Grab the related reference names using our HashMaps
    const svc = servicesMap[app.serviceId]?.name || '';
    const usr = usersMap[app.userId];
    const uName = usr?.name || '';
    const tkId = app.id.slice(-8); // Generate an 8-character visually pleasing tracking ID string
    
    // Check if the user's typed string matches ANY parameter globally
    const q = searchQuery.toLowerCase();
    return svc.toLowerCase().includes(q) || uName.toLowerCase().includes(q) || tkId.toLowerCase().includes(q) || !searchQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filteredApps.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedApps = filteredApps.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Task History</h1>
                <p className="text-sm text-gray-500">Archive of completed service requests</p>
              </div>
              <input 
                type="text" 
                placeholder="Search by ticket or name..." 
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-gray-400 w-full md:w-64 text-gray-900 bg-white placeholder-gray-500"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-400 font-medium text-sm">No completed tasks found.</p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Service & ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Applicant</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {paginatedApps.map((app) => (
                      <tr key={app.id} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-gray-900">{servicesMap[app.serviceId]?.name.replace('\n', ' ')}</div>
                          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 w-max font-mono mt-1">#{app.id.slice(-8).toUpperCase()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-800">{usersMap[app.userId]?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                          {new Date(app.updatedAt || app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 text-xs">
                             <button onClick={() => setViewedApp(app)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100 shadow-sm" title="View"><FaEye className="w-4 h-4" /></button>
                             <button onClick={() => setDeleteConfirmId(app.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors border border-red-100 shadow-sm" title="Delete"><FaTrash className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button 
                    key={i} 
                    onClick={() => setCurrentPage(i + 1)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${currentPage === i + 1 ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {viewedApp && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="font-bold text-gray-800 text-sm">Application Details</h3>
              <button onClick={() => setViewedApp(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Applicant</label>
                  <p className="text-sm font-medium text-gray-800">{usersMap[viewedApp.userId]?.name}</p>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Service</label>
                  <p className="text-sm font-medium text-gray-800">{servicesMap[viewedApp.serviceId]?.name}</p>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase block mb-2">Form Data</label>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  {Object.entries(viewedApp.formData || {}).map(([k, v]) => (
                    <div key={k} className="border-b border-gray-100 last:border-0 pb-2 mb-2 last:pb-0 last:mb-0">
                      <p className="text-[10px] text-gray-500 font-bold capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                      {typeof v === 'string' && v.includes('/uploads/applications/') ? (
                        <div className="mt-1 flex items-center gap-4">
                          <img src={v} alt={k} className="max-w-[70%] h-32 object-contain rounded-md border border-gray-200" />
                          <div className="flex flex-col gap-2">
                            <a href={v} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-xs font-semibold transition-colors border border-blue-100">Open full size</a>
                            <a href={v} download={v.split('/').pop() || 'document'} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md text-xs font-semibold transition-colors border border-green-100">Download</a>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-800 font-medium">{String(v)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 text-right">
              <button onClick={() => setViewedApp(null)} className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Deletion</h3>
              <p className="text-gray-500 text-sm">Are you sure you want to permanently delete this record? This action cannot be undone.</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button 
                onClick={() => setDeleteConfirmId(null)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete} 
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
