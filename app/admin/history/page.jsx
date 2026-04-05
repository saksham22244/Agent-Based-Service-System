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

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Delete this record permanently?')) return;
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Deletion failed');
      setApplications(prev => prev.filter(a => a.id !== id));
      if (viewedApp?.id === id) setViewedApp(null);
      toast.success('Record deleted.');
    } catch (err) {
      toast.error('Failed to delete.');
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
                className="border border-gray-200 rounded-lg px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-gray-400 w-full md:w-64"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>
            ) : filteredApps.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-xl">
                <p className="text-gray-400 font-medium text-sm">No completed tasks found.</p>
              </div>
            ) : (
              <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Service & ID</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Applicant</th>
                      <th className="px-6 py-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-right text-[11px] font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {paginatedApps.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-semibold text-gray-800">{servicesMap[app.serviceId]?.name.replace('\n', ' ')}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5 font-mono">#{app.id.slice(-8).toUpperCase()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-medium text-gray-700">{usersMap[app.userId]?.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[11px] text-gray-400">
                          {new Date(app.updatedAt || app.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 text-xs">
                             <button onClick={() => setViewedApp(app)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><FaEye /></button>
                             <button onClick={() => handleDeleteApplication(app.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors"><FaTrash /></button>
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
                      <p className="text-xs text-gray-800 font-medium">{String(v)}</p>
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
    </div>
  );
}
