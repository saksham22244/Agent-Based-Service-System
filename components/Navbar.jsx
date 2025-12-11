'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/users', label: 'Users' },
    { href: '/agents', label: 'Agents' },
  ];

  return (
    <nav className="bg-[#5C5470] shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo / Title */}
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center mr-4">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <h1 className="text-white text-lg font-semibold">
              Agent Based Service System
            </h1>
          </div>

          {/* Navigation Links */}
          <div className="hidden sm:flex sm:space-x-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    isActive
                      ? 'bg-[#7C7390] text-white'
                      : 'text-gray-300 hover:bg-[#6B6378] hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Logout */}
          <div>
            <Link
              href="/login"
              className="px-4 py-2 rounded-lg text-gray-300 hover:bg-[#6B6378] hover:text-white font-medium transition-colors"
            >
              Logout
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
