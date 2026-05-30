'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const faqs = [
    { q: 'How to get started?', a: 'Sign up, browse services, submit application, agent assigned.' },
    { q: 'Agent verification?', a: 'Strict approval process by admin team.' },
    { q: 'Payment methods?', a: 'eSewa supported.' },
    { q: 'Processing time?', a: 'Varies by service. Track status real-time.' },
    { q: 'Become an agent?', a: 'Sign up as agent, complete profile, wait for approval.' },
  ];

  return (
    <div className="bg-white text-gray-900 min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="font-bold text-lg">AgentBasedServiceSystem</span>
            </div>

            

            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden md:block text-sm px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Login
              </Link>
              <Link href="/user/signup" className="hidden md:block text-sm px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Sign Up 
              </Link>
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden w-9 h-9 bg-gray-100 rounded-lg">
                {menuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden px-4 pb-4 bg-white border-t">
          
            <div className="flex gap-3 mt-3">
              <Link href="/login" className="flex-1 text-center py-2 border rounded-lg">Login</Link>
              <Link href="/login" className="flex-1 text-center py-2 bg-blue-600 text-white rounded-lg">Sign Up</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="pt-28 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-block px-4 py-2 rounded-full text-xs font-bold mb-6 bg-blue-50 text-blue-700">
            🚀 Nepal's Agent Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Government Services<br />
            <span className="text-blue-600">Without Leaving Home</span>
          </h1>
          <p className="text-lg mb-10 text-gray-600">
            Connect with verified local agents for documents, certificates, and more.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/user/signup" className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">
              Get Started →
            </Link>
            <Link href="/login" className="px-8 py-3 border-2 font-bold rounded-lg hover:bg-gray-50">
              Login
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border rounded-lg bg-white">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center px-5 py-3 text-left font-medium"
                >
                  {faq.q}
                  <span className="text-xl">{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-3 text-sm text-gray-600">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Start?</h2>
          <p className="text-blue-100 mb-8">Join hundreds of users saving time with AgentServe.</p>
          <Link href="/user/signup" className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
<footer className="py-12 px-4 bg-gray-900 text-gray-400">
  <div className="max-w-6xl mx-auto text-center">
    <h3 className="text-xl font-bold text-white mb-4">
      Agent Based Service System
    </h3>

    <p className="mb-2">
      Connecting users with verified agents for reliable and efficient services.
    </p>

    <p className="mb-2">
      📧 Email: agentbasedservicesystem@gmail.com
    </p>

    <p className="mb-2">
      📞 Phone: +977-9865417209
    </p>

    <p className="mb-2">
      📍 Location: Kathmandu, Nepal
    </p>

    <div className="flex justify-center gap-6 my-4">
      <a href="#" className="hover:text-white">
        Facebook
      </a>
      <a href="#" className="hover:text-white">
        Instagram
      </a>
    </div>

    <div className="w-full border-t border-gray-700 pt-4 mt-4">
      <p>© 2026 Agent Based Service System. All rights reserved.</p>
    </div>
  </div>
</footer>
    </div>
  );
}