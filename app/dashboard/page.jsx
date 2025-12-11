'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import UserForm from '@/components/UserForm';
import AgentForm from '@/components/AgentForm';
import Image from 'next/image';

export default function DashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewModal, setViewModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      // Check if user is logged in
      const userData = localStorage.getItem('user');
      if (!userData) {
        router.push('/login');
        return;
      }

      const user = JSON.parse(userData);
      
      // Only admin@example.com can access dashboard
      if (user.email !== 'admin@example.com' && user.role !== 'superadmin') {
        // Redirect non-admin users to /user page
        router.push('/user');
        return;
      }

      setIsAuthorized(true);
      fetchData();
    } catch (error) {
      console.error('Authorization error:', error);
      router.push('/login');
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      fetchData();
    }
  }, [isAuthorized]);

  const fetchData = async () => {
    if (!isAuthorized) return;
    
    try {
      const [usersRes, agentsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/agents'),
      ]);

      const users = await usersRes.json();
      const agents = await agentsRes.json();

      // Filter out super admin from display
      const filteredUsers = users.filter((u) => u.email !== 'admin@example.com');

      const combined = [
        ...filteredUsers.map((u) => ({ ...u, type: 'user' })),
        ...agents.map((a) => ({ ...a, type: 'agent' })),
      ];

      setItems(combined);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authorization...</p>
        </div>
      </div>
    );
  }

  const handleDeleteClick = (id, type) => {
    // Get item name for confirmation
    const item = items.find(i => i.id === id);
    
    // Prevent deleting super admin
    if (type === 'user' && item && item.email === 'admin@example.com') {
      alert('Cannot delete super admin user!');
      return;
    }
    
    const itemName = item?.name || 'this item';
    
    // Show custom confirmation modal
    setDeleteConfirm({ id, type, name: itemName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    const { id, type } = deleteConfirm;
    console.log('Proceeding with deletion of:', id, type);
    
    // Close confirmation modal
    setDeleteConfirm(null);

    try {
      const endpoint = type === 'user' ? `/api/users/${id}` : `/api/agents/${id}`;
      console.log('Making DELETE request to:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok) {
        console.log('Delete successful, refreshing data...');
        alert('Successfully deleted!');
        await fetchData();
      } else {
        const errorMessage = data.error || data.message || 'Unknown error';
        alert(`Failed to delete: ${errorMessage}`);
        console.error('Delete failed:', data);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCreateUser = async (userData) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        setShowUserForm(false);
        alert('User created successfully!');
        await fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      alert('An error occurred');
    }
  };

  const handleCreateAgent = async (formData) => {
    try {
      const response = await fetch('/api/agents', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setShowAgentForm(false);
        alert('Agent created successfully!');
        await fetchData();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create agent');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('An error occurred');
    }
  };


  const filteredItems = items.filter((item) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'user' && item.type === 'user') ||
      (filter === 'agent' && item.type === 'agent');

    const matchesSearch =
      searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.phoneNumber.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="h-1 bg-blue-500"></div>
        <div className="bg-white px-6 py-3 border-b">
          <p className="text-blue-800 font-semibold">Admin Dashboard Page</p>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-black">DASHBOARD</h1>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowUserForm(true);
                  setShowAgentForm(false);
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
              >
                Add User
              </button>
              <button
                onClick={() => {
                  setShowAgentForm(true);
                  setShowUserForm(false);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Add Agent
              </button>
            </div>
          </div>

          {/* Forms */}
          {showUserForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create New User</h2>
                <button
                  onClick={() => setShowUserForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <UserForm onSubmit={handleCreateUser} onCancel={() => setShowUserForm(false)} />
            </div>
          )}

          {showAgentForm && (
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Create New Agent</h2>
                <button
                  onClick={() => setShowAgentForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <AgentForm onSubmit={handleCreateAgent} onCancel={() => setShowAgentForm(false)} />
            </div>
          )}

          {/* Filters and Search */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-3">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('user')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                USER
              </button>
              <button
                onClick={() => setFilter('agent')}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  filter === 'agent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                AGENT
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search any Users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      No items found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.phoneNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {item.type === 'user' ? 'Users' : 'Agent'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setViewModal(item);
                            }}
                            className="text-blue-600 hover:text-blue-800 cursor-pointer"
                            title="View"
                            type="button"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Delete button clicked for:', item.id, item.type, item.name);
                              handleDeleteClick(item.id, item.type);
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            className="text-red-600 hover:text-red-800 cursor-pointer p-1 rounded hover:bg-red-50 transition-colors relative z-10"
                            title="Delete"
                            type="button"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                          {item.type === 'agent' && (
                            <button
                              onClick={async () => {
                                if (item.approved) {
                                  alert('Agent is already approved');
                                  return;
                                }
                                if (confirm(`Approve agent: ${item.name}?`)) {
                                  try {
                                    const response = await fetch(`/api/agents/${item.id}`, {
                                      method: 'PATCH',
                                      headers: {
                                        'Content-Type': 'application/json',
                                      },
                                      body: JSON.stringify({ approved: true }),
                                    });
                                    if (response.ok) {
                                      fetchData();
                                    } else {
                                      alert('Failed to approve agent');
                                    }
                                  } catch (error) {
                                    console.error('Error approving agent:', error);
                                    alert('An error occurred');
                                  }
                                }
                              }}
                              className={`flex items-center gap-1 ${
                                item.approved 
                                  ? 'text-green-600 cursor-default' 
                                  : 'text-yellow-600 hover:text-green-600'
                              }`}
                              title={item.approved ? 'Approved' : 'Click to approve'}
                              disabled={item.approved}
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span className="text-xs font-medium">
                                {item.approved ? 'APPROVED' : 'PENDING'}
                              </span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Modal - Transparent Background */}
      {viewModal && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setViewModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full mx-6 max-h-[90vh] overflow-y-auto border-2 border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900">{viewModal.name}</h2>
                <p className="text-gray-500 mt-1">{viewModal.type === 'user' ? 'User Profile' : 'Agent Profile'}</p>
              </div>
              <button
                onClick={() => setViewModal(null)}
                className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Image Display */}
            {viewModal.type === 'agent' && 'photoUrl' in viewModal && viewModal.photoUrl ? (
              <div className="mb-8 flex justify-center">
                <div className="w-full max-w-md h-96 relative rounded-xl overflow-hidden border-4 border-white shadow-xl">
                  <Image
                    src={viewModal.photoUrl}
                    alt={viewModal.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            ) : viewModal.type === 'user' ? (
              <div className="mb-8 flex justify-center">
                <div className="w-48 h-48 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-8 border-white shadow-xl">
                  <svg
                    className="w-24 h-24 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              </div>
            ) : null}
            
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 space-y-6 shadow-inner">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 block text-sm">Email Address</span>
                  <span className="text-gray-900 text-lg">{viewModal.email}</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 block text-sm">Phone Number</span>
                  <span className="text-gray-900 text-lg">{viewModal.phoneNumber}</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 block text-sm">Address</span>
                  <span className="text-gray-900 text-lg">{viewModal.address}</span>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-semibold text-gray-700 block text-sm">Category</span>
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                      {viewModal.type === 'user' ? 'USER' : 'AGENT'}
                    </span>
                  </div>
                  {viewModal.type === 'user' && 'role' in viewModal && (
                    <div>
                      <span className="font-semibold text-gray-700 block text-sm">Role</span>
                      <span className="px-4 py-2 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {viewModal.role.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Transparent Background */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-6 border-2 border-gray-100" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Delete Confirmation</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to permanently delete this item?
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-lg font-semibold text-gray-900">
                  "{deleteConfirm.name}"
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Type: <span className="font-medium text-blue-600">{deleteConfirm.type.toUpperCase()}</span>
                </p>
              </div>
              
              <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r mb-6">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p className="text-red-700 text-sm">
                    This action cannot be undone. All associated data will be permanently removed.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}