'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const data = searchParams.get('data');
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const [userRole, setUserRole] = useState('user');
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setUserRole(JSON.parse(userStr).role);
      } catch (e) {}
    }

    if (data) {
      try {
        // eSewa sends Base64 encoded JSON in the 'data' query parameter
        const decodedString = atob(data);
        const payload = JSON.parse(decodedString);
        
        // Immediately verify this transaction on the backend to avoid spoofing
        fetch('/api/esewa/payment-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: payload.transaction_uuid })
        })
        .then(res => res.json())
        .then(resData => {
           if (resData.status === 'COMPLETE') {
             // Update our application from 'pending_payment' to 'pending_review'
             fetch(`/api/applications/${payload.transaction_uuid}`, {
                 method: 'PATCH',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({ status: 'pending_review' })
             }).then(() => {
                setStatus('success');
             });
           } else {
             setStatus('error');
           }
        })
        .catch(err => {
          console.error('Error verifying payment:', err);
          setStatus('error');
        });
      } catch (err) {
        console.error("Invalid data format", err);
        setStatus('error');
      }
    } else {
      setStatus('error'); // No data passed in URL at all
    }
  }, [data]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden text-center border p-8">
        
        {status === 'verifying' && (
          <div className="animate-fade-in-up">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Verifying Payment...</h2>
            <p className="mt-3 text-gray-500 leading-relaxed">
              Please wait a moment securely while we confirm your transaction directly with eSewa servers.
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-fade-in-up">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Payment Successful!</h2>
            <p className="mt-3 text-gray-500 leading-relaxed font-medium">
              {userRole === 'admin' || userRole === 'superadmin' 
                ? "Transaction was fully verified. The agent's total paid balance has been updated successfully!"
                : "Your transaction was fully verified. Your application has been dispatched and is now waiting for Agent review!"}
            </p>
            <div className="mt-8 shadow-sm">
                {userRole === 'admin' || userRole === 'superadmin' ? (
                  <Link href="/admin/agent-payments" className="w-full inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md text-lg">
                    Return to Payments Dashboard
                  </Link>
                ) : (
                  <Link href="/user/applications" className="w-full inline-block bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-md text-lg">
                    View My Applications
                  </Link>
                )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-fade-in-up">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Verification Failed</h2>
            <p className="mt-3 text-gray-500 leading-relaxed font-medium">
              We couldn't verify this payment record automatically. It may still be processing or it has failed in eSewa's system.
            </p>
            <button 
               onClick={() => {
                 if (userRole === 'admin' || userRole === 'superadmin') router.push('/admin/agent-payments');
                 else router.push('/user/services');
               }}
               className="mt-8 w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3.5 rounded-xl transition-colors"
            >
              Return Home
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header bar placeholder */}
      <div className="h-1 bg-gradient-to-r from-[#60bb46] to-green-600 w-full" />
      <Suspense fallback={<div className="text-center p-20"><Loader2 className="w-10 h-10 animate-spin mx-auto" /></div>}>
        <PaymentSuccessContent />
      </Suspense>
    </div>
  );
}
