'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBell, FaUserCircle, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Sidebar from '@/components/Sidebar';

export default function AgentHomePage() {
  const router = useRouter();
  const [agent, setAgent] = useState(null);
  const [notices, setNotices] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);

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
    
    // Fetch data for the dashboard
    fetch(`/api/agents/${parsedUser.id}/notices`)
      .then(res => res.json())
      .then(noticesData => {
        setNotices(noticesData.notices || []);
        setLoading(false);
      }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#514b62]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto w-full">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-[#5C5470] flex-shrink-0"></div>
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
          
          <div className="flex justify-between items-center bg-white p-8 rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Agent Dashboard</h2>
              <p className="text-gray-500 text-[15px]">Welcome back, <span className="font-semibold text-gray-700">{agent?.name || 'Agent'}</span>. Check your latest notices and manage requests efficiently.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 p-12 flex flex-col items-center justify-center min-h-[400px]">
               <h2 className="text-center text-3xl font-serif font-black mb-4 tracking-wide text-gray-800">
                 WELCOME TO YOUR DASHBOARD
               </h2>
               <p className="text-gray-500 text-center max-w-lg leading-relaxed text-[15px]">
                 Use the sidebar navigation to view notices, manage your services, process user requests, and check payment histories all from one clear interface.
               </p>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-gray-100 p-8 overflow-y-auto max-h-[500px] flex flex-col">
               <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4 shrink-0">
                  <h3 className="font-bold font-sans text-xl tracking-wide text-gray-900">Recent Notices</h3>
                  <FaBell className="text-blue-500" size={20} />
               </div>
               
               <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                  {notices.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                      <FaBell className="text-3xl mb-3 opacity-20" />
                      <p className="text-sm italic">No new notices currently.</p>
                    </div>
                  ) : notices.map(n => (
                    <div key={n.id} className="bg-blue-50/50 rounded-lg p-4 border border-blue-100 hover:bg-blue-50 transition-colors">
                       <p className="text-[14px] font-bold text-blue-900 mb-1 leading-tight">{n.title}</p>
                       <p className="text-[13px] text-blue-800/80 line-clamp-3 leading-relaxed">{n.message}</p>
                    </div>
                  ))}
               </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
