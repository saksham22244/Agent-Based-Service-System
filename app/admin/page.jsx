'use client';

// React hooks used for state and page-load side effects.
import { useEffect, useState } from 'react';

// Next.js router used for navigation, mainly logout redirect.
import { useRouter } from 'next/navigation';

// Reusable dashboard layout/navigation components.
import Sidebar, { MobileHeader } from '@/components/Sidebar';

// Modal form components used by admin to create users, agents, and notices.
import UserForm from '@/components/UserForm';
import AgentForm from '@/components/AgentForm';
import NoticeForm from '@/components/NoticeForm';

// Toast notification library.
import { toast } from 'react-toastify';

export default function DashboardPage() {
  const router = useRouter();

  // Combined list of users and agents shown in the dashboard table/card list.
  const [items, setItems] = useState([]);

  // Filter state: all, user, or agent.
  const [filter, setFilter] = useState('all');

  // Search text used to filter by name, email, or phone number.
  const [searchQuery, setSearchQuery] = useState('');

  // Loading state while users and agents are being fetched.
  const [loading, setLoading] = useState(true);

  // Stores the selected item for the View Details modal.
  const [viewModal, setViewModal] = useState(null);

  // Stores delete confirmation data: id, type, and name.
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Stores approve confirmation data for pending agents.
  const [approveConfirm, setApproveConfirm] = useState(null);

  // Controls Add User modal visibility.
  const [addUserModal, setAddUserModal] = useState(false);

  // Controls Add Agent modal visibility.
  const [addAgentModal, setAddAgentModal] = useState(false);

  // Controls Send Notice modal visibility.
  const [noticeModal, setNoticeModal] = useState(false);

  // Separate raw user and agent arrays are kept for NoticeForm recipients.
  const [users, setUsers] = useState([]);
  const [agents, setAgents] = useState([]);

  // Pagination state.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Validates Nepali-style 10 digit phone numbers.
  // It removes non-digits first, then checks length and starting digit.
  const validatePhoneNumber = (phone) => {
    const digitsOnly = phone?.toString().replace(/\D/g, '');

    if (!digitsOnly || digitsOnly.length === 0) {
      return { valid: false, message: 'Phone number is required' };
    }

    if (digitsOnly.length !== 10) {
      return { valid: false, message: 'Phone number must be exactly 10 digits' };
    }

    if (!/^[6-9]\d{9}$/.test(digitsOnly)) {
      return { valid: false, message: 'Phone number must start with 6,7,8, or 9' };
    }

    return { valid: true, message: '', digitsOnly };
  };

  // Runs once when the dashboard page loads.
  // It fetches users and agents from the backend.
  useEffect(() => {
    fetchData();
  }, []);

  // Fetches users and agents, combines them, sorts by newest first,
  // and stores them in dashboard state.
  const fetchData = async () => {
    try {
      // Token is saved during login.
      // It is sent to APIs that support Authorization headers.
      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      // Fetch users and agents in parallel for faster dashboard loading.
      const [usersRes, agentsRes] = await Promise.all([
        fetch('/api/users', { headers: authHeaders }),
        fetch('/api/agents', { headers: authHeaders }),
      ]);

      // Handle user API error.
      if (!usersRes.ok) {
        const err = await usersRes.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to fetch users');
      }

      // Handle agent API error.
      if (!agentsRes.ok) {
        const err = await agentsRes.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Failed to fetch agents');
      }

      const usersData = await usersRes.json();
      const agentsData = await agentsRes.json();

      // APIs may return either direct arrays or wrapped objects.
      // This keeps the frontend safe for both response formats.
      const usersArray = Array.isArray(usersData) ? usersData : (usersData?.users || []);
      const agentsArray = Array.isArray(agentsData) ? agentsData : (agentsData?.agents || []);

      setUsers(usersArray);
      setAgents(agentsArray);

      // Hide default super admin from dashboard list so admin cannot manage/delete it.
      const filteredUsers = usersArray.filter((u) => u.email !== 'admin@example.com');

      // Add a type field so the UI can distinguish users and agents.
      const combined = [
        ...filteredUsers.map((u) => ({ ...u, type: 'user' })),
        ...agentsArray.map((a) => ({ ...a, type: 'agent', approved: a.approved || false })),
      ];

      // Newest accounts appear first.
      combined.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });

      setItems(combined);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };
 
  // Opens delete confirmation modal.
  // Prevents deleting the hard-coded super admin account.
  const handleDeleteClick = (id, type) => {
    const item = items.find((i) => i.id === id);

    if (type === 'user' && item && item.email === 'admin@example.com') {
      toast.error('Cannot delete super admin user!');
      return;
    }

    const itemName = item?.name || 'this item';
    setDeleteConfirm({ id, type, name: itemName });
  };

  // Confirms deletion and calls the correct API based on item type.
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;

    const { id, type } = deleteConfirm;
    setDeleteConfirm(null);

    try {
      const endpoint = type === 'user' ? `/api/users/${id}` : `/api/agents/${id}`;
      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
      });

      if (response.ok) {
        toast.success('Successfully deleted!');
        await fetchData();
      } else {
        const data = await response.json();
        toast.error(`Failed to delete: ${data.error || data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting:', error);
      toast.error(`An error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Approves a pending agent by setting approved: true.
  const handleApproveConfirm = async () => {
    if (!approveConfirm) return;

    const { id } = approveConfirm;
    setApproveConfirm(null);

    try {
      const response = await fetch(`/api/agents/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ approved: true }),
      });

      if (response.ok) {
        await fetchData();
        toast.success('Agent approved successfully!');
      } else {
        toast.error('Failed to approve agent');
      }
    } catch (error) {
      console.error('Error approving agent:', error);
      toast.error('An error occurred while approving agent');
    }
  };

  // Creates a new user from UserForm data.
  const handleAddUser = async (userData) => {
    const phoneValidation = validatePhoneNumber(userData.phoneNumber);

    if (!phoneValidation.valid) {
      toast.error(phoneValidation.message);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          ...userData,
          phoneNumber: phoneValidation.digitsOnly,
          verified: true,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAddUserModal(false);
        toast.success('User created successfully!');
        await fetchData();
      } else {
        toast.error(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('An error occurred while creating user');
    }
  };

  // Creates a new agent from AgentForm FormData.
  const handleAddAgent = async (formData) => {
    const phoneNumber = formData.get('phoneNumber');
    const phoneValidation = validatePhoneNumber(phoneNumber);

    if (!phoneValidation.valid) {
      toast.error(phoneValidation.message);
      return;
    }

    try {
      const validatedFormData = new FormData();

      // Copy all form fields, but replace phone number with cleaned digits.
      for (const [key, value] of formData.entries()) {
        if (key === 'phoneNumber') {
          validatedFormData.append(key, phoneValidation.digitsOnly);
        } else {
          validatedFormData.append(key, value);
        }
      }

      // Admin-created agent is approved immediately.
      validatedFormData.append('approved', 'true');

      const response = await fetch('/api/agents', {
        method: 'POST',
        body: validatedFormData,
      });

      const data = await response.json();

      if (response.ok) {
        setAddAgentModal(false);
        toast.success('Agent account created successfully!');
        await fetchData();
      } else {
        toast.error(data.error || 'Failed to create agent');
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      toast.error('An error occurred while creating agent');
    }
  };

  // Sends a notice using NoticeForm data.
  const handleSendNotice = async (noticeData) => {
    try {
      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch('/api/admin/notices/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(noticeData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send notice');
      }

      return data;
    } catch (error) {
      console.error('Error sending notice:', error);
      throw error;
    }
  };

  // Redirects to login after confirmation.
  // Note: this does not clear localStorage. If you want true logout,
  // also remove token and user from localStorage.
  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      router.push('/login');
    }
  };

  // Applies filter and search to the combined user/agent list.
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

  // Pagination calculation.
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop sidebar navigation. */}
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile header appears on smaller screens. */}
        <MobileHeader title="Admin Dashboard" subtitle="Manage users, agents, and system settings." />

        {/* Desktop top accent line. */}
        <div className="hidden lg:flex h-1 bg-gradient-to-r from-blue-500 to-indigo-600 flex-shrink-0"></div>

        {/* Desktop dashboard header with action buttons. */}
        <div className="hidden lg:flex bg-white px-6 py-4 border-b flex-shrink-0 flex-col sm:flex-row sm:items-center justify-between shadow-sm gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-xs text-gray-500 mt-1">Manage users, agents, and system settings.</p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {/* Opens Add User modal. */}
            <button
              onClick={() => setAddUserModal(true)}
              className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Add User
            </button>

            {/* Opens Add Agent modal. */}
            <button
              onClick={() => setAddAgentModal(true)}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Add Agent
            </button>

            {/* Opens Send Notice modal. */}
            <button
              onClick={() => setNoticeModal(true)}
              className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Send Notice
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col w-full">
          <div className="p-4 flex flex-col flex-1">
            {/* Filter and search controls. */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3 flex-shrink-0">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All
                </button>

                <button
                  onClick={() => setFilter('user')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filter === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  USER
                </button>

                <button
                  onClick={() => setFilter('agent')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    filter === 'agent' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  AGENT
                </button>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs w-full sm:w-auto max-w-xs text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* User/agent list container. */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="divide-y divide-gray-200">
                {loading ? (
                  <div className="p-6 text-center text-gray-500 text-sm">Loading...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 text-sm">No items found</div>
                ) : (
                  paginatedItems.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar or first letter fallback. */}
                          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 flex-shrink-0">
                            {item.profilePicture || item.photoUrl ? (
                              <img
                                src={item.profilePicture || item.photoUrl}
                                alt={item.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-sm font-bold text-slate-500 capitalize">
                                {item.name?.charAt(0) || 'U'}
                              </span>
                            )}
                          </div>

                          <span className="text-sm font-semibold text-gray-900 truncate">{item.name}</span>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          {/* View modal button. */}
                          <button
                            onClick={() => setViewModal(item)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                            title="View"
                          >
                            View
                          </button>

                          {/* Delete confirmation button. */}
                          <button
                            onClick={() => handleDeleteClick(item.id, item.type)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            title="Delete"
                          >
                            Delete
                          </button>

                          {/* Approve button only appears for pending agents. */}
                          {item.type === 'agent' && !item.approved && (
                            <button
                              onClick={() => setApproveConfirm({ id: item.id, name: item.name })}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                              title="Approve"
                            >
                              Approve
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-1 pl-1">
                        <span className="text-xs font-medium text-gray-400 w-14 flex-shrink-0">Phone:</span>
                        <span className="text-xs text-gray-700">{item.phoneNumber}</span>
                      </div>

                      <div className="flex items-center gap-2 mb-2 pl-1">
                        <span className="text-xs font-medium text-gray-400 w-14 flex-shrink-0">Email:</span>
                        <span className="text-xs text-gray-700 break-all">{item.email}</span>
                      </div>

                      <div className="flex gap-2 pl-1">
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {item.type === 'user' ? 'User' : 'Agent'}
                        </span>

                        {item.type === 'agent' && (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              item.approved ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {item.approved ? 'Approved' : 'Pending'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination buttons. */}
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
          </div>
        </div>
      </div>

      {/* View Details modal. */}
      {viewModal && (
        <div
          className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setViewModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">View Details</h2>
            <p className="text-gray-900 font-semibold">{viewModal.name}</p>
            <p className="text-gray-700">{viewModal.email}</p>
            <p className="text-gray-700">{viewModal.phoneNumber}</p>
            <p className="text-gray-700">{viewModal.address}</p>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewModal(null)}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation modal. */}
      {deleteConfirm && (
        <div
          className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Confirmation</h2>
            <p className="text-gray-600 mb-3">
              Are you sure you want to delete this {deleteConfirm.type}?
            </p>
            <p className="text-lg font-semibold text-gray-900">{deleteConfirm.name}</p>
            <p className="text-red-600 text-sm font-medium mt-4">This action cannot be undone!</p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setDeleteConfirm(null);
                  toast.info('Deletion cancelled');
                }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve Agent modal. */}
      {approveConfirm && (
        <div
          className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setApproveConfirm(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Approve Agent</h2>
            <p className="text-gray-600 mb-3">Are you sure you want to approve this agent?</p>
            <p className="text-lg font-semibold text-gray-900">{approveConfirm.name}</p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setApproveConfirm(null)}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleApproveConfirm}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User modal. UserForm calls handleAddUser on submit. */}
      {addUserModal && (
        <div
          className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setAddUserModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New User</h2>
            <UserForm onSubmit={handleAddUser} onCancel={() => setAddUserModal(false)} />
          </div>
        </div>
      )}

      {/* Add Agent modal. AgentForm calls handleAddAgent on submit. */}
      {addAgentModal && (
        <div
          className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity"
          onClick={() => setAddAgentModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Agent</h2>
            <AgentForm onSubmit={handleAddAgent} onCancel={() => setAddAgentModal(false)} />
          </div>
        </div>
      )}

      {/* Notice modal. NoticeForm receives users and agents as recipients. */}
      {noticeModal && (
        <NoticeForm
          onClose={() => setNoticeModal(false)}
          onSubmit={handleSendNotice}
          users={users}
          agents={agents}
        />
      )}
    </div>
  );
}
