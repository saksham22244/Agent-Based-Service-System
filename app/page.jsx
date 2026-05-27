'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const features = [
    { icon: '🤝', title: 'Agent Network', desc: 'Connect with verified local agents who handle your service requests professionally.' },
    { icon: '📋', title: 'Service Tracking', desc: 'Track every application in real-time from submission to completion.' },
    { icon: '💳', title: 'Secure Payments', desc: 'Pay securely through eSewa. All transactions are encrypted and protected.' },
    { icon: '📢', title: 'Instant Notices', desc: 'Receive real-time notifications about your applications via email and in-app alerts.' },
    { icon: '🛡️', title: 'Verified Agents', desc: 'Every agent is vetted and approved by our admin team before handling requests.' },
    { icon: '📊', title: 'Full History', desc: 'Access complete history of all your past services, payments, and communications.' },
  ];

  const testimonials = [
    { name: 'Sauryaa K.', role: 'Regular User', text: 'Getting my birth certificate was so easy. The agent handled everything and I just tracked it online.', avatar: 'S' },
    { name: 'Avimanyu R.', role: 'Business Owner', text: 'I use this for all my document needs. The agents are professional and the payment system is seamless.', avatar: 'A' },
    { name: 'Ankita S.', role: 'Student', text: 'Applied for my income certificate without leaving home. The whole process took just 2 days.', avatar: 'A' },
  ];

  const faqs = [
    { q: 'How do I get started?', a: 'Sign up as a user, browse available services, submit your application, and an agent will be assigned to handle it.' },
    { q: 'How are agents verified?', a: 'All agents go through a strict approval process by our admin team before they can accept any service requests.' },
    { q: 'What payment methods are supported?', a: 'We currently support eSewa for secure digital payments.' },
    { q: 'How long does a service take?', a: 'Processing time varies by service type. You can track the real-time status of your application at any time.' },
    { q: 'Can I become an agent?', a: 'Yes! Sign up as an agent, complete your profile, and submit for admin approval. Once approved, you can start accepting requests.' },
  ];

  return (
    <div className="bg-white text-gray-900 min-h-screen">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-black text-sm">A</span>
              </div>
              <span className="font-black text-lg text-gray-900">AgentServe</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {['Home', 'Features', 'Pricing', 'Contact'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                  {item}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login"
                className="hidden md:block text-sm font-semibold px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Login
              </Link>
              <Link href="/login"
                className="hidden md:block text-sm font-semibold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                Get Started
              </Link>
              <button onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center bg-gray-100 text-gray-700">
                {menuOpen ? '✕' : '☰'}
              </button>
            </div>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden px-4 pb-4 pt-2 bg-white border-t border-gray-100">
            {['Home', 'Features', 'Pricing', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMenuOpen(false)}
                className="block py-2 text-sm font-medium text-gray-700">
                {item}
              </a>
            ))}
            <div className="flex gap-3 mt-3">
              <Link href="/login" className="flex-1 text-center py-2 text-sm font-semibold rounded-lg border border-gray-300 text-gray-700">Login</Link>
              <Link href="/login" className="flex-1 text-center py-2 text-sm font-semibold rounded-lg bg-blue-600 text-white">Get Started</Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section id="home" className="pt-28 pb-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold mb-6 bg-blue-50 text-blue-700 border border-blue-100">
            🚀 Nepal's Agent-Based Service Platform
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 text-gray-900">
            Get Government Services Done
            <span className="text-blue-600"> Without Leaving Home</span>
          </h1>
          <p className="text-lg sm:text-xl mb-10 max-w-2xl mx-auto leading-relaxed text-gray-600">
            Connect with verified local agents who handle your document requests, certificates, and government services — fast, secure, and hassle-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg transition-all shadow-md hover:shadow-lg">
              Get Started Free →
            </Link>
            <Link href="/login"
              className="px-8 py-4 font-bold rounded-xl text-lg transition-all border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50">
              Login to Account
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-400">
            ✓ Free to sign up &nbsp;·&nbsp; ✓ Verified agents &nbsp;·&nbsp; ✓ Secure payments
          </p>
        </div>

        {/* Stats */}
        <div className="max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[['500+', 'Services Completed'], ['50+', 'Verified Agents'], ['99%', 'Satisfaction Rate']].map(([num, label]) => (
            <div key={label} className="text-center p-5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="text-2xl sm:text-3xl font-black text-blue-600">{num}</div>
              <div className="text-xs sm:text-sm mt-1 text-gray-500">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-gray-900">Everything You Need</h2>
            <p className="text-lg max-w-xl mx-auto text-gray-600">A complete platform for managing government services through trusted local agents.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title}
                className="p-6 rounded-2xl border border-gray-100 bg-white hover:border-blue-200 hover:shadow-md transition-all">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2 text-gray-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-gray-900">What Users Say</h2>
            <p className="text-lg text-gray-600">Real experiences from real users.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="p-6 rounded-2xl border border-gray-100 bg-gray-50">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => <span key={i} className="text-yellow-400 text-sm">★</span>)}
                </div>
                <p className="text-sm leading-relaxed mb-5 text-gray-700">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">{t.avatar}</div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-gray-900">Simple Pricing</h2>
            <p className="text-lg text-gray-600">Pay only for the services you use. No hidden fees.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Basic', price: 'Free', desc: 'For individuals getting started', features: ['Browse all services', 'Submit applications', 'Track status', 'Email notifications'], highlight: false },
              { name: 'Standard', price: 'Rs. 500', desc: 'Per service request', features: ['Everything in Basic', 'Priority agent assignment', 'Faster processing', 'Dedicated support', 'Full history access'], highlight: true },
              { name: 'Agent', price: 'Free', desc: 'Earn by helping others', features: ['Accept service requests', 'Earn per completion', 'Flexible schedule', 'Admin support', 'Payment dashboard'], highlight: false },
            ].map((plan) => (
              <div key={plan.name}
                className={`p-6 rounded-2xl border-2 transition-all ${plan.highlight ? 'border-blue-600 bg-blue-600 shadow-xl' : 'border-gray-200 bg-white'}`}>
                {plan.highlight && <div className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full w-fit mb-4">MOST POPULAR</div>}
                <h3 className={`text-xl font-black mb-1 ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.name}</h3>
                <div className={`text-3xl font-black mb-1 ${plan.highlight ? 'text-white' : 'text-blue-600'}`}>{plan.price}</div>
                <p className={`text-sm mb-5 ${plan.highlight ? 'text-blue-100' : 'text-gray-500'}`}>{plan.desc}</p>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-blue-100' : 'text-gray-600'}`}>
                      <span className={plan.highlight ? 'text-white' : 'text-blue-600'}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login"
                  className={`block text-center py-3 rounded-xl font-bold text-sm transition-all ${plan.highlight ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 text-gray-900">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600">Everything you need to know.</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-sm text-gray-900 hover:bg-gray-50 transition-colors">
                  {faq.q}
                  <span className={`text-xl text-gray-400 transition-transform duration-200 ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4 text-sm leading-relaxed text-gray-600 bg-gray-50">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Ready to Get Started?</h2>
          <p className="text-blue-100 text-lg mb-8">Join hundreds of users who save time with AgentServe.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="px-8 py-4 bg-white text-blue-600 font-bold rounded-xl text-lg hover:bg-blue-50 transition-all">
              Create Free Account
            </Link>
            <Link href="/login" className="px-8 py-4 border-2 border-white/50 text-white font-bold rounded-xl text-lg hover:bg-white/10 transition-all">
              Login →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-12 px-4 bg-gray-900">
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
              <div className="flex gap-3 mb-4">
                {['𝕏', 'f', 'in', '▶'].map((icon, i) => (
                  <a key={i} href="#"
                    className="w-9 h-9 bg-gray-800 hover:bg-blue-600 text-gray-400 hover:text-white rounded-lg flex items-center justify-center text-sm font-bold transition-all">
                    {icon}
                  </a>
                ))}
              </div>
              <p className="text-gray-400 text-sm">np03cs4a230546@heraldcollege.edu.np</p>
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
