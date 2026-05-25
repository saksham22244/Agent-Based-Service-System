'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FaSignOutAlt, FaBars, FaTimes } from 'react-icons/fa';

// Export the mobile header bar separately so pages can include it in their own header
export function MobileHeader({ title, subtitle, rightContent }) {
  const [isOpen, setIsOpen] = useState(false);
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
            { href: '/user/send-notice', label: 'CONTACT ADMIN' }
          ]);
        } else if (user.role === 'agent') {
          setNavItems([
            { href: '/agent', label: 'HOME' },
            { href: '/agent/work', label: 'WORK DASHBOARD' },
            { href: '/agent/notices', label: 'NOTICES' },
            { href: '/agent/requests', label: 'REQUESTS' },
            { href: '/agent/history', label: 'HISTORY' },
            { href: '/agent/services', label: 'SERVICES' },
            { href: '/agent/payment-history', label: 'PAYMENT DETAILS' },
            { href: '/agent/send-notice', label: 'CONTACT ADMIN' }
          ]);
        } else {
          setNavItems([
            { href: '/admin', label: 'DASHBOARD' },
            { href: '/admin/agent-management', label: 'AGENT MANAGEMENT' },
            { href: '/admin/inbox', label: 'INBOX' },
            { href: '/admin/agent-payments', label: 'QUICK PAYMENTS' },
            { href: '/admin/notices', label: 'NOTICES' },
            { href: '/admin/requests', label: 'REQUESTS' },
            { href: '/admin/history', label: 'HISTORY' },
            { href: '/admin/services', label: 'SERVICES' }
          ]);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => { setIsOpen(false); }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  return (
    <>
      {/* Mobile top bar - only visible on mobile */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsOpen(true)}
            className="w-9 h-9 bg-[#5C5470] text-white rounded-lg flex items-center justify-center shadow flex-shrink-0"
          >
            <FaBars size={16} />
          </button>
          <div>
            <h1 className="text-base font-bold text-gray-900 leading-tight">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
        </div>
        {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
      </div>

      {/* Mobile drawer overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-[300] flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsOpen(false)} />
          <div className="relative z-10 w-64 bg-[#5C5470] h-full flex flex-col shadow-xl">
            <div className="p-5 flex flex-col items-center border-b border-white/10">
              <button onClick={() => setIsOpen(false)} className="self-end text-white/70 hover:text-white mb-2">
                <FaTimes size={18} />
              </button>
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mb-2">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <p className="text-white text-xs text-center font-black tracking-widest uppercase leading-tight">
                AGENT BASED<br />SERVICE SYSTEM
              </p>
            </div>
            <nav className="flex-1 px-3 py-4 overflow-y-auto">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}
                  className={`block px-4 py-3 rounded-xl font-bold tracking-wider text-sm mb-1 transition-all ${
                    pathname === item.href ? 'bg-[#7C7390] text-white' : 'text-white/80 hover:bg-[#6B6378] hover:text-white'
                  }`}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10">
              <button onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#48425C] hover:bg-red-500 text-white/80 hover:text-white rounded-xl font-black tracking-widest text-sm transition-all">
                <FaSignOutAlt /> LOGOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Default export: desktop sidebar (hidden on mobile)
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
            { href: '/user/send-notice', label: 'CONTACT ADMIN' }
          ]);
        } else if (user.role === 'agent') {
          setNavItems([
            { href: '/agent', label: 'HOME' },
            { href: '/agent/work', label: 'WORK DASHBOARD' },
            { href: '/agent/notices', label: 'NOTICES' },
            { href: '/agent/requests', label: 'REQUESTS' },
            { href: '/agent/history', label: 'HISTORY' },
            { href: '/agent/services', label: 'SERVICES' },
            { href: '/agent/payment-history', label: 'PAYMENT DETAILS' },
            { href: '/agent/send-notice', label: 'CONTACT ADMIN' }
          ]);
        } else {
          setNavItems([
            { href: '/admin', label: 'DASHBOARD' },
            { href: '/admin/agent-management', label: 'AGENT MANAGEMENT' },
            { href: '/admin/inbox', label: 'INBOX' },
            { href: '/admin/agent-payments', label: 'QUICK PAYMENTS' },
            { href: '/admin/notices', label: 'NOTICES' },
            { href: '/admin/requests', label: 'REQUESTS' },
            { href: '/admin/history', label: 'HISTORY' },
            { href: '/admin/services', label: 'SERVICES' }
          ]);
        }
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    router.push('/login');
  };

  // Desktop only — hidden on mobile
  return (
    <div className="hidden lg:flex w-64 bg-[#5C5470] min-h-screen sticky top-0 flex-col shadow-[4px_0_24px_rgba(0,0,0,0.1)] flex-shrink-0 z-[100] rounded-r-xl">
      <div className="p-6 flex flex-col items-center border-b border-white/5">
        <div className="w-20 h-20 rounded-full bg-blue-500 shadow-inner flex items-center justify-center mb-3">
          <svg className="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <p className="text-white text-xs text-center font-black tracking-widest uppercase opacity-90 leading-tight">
          AGENT BASED<br />SERVICE SYSTEM
        </p>
      </div>
      <nav className="flex-1 px-4 py-4 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}
            className={`block px-4 py-3 rounded-xl font-bold tracking-wider text-sm mb-1 transition-all duration-200 ${
              pathname === item.href ? 'bg-[#7C7390] text-white shadow-md' : 'text-white/80 hover:bg-[#6B6378] hover:text-white'
            }`}>
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-white/5">
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#48425C] hover:bg-red-500 hover:text-white text-white/80 rounded-xl font-black tracking-widest border border-transparent hover:border-red-400 transition-all shadow-md text-sm">
          <FaSignOutAlt /> LOGOUT
        </button>
      </div>
    </div>
  );
}
