'use client';

import Link from 'next/link';

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center">
        <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-12 h-12 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">
          Pending Approval
        </h1>
        
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Your agent account has been created successfully but is currently pending administrator approval. You will be able to log in and use the platform once your account is reviewed and approved.
        </p>

        <div className="space-y-4">
          <Link
            href="/login"
            className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
