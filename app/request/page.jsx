'use client';

import Sidebar from '@/components/Sidebar';

export default function RequestPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="h-1 bg-blue-500"></div>
        <div className="bg-white px-6 py-3 border-b">
          <p className="text-blue-800 font-semibold">Admin Home Page</p>
        </div>
        <div className="flex-1 p-6">
          <h1 className="text-3xl font-bold text-black mb-6">REQUEST</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">Request management page - Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}


