'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaSearch, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaFacebookF, FaInstagram, FaLinkedinIn } from 'react-icons/fa';
import Sidebar, { MobileHeader } from '@/components/Sidebar';
import TopHeader from '@/components/TopHeader';

export default function AgentHomePage() {
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [notices, setNotices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [servicesMap, setServicesMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'agent') {
      router.push('/dashboard');
      return;
    }

    setAgent(parsedUser);

    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    const fetchDashboardData = async () => {
      try {
        const [noticesRes, requestsRes, servicesRes, usersRes] = await Promise.all([
          fetch(`/api/agents/${parsedUser.id}/notices`, { headers: authHeaders }).then(r => r.json()),
          fetch(`/api/applications?agentId=${parsedUser.id}`, { headers: authHeaders }).then(r => r.json()),
          fetch('/api/admin/services', { headers: authHeaders }).then(r => r.json()),
          fetch('/api/users', { headers: authHeaders }).then(r => r.json()),
        ]);

        setNotices(noticesRes.notices || []);
        setRequests(Array.isArray(requestsRes) ? requestsRes : []);

        const serviceEntries = Array.isArray(servicesRes.services) ? servicesRes.services : servicesRes || [];
        const serviceMap = {};
        serviceEntries.forEach(service => {
          if (service?.id) serviceMap[service.id] = service;
        });
        setServicesMap(serviceMap);

        const userEntries = Array.isArray(usersRes) ? usersRes : usersRes?.users || [];
        const userMap = {};
        userEntries.forEach(user => {
          if (user?.id) userMap[user.id] = user;
        });
        setUsersMap(userMap);
      } catch (error) {
        console.error('Agent dashboard load error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const pendingRequests = requests.filter(r => ['pending_payment', 'pending_review', 'new', 'waiting'].includes(r.status)).length;
  const inProgressRequests = requests.filter(r => ['approved', 'processing', 'assigned'].includes(r.status)).length;
  const completedRequests = requests.filter(r => ['work_completed', 'completed'].includes(r.status)).length;

  const filteredRequests = requests.filter((request) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;

    const requestId = String(request.id || '').toLowerCase();
    const userName = String(usersMap[request.userId]?.name || '').toLowerCase();
    const serviceName = String(servicesMap[request.serviceId]?.name || '').toLowerCase();
    const status = String(request.status || '').toLowerCase();

    return requestId.includes(query)
      || userName.includes(query)
      || serviceName.includes(query)
      || status.includes(query);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_payment':
      case 'pending_review':
      case 'new':
      case 'waiting':
        return <span className="inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-800">Pending</span>;
      case 'approved':
      case 'assigned':
      case 'processing':
        return <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-800">In Progress</span>;
      case 'work_completed':
      case 'completed':
        return <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-800">Completed</span>;
      case 'rejected':
        return <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-800">Rejected</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-800">{status || 'Unknown'}</span>;
    }
  };

  const getPaymentStatus = (request) => {
    if (request.status === 'pending_payment') return 'Pending';
    if (request.status === 'work_completed' || request.status === 'completed') return 'Paid';
    if (request.paymentDetails?.status) return String(request.paymentDetails.status).replace('_', ' ');
    return 'Processing';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        <MobileHeader
          title="Agent Dashboard"
          subtitle="Assigned requests, progress, and notices."
        />
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-10 py-6 space-y-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Agent Dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back, {agent.name}</h1>
              <p className="mt-2 text-sm leading-6 text-slate-600 max-w-2xl">A simple dashboard for assigned requests, progress, and notices.</p>
            </div>
            <div className="flex items-center justify-end">
              <TopHeader user={agent} setUser={setAgent} noticesCount={notices.length} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Pending Requests', value: pendingRequests },
                  { label: 'In Progress', value: inProgressRequests },
                  { label: 'Completed', value: completedRequests },
                ].map((card) => (
                  <div key={card.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                    <p className="text-sm font-medium text-slate-600">{card.label}</p>
                    <p className="mt-4 text-3xl font-semibold text-slate-900">{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <h2 className="text-lg font-semibold text-slate-900">Recent Assigned Requests</h2>
                  <p className="mt-1 text-sm text-slate-500">Track your newest tasks and keep the work moving.</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600 text-sm font-semibold">
                      <tr>
                        <th className="px-6 py-4">Request ID</th>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Service</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Payment</th>
                        <th className="px-6 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {requests.slice(0, 5).map((request) => (
                        <tr key={request.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900">#{String(request.id).slice(-6)}</td>
                          <td className="px-6 py-4 text-slate-600">{usersMap[request.userId]?.name || 'Unknown'}</td>
                          <td className="px-6 py-4 text-slate-600">{servicesMap[request.serviceId]?.name || 'Service details'}</td>
                          <td className="px-6 py-4">{getStatusBadge(request.status)}</td>
                          <td className="px-6 py-4 text-slate-600">{getPaymentStatus(request)}</td>
                          <td className="px-6 py-4">
                            <Link href="/agent/requests" className="inline-flex items-center rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-700">View</Link>
                          </td>
                        </tr>
                      ))}
                      {requests.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-6 py-16 text-center text-sm text-slate-500">No assigned requests yet. Keep an eye on new opportunities.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Agent Service Information</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Service Contact</h2>
                  </div>
                </div>

                <div className="mt-6 space-y-4 text-sm text-slate-700">
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <div className="mt-0.5 text-slate-500"><FaPhoneAlt size={14} /></div>
                    <div>
                      <p className="text-xs text-slate-500">Phone</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{agent.phoneNumber || '053540221'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <div className="mt-0.5 text-slate-500"><FaEnvelope size={14} /></div>
                    <div>
                      <p className="text-xs text-slate-500">Email</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">{agent.email || 'admin@gmail.com'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4">
                    <div className="mt-0.5 text-slate-500"><FaMapMarkerAlt size={14} /></div>
                    <div>
                      <p className="text-xs text-slate-500">Address</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">Kathmandu, Nepal</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Social</p>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <a href="https://facebook.com/agentprofile" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 transition">
                      <FaFacebookF size={12} /> Facebook
                    </a>
                    <a href="https://instagram.com/agentprofile" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 transition">
                      <FaInstagram size={12} /> Instagram
                    </a>
                    <a href="https://linkedin.com/in/agentprofile" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 transition">
                      <FaLinkedinIn size={12} /> LinkedIn
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Recent Notices</p>
                    <h2 className="mt-2 text-xl font-semibold text-slate-900">Notices</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition">
                      <FaSearch size={12} /> Search
                    </button>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{notices.length} items</span>
                  </div>
                </div>

                <div className="mt-5 space-y-3">
                  {notices.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center text-slate-500">
                      No notices available.
                    </div>
                  ) : (
                    notices.slice(0, 4).map((notice) => (
                      <div key={notice.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">{notice.title}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{notice.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
