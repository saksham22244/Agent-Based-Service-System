'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaBell, FaUserCircle, FaEnvelope, FaMapMarkerAlt, FaPhoneAlt, FaTimes } from 'react-icons/fa';

export default function UserHomePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notices, setNotices] = useState([]);
  const [services, setServices] = useState([]);
  const [showProfile, setShowProfile] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userData);
    if (parsedUser.email === 'admin@example.com' || parsedUser.role === 'superadmin') {
      router.push('/dashboard');
      return;
    }

    setUser(parsedUser);
    
    // Fetch data for the dashboard
    Promise.all([
      fetch(`/api/users/${parsedUser.id}/notices`).then(res => res.json()),
      fetch('/api/admin/services').then(res => res.json())
    ]).then(([noticesData, servicesData]) => {
      setNotices(noticesData.notices || []);
      const activeServices = (servicesData.services || []).filter(s => s.approvalStatus === 'approved');
      
      // Fallback dummy services mimicking the screenshot if database lacks exact matches
      const displayServices = activeServices.length > 0 ? activeServices : [
        { 
          id: '1', 
          name: 'MARRIAGE CERTIFICATE',
          color: 'bg-[#FFF9E6]',
          borderColor: 'border-[#F8E39A]',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Prithvi_Narayan_Shah_1.jpg/220px-Prithvi_Narayan_Shah_1.jpg'
        },
        { 
          id: '2', 
          name: 'SSSS',
          color: 'bg-[#EAFAEE]',
          borderColor: 'border-[#adebbd]',
          imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Prithvi_Narayan_Shah_1.jpg/220px-Prithvi_Narayan_Shah_1.jpg'
        }
      ];
      setServices(displayServices);
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

  if (!user) return null;

  return (
    <div className="flex h-screen bg-[#514b62] overflow-hidden font-sans">
      
      {/* Left Navigation Area */}
      <div className="w-[300px] flex flex-col items-center pt-8 z-10">
        
        {/* Logo Circle */}
        <div className="w-40 h-40 bg-white rounded-full flex flex-col items-center justify-center shadow-lg mb-10 p-2">
           <div className="w-12 h-12 rounded-full border-[1.5px] border-[#103061] flex items-center justify-center mb-1 overflow-hidden bg-[#e6effc]">
             {/* Abstract agent silhouette mimicking logo */}
             <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#103061] mt-2">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
             </svg>
           </div>
           <div className="text-center font-serif text-[#103061]">
             <div className="text-[12px] font-bold tracking-tight leading-none uppercase">AGENT BASED</div>
             <div className="text-[8px] tracking-widest font-semibold mt-0.5 text-gray-500 uppercase">SERVICE SYSTEM</div>
           </div>
        </div>

        {/* Vertical Links */}
        <div className="w-full px-10 space-y-6">
           <Link href="/user" className="block w-full text-center py-2.5 bg-[#7888c0] text-white rounded-lg font-bold tracking-wide shadow-md">
             HOME
           </Link>
           <Link href="/user/services" className="block w-full text-center py-2.5 text-white font-bold tracking-wide hover:bg-[#7888c0]/40 rounded-lg transition-colors">
             SCHEDULE
           </Link>
           <Link href="/user/applications" className="block w-full text-center py-2.5 text-white font-bold tracking-wide hover:bg-[#7888c0]/40 rounded-lg transition-colors">
             HISTORY
           </Link>
           <Link href="/user/notices" className="block w-full text-center py-2.5 text-white font-bold tracking-wide hover:bg-[#7888c0]/40 rounded-lg transition-colors">
             CONTACT US
           </Link>
        </div>

      </div>

      {/* Main Window Area */}
      <div className="flex-1 flex flex-col relative h-full">
        
        {/* Top Header */}
        <div className="h-28 flex items-center justify-between px-10 text-white z-10 w-full pr-16 translate-y-2">
           <h1 className="text-[34px] font-serif font-bold tracking-wide" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}>
             AGENT BASED&nbsp;&nbsp;SERVICE SYSTEM
           </h1>
           <div className="flex items-center space-x-12">
              <button className="hover:opacity-80 transition-opacity">
                <FaBell size={32} />
              </button>
              <button className="hover:opacity-80 transition-opacity p-0.5 rounded-full border-2 border-white" onClick={() => setShowProfile(!showProfile)}>
                <FaUserCircle size={38} />
              </button>
           </div>
        </div>

        {/* Custom Profile Dropdown exact match */}
        {showProfile && (
           <div className="absolute top-28 right-16 bg-white w-96 rounded-2xl shadow-2xl z-50 border border-gray-200 font-sans overflow-hidden">
              <div className="p-4 flex justify-end">
                 <button onClick={() => setShowProfile(false)}>
                   <FaTimes className="text-gray-600 hover:text-red-500" size={18} />
                 </button>
              </div>
              <div className="px-8 pb-4 flex items-center gap-6 border-b border-gray-200">
                 <div className="text-black">
                   <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                 </div>
                 <span className="font-bold text-gray-800 text-lg tracking-wide uppercase">{user?.name || 'ALICE GREEN'}</span>
              </div>
              <div className="p-8 space-y-5">
                 <div className="flex items-center gap-5 text-gray-800 text-[15px] font-medium">
                    <FaEnvelope size={18} className="text-black" /> 
                    <span>{user?.email || 'Alicegreen@gmail.com'}</span>
                 </div>
                 <div className="flex items-center gap-5 text-gray-800 text-[15px] font-medium">
                    <FaMapMarkerAlt size={18} className="text-black" /> 
                    <span>{user?.address || 'Naxal, Kathmandu'}</span>
                 </div>
                 <div className="flex items-center gap-5 text-gray-800 text-[15px] font-medium">
                    <FaPhoneAlt size={18} className="text-black" /> 
                    <span>{user?.phoneNumber || '9812345678'}</span>
                 </div>
              </div>
              <div className="flex justify-between items-center px-8 py-5 border-t border-gray-200 text-sm font-semibold text-[#6a80c9]">
                 <button className="hover:underline">Edit Profile</button>
                 <button onClick={handleLogout} className="hover:underline">Logout</button>
              </div>
           </div>
        )}

        {/* White Background Inner Content */}
        <div className="flex-1 bg-white w-full rounded-tl-xl mb-4 mr-0 flex overflow-hidden shadow-2xl border-l border-t border-gray-300">
           
           <div className="flex-1 p-12 overflow-y-auto w-full">
              <h2 className="text-center text-3xl font-serif font-black mb-16 tracking-wide text-black" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
                SERVICE REQUEST FORM
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
                 {services.map(s => {
                    // Safe fallbacks for colors if not perfectly defined by the target database objects
                    const bgColor = s.color || 'bg-[#FFF9E6]';
                    const borderColor = s.borderColor || 'border-[#F8E39A]';
                    let displayName = s.name.toUpperCase();

                    return (
                      <Link 
                        href="/user/services" 
                        key={s.id} 
                        className="w-[280px] h-[340px] bg-white border border-gray-200 rounded-[20px] shadow-[0px_4px_15px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0px_10px_25px_rgba(0,0,0,0.15)] transition-all flex flex-col overflow-hidden cursor-pointer group"
                      >
                         <div className={`h-[155px] ${bgColor} ${borderColor} border-b-[1.5px] flex flex-col items-center justify-center p-5 relative shrink-0`}>
                            {s.imageUrl ? (
                              <img src={s.imageUrl} alt={s.name} className="w-[75px] h-[75px] object-cover rounded-full border-[3px] border-white shadow-[0_2px_8px_rgba(0,0,0,0.1)] mb-3 group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-[75px] h-[75px] bg-white rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)] mb-3 group-hover:scale-105 transition-transform">
                                <span className="text-3xl text-gray-400">📄</span>
                              </div>
                            )}
                            <h3 className="text-center font-bold text-[#0A1930] text-sm tracking-wide leading-tight px-2 w-full">
                              {displayName.split(' ').map((word, i) => <span key={i} className="block">{word}</span>)}
                            </h3>
                         </div>
                         <div className="p-5 flex flex-col flex-1 bg-white justify-between">
                           <p className="text-[13px] text-[#4f5b66] leading-relaxed line-clamp-3">
                             {s.description || 'No description provided for this service block.'}
                           </p>
                           <button className="w-full bg-[#1c5fdf] hover:bg-[#154bb3] text-white font-medium tracking-wide py-[10px] rounded-lg transition-colors text-sm shadow-[0_2px_4px_rgba(28,95,223,0.3)] mt-2">
                             Apply Now
                           </button>
                         </div>
                      </Link>
                    );
                 })}
              </div>
           </div>

           {/* Vertical Gray Line Divider */}
           <div className="w-[1.5px] bg-gray-300 h-[85%] my-auto shadow-sm"></div>

           {/* Notices Column */}
           <div className="w-80 border-l border-gray-200 bg-gray-50 p-8 overflow-y-auto">
              <div className="flex justify-between items-center mb-10">
                 <h3 className="font-bold font-sans text-lg tracking-wide text-black">Notices</h3>
                 <FaBell className="text-blue-500" size={20} />
              </div>
              
              <div className="space-y-4 flex-col">
                 {notices.length === 0 ? (
                   <p className="text-sm text-gray-500 italic">No new notices from admin or agents.</p>
                 ) : notices.map(n => (
                   <div key={n.id} className="border-b border-gray-100 pb-3">
                      <p className="text-sm font-bold text-gray-800">{n.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{n.message}</p>
                   </div>
                 ))}
                 
                 {/* Visual stubs if empty to match long list potentially */}
                 {notices.length === 0 && (
                   <div className="opacity-20 pointer-events-none mt-10">
                     <div className="border-b border-gray-200 pb-3 mb-4">
                        <div className="w-1/2 h-3 bg-gray-400 rounded mb-2"></div>
                        <div className="w-full h-2 bg-gray-300 rounded mb-1"></div>
                     </div>
                     <div className="border-b border-gray-200 pb-3 mb-4">
                        <div className="w-2/3 h-3 bg-gray-400 rounded mb-2"></div>
                        <div className="w-full h-2 bg-gray-300 rounded mb-1"></div>
                     </div>
                   </div>
                 )}
              </div>
           </div>
           
        </div>
      </div>
    </div>
  );
}
