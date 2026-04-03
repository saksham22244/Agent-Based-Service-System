'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaSignOutAlt } from 'react-icons/fa';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [navItems, setNavItems] = useState([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === 'user') {
          setNavItems([
            { href: '/user', label: 'HOME' },
            { href: '/user/notices', label: 'NOTICES' },
            { href: '/user/services', label: 'SERVICES' },
            { href: '/user/applications', label: 'TRACKER' },
            { href: '/user/history', label: 'HISTORY' },
            { href: '/send-notice', label: 'CONTACT ADMIN' }
          ]);
        } else if (user.role === 'agent') {
          setNavItems([
            { href: '/agent', label: 'HOME' },
            { href: '/agent/work', label: 'WORK DASHBOARD' },
            { href: '/agent/notices', label: 'NOTICES' },
            { href: '/request', label: 'REQUESTS' },
            { href: '/history', label: 'HISTORY' },
            { href: '/service', label: 'SERVICES' },
            { href: '/payment-history', label: 'PAYMENT DETAILS' },
            { href: '/send-notice', label: 'CONTACT ADMIN' }
          ]);
        } else {
          // Admin / Superadmin
          setNavItems([
            { href: '/dashboard', label: 'DASHBOARD' },
            { href: '/admin/agent-management', label: 'AGENT MANAGEMENT' },
            { href: '/admin/inbox', label: 'INBOX' },
            { href: '/admin/agent-payments', label: 'QUICK PAYMENTS' },
            { href: '/notice', label: 'SEND NOTICES' },
            { href: '/request', label: 'REQUESTS' },
            { href: '/history', label: 'HISTORY' },
            { href: '/service', label: 'SERVICES' }
          ]);
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      router.push('/login');
    }
  };

  return (
    <div className="w-64 bg-[#5C5470] min-h-screen flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.1)] flex-shrink-0 z-[100] relative rounded-r-xl">
      {/* Logo Section */}
      <div className="p-8 flex flex-col items-center border-b border-white/5">
        <div className="w-24 h-24 rounded-full bg-blue-500 shadow-inner flex items-center justify-center mb-4">
          <svg
            className="w-16 h-16 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <p className="text-white text-xs text-center font-black tracking-widest mt-2 uppercase opacity-90 leading-tight">
          AGENT BASED<br />SERVICE SYSTEM
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-5 py-3.5 rounded-xl font-bold tracking-wider transition-all duration-200 ${isActive
                    ? 'bg-[#7C7390] text-white shadow-md transform scale-[1.02]'
                    : 'text-white/80 hover:bg-[#6B6378] hover:text-white hover:scale-[1.02]'
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Logout Block */}
      <div className="p-5 border-t border-white/5">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#48425C] hover:bg-red-500 hover:text-white text-white/80 rounded-xl font-black tracking-widest border border-transparent hover:border-red-400 transition-all shadow-md active:scale-95"
        >
          <FaSignOutAlt />
          LOGOUT
        </button>
      </div>
    </div>
  );
}
