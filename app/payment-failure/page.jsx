'use client';

import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function PaymentFailurePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden text-center border p-8">
        
        <div className="animate-fade-in-up">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-black text-gray-800 tracking-tight">Payment Cancelled</h2>
          <p className="mt-3 text-gray-500 leading-relaxed font-medium">
            The eSewa transaction process was cancelled or failed unexpectedly.
          </p>
          <div className="mt-8 space-y-4">
              <Link href="/user/services" className="w-full inline-block bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold py-3.5 rounded-xl transition-colors text-lg cursor-pointer">
                Try Booking Again
              </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
