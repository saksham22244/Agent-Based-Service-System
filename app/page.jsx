'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true') setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: '🤝', title: 'Agent Network', desc: 'Connect with verified local agents who handle your service requests professionally and efficiently.' },
    { icon: '📋', title: 'Service Tracking', desc: 'Track every application in real-time from submission to completion with full transparency.' },
    { icon: '💳', title: 'Secure Payments', desc: 'Pay securely through eSewa integration. All transactions are encrypted and protected.' },
    { icon: '📢', title: 'Instant Notices', desc: 'Receive real-time notifications and updates about your applications via email and in-app alerts.' },
    { icon: '🛡️', title: 'Verified Agents', desc: 'Every agent is vetted and approved by our admin team before they can handle any requests.' },
    { icon: '📊', title: 'Full History', desc: 'Access complete history of all your past services, payments, and communications anytime.' },
  ];

  const testimonials = [
    { name: 'Sauryaa K.', role: 'Regular User', text: 'Getting my birth certificate was so easy. The agent handled everything and I just tracked it online. Amazing service!', avatar: 'S' },
    { name: 'Avimanyu R.', role: 'Business Owner', text: 'I use this for all my document needs. The agents are professional and the payment system is seamless.', avatar: 'A' },
    { name: 'Ankita S.', role: 'Student', text: 'Applied for my income certificate without leaving home. The whole process took just 2 days. Highly recommend!', avatar: 'A' },
  ];

  const faqs = [
    { q: 'How do I get started?', a: 'Simply sign up as a user, browse available services, submit your application, and an agent will be assigned to handle it.' },
    { q: 'How are agents verified?', a: 'All agents go through a strict approval process by our admin team before they can accept any service requests.' },
    { q: 'What payment methods are supported?', a: 'We currently support eSewa for secure digital payments. More payment options are coming soon.' },
    { q: 'How long does a service take?', a: 'Processing time varies by service type. You can track the real-time status of your application at any time.' },
    { q: 'Can I become an agent?', a: 'Yes! Sign up as an agent, complete your profile, and submit for admin approval. Once approved, you can start accepting requests.' },
  ];

  const [openFaq, setOpenFaq] = useState(null);

  const dm = darkMode;

  return (
    <div className={`${dm ? 'dark bg-gray-950 text-white' : 'bg-white text-gray-900'} min-h-screen transition-colors duration-300`}>

      {/* Navbar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? (dm ? 'bg-gray-900/95 shadow-lg' : 'bg-white/95 shadow-lg') : 'bg-transparent'} backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">A</span>
              </div>
              <span className={`font-black text-lg ${dm ? 'text-white' : 'text-gray-900'}`}>AgentServe</span>
            </div>

            {/* Desktop nav links */}
            <div className="hidden md:flex items-center gap-8">
              {['Home', 'Features', 'Pricing', 'Contact'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`}
                  className={`text-sm font-medium transition-colors hover:text-blue-600 ${dm ? 'text-gray-300' : 'text-gray-600'}`}>
                  {item}
                </a>
              ))}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <button onClick={() => setDarkMode(!dm)}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${dm ? 'bg-gray-800 text-yellow-400 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {dm ? '☀️' : '🌙'}
              </button>
              <Link href="/login"
                className={`hidden md:block text-sm font-semibold px-4 py-2 rounded-lg transition-colors ${dm ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'}`}>
                Login
              </Link>
              <Link href="/login"
                className="hidden md:block text-sm font-semibold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm">
                Get Started
              </Link>
              {/* Mobile menu button */}
              <button onClick={() => setMenuOpen(!menuOpen)}
                className={`md:hidden w-9 h-9 rounded-lg flex items-center justify-center ${dm ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700'}`}>
                {menuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className={`md:hidden px-4 pb-4 pt-2 ${dm ? 'bg-gray-900' : 'bg-white'} border-t ${dm ? 'border-gray-800' : 'border-gray-100'}`}>
            {['Home', 'Features', 'Pricing', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}
                className={`block py-2 text-sm font-medium ${dm ? 'text-gray-300' : 'text-gray-700'}`}>
                {item}
              </a>
            ))}
            <div className="flex gap-3 mt-3">
              <Link href="/login" className={`flex-1 text-center py-2 text-sm font-semibold rounded-lg border ${dm ? 'border-gray-700 text-gray-300' : 'border-gray-300 text-gray-700'}`}>Login</Link>
              <Link href="/login" className="flex-1 text-center py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className={`relative pt-24 pb-20 px-4 overflow-hidden ${dm ? 'bg-gray-950' : 'bg-gradient-to-br from-blue-50 via-white to-indigo-50'}`}>
        {/* Background blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl translate-y-1/2 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6 ${dm ? 'bg-blue-900/50 text-blue-300 border border-blue-800' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
            🚀 Nepal's #1 Agent-Based Service Platform
          </div>
          <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 ${dm ? 'text-white' : 'text-gray-900'}`}>
            Get Any Government
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Service Done</span>
            <br />Without Leaving Home
          </h1>
          <p className={`text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
            Connect with verified local agents who handle your document requests, certificates, and government services — fast, secure, and hassle-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg transition-all shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transform">
              Get Started Free →
            </Link>
            <Link href="/login"
              className={`px-8 py-4 font-bold rounded-xl text-lg transition-all border-2 hover:-translate-y-0.5 transform ${dm ? 'border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800' : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50'}`}>
              Login to Account
            </Link>
          </div>
          <p className={`mt-6 text-sm ${dm ? 'text-gray-500' : 'text-gray-400'}`}>
            ✓ Free to sign up &nbsp; ✓ Verified agents &nbsp; ✓ Secure payments
          </p>
        </div>

        {/* Stats */}
        <div className="max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-6 relative z-10">
          {[['500+', 'Services Completed'], ['50+', 'Verified Agents'], ['99%', 'Satisfaction Rate']].map(([num, label]) => (
            <div key={label} className={`text-center p-4 rounded-2xl ${dm ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-100 shadow-sm'}`}>
              <div className="text-2xl sm:text-3xl font-black text-blue-600">{num}</div>
              <div className={`text-xs sm:text-sm mt-1 ${dm ? 'text-gray-400' : 'text-gray-500'}`}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 px-4 ${dm ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className={`text-3xl sm:text-4xl font-black mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>
              Everything You Need
            </h2>
            <p className={`text-lg max-w-xl mx-auto ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
              A complete platform for managing government services through trusted local agents.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title}
                className={`p-6 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-lg cursor-default ${dm ? 'bg-gray-800 border-gray-700 hover:border-blue-700' : 'bg-white border-gray-100 hover:border-blue-200 hover:shadow-blue-50'}`}>
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className={`text-lg font-bold mb-2 ${dm ? 'text-white' : 'text-gray-900'}`}>{f.title}</h3>
                <p className={`text-sm leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className={`py-20 px-4 ${dm ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className={`text-3xl sm:text-4xl font-black mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>What Users Say</h2>
            <p className={`text-lg ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Real experiences from real users.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name}
                className={`p-6 rounded-2xl border ${dm ? 'bg-gray-900 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
                </div>
                <p className={`text-sm leading-relaxed mb-5 ${dm ? 'text-gray-300' : 'text-gray-700'}`}>"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">{t.avatar}</div>
                  <div>
                    <div className={`font-bold text-sm ${dm ? 'text-white' : 'text-gray-900'}`}>{t.name}</div>
                    <div className={`text-xs ${dm ? 'text-gray-500' : 'text-gray-500'}`}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={`py-20 px-4 ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-blue-50 to-indigo-50'}`}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className={`text-3xl sm:text-4xl font-black mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>Simple Pricing</h2>
            <p className={`text-lg ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Pay only for the services you use. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Basic', price: 'Free', desc: 'For individuals getting started', features: ['Browse all services', 'Submit applications', 'Track status', 'Email notifications'], highlight: false },
              { name: 'Standard', price: 'Rs. 500', desc: 'Per service request', features: ['Everything in Basic', 'Priority agent assignment', 'Faster processing', 'Dedicated support', 'Full history access'], highlight: true },
              { name: 'Agent', price: 'Free', desc: 'Earn by helping others', features: ['Accept service requests', 'Earn per completion', 'Flexible schedule', 'Admin support', 'Payment dashboard'], highlight: false },
            ].map((plan) => (
              <div key={plan.name}
                className={`p-6 rounded-2xl border-2 transition-all ${plan.highlight
                  ? 'border-blue-600 bg-blue-600 text-white shadow-xl shadow-blue-500/20 scale-105'
                  : dm ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                {plan.highlight && <div className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full w-fit mb-4">MOST POPULAR</div>}
                <h3 className={`text-xl font-black mb-1 ${plan.highlight ? 'text-white' : dm ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className={`text-3xl font-black mb-1 ${plan.highlight ? 'text-white' : 'text-blue-600'}`}>{plan.price}</div>
                <p className={`text-sm mb-5 ${plan.highlight ? 'text-blue-100' : dm ? 'text-gray-400' : 'text-gray-500'}`}>{plan.desc}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-blue-100' : dm ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className={plan.highlight ? 'text-white' : 'text-blue-600'}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login"
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${plan.highlight
                    ? 'bg-white text-blue-600 hover:bg-blue-50'
                    : dm ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={`py-20 px-4 ${dm ? 'bg-gray-950' : 'bg-white'}`}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className={`text-3xl sm:text-4xl font-black mb-4 ${dm ? 'text-white' : 'text-gray-900'}`}>Frequently Asked Questions</h2>
            <p className={`text-lg ${dm ? 'text-gray-400' : 'text-gray-600'}`}>Everything you need to know.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i}
                className={`rounded-xl border overflow-hidden ${dm ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-gray-50'}`}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className={`w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-sm transition-colors ${dm ? 'text-white hover:bg-gray-800' : 'text-gray-900 hover:bg-gray-100'}`}>
                  {faq.q}
                  <span className={`text-lg transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className={`px-6 pb-4 text-sm leading-relaxed ${dm ? 'text-gray-400' : 'text-gray-600'}`}>
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 text-lg mb-8">Join hundreds of users who save time with AgentServe.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl text-lg hover:bg-blue-50 transition-all shadow-lg">
              Create Free Account
            </Link>
            <Link href="/login" className="px-8 py-4 border-2 border-white/50 text-white font-bold rounded-xl text-lg hover:bg-white/10 transition-all">
              Login →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className={`py-12 px-4 ${dm ? 'bg-gray-900 border-t border-gray-800' : 'bg-gray-900'}`}>
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-black text-sm">A</span>
                </div>
                <span className="font-black text-lg text-white">AgentServe</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Nepal's trusted platform for agent-based government services.</p>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2">
                {['Features', 'Pricing', 'How it Works', 'Security'].map(item => (
                  <li key={item}><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Company</h4>
              <ul className="space-y-2">
                {['About Us', 'Blog', 'Careers', 'Contact'].map(item => (
                  <li key={item}><a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">{item}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold mb-4 text-sm uppercase tracking-wider">Connect</h4>
              <div className="flex gap-3">
                {['𝕏', 'f', 'in', '▶'].map((icon, i) => (
                  <a key={i} href="#"
                    className="w-9 h-9 bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white rounded-lg flex items-center justify-center text-sm font-bold transition-all">
                    {icon}
                  </a>
                ))}
              </div>
              <div className="mt-4">
                <p className="text-gray-400 text-sm">np03cs4a230546@heraldcollege.edu.np</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-sm">© 2025 AgentServe. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
