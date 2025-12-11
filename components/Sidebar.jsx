'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'DashBoard' },
    { href: '/notice', label: 'NOTICE' },
    { href: '/request', label: 'REQUEST' },
  ];

  return (
    <div className="w-64 bg-[#5C5470] min-h-screen flex flex-col">
      {/* Logo Section */}
      <div className="p-6 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center mb-4">
          <svg
            className="w-16 h-16 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <p className="text-white text-xs text-center font-semibold">
          AGENT BASED SERVICE SYSTEM
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-3 mb-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-[#7C7390] text-white'
                  : 'text-gray-300 hover:bg-[#6B6378] hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}


