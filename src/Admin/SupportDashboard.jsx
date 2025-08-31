import React from 'react';
import Layout from '../Components/Layout';

export default function SupportDashboard(){
  return (
    <Layout title="Support Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-4 bg-white">
          <h3 className="font-semibold mb-2">Customer Management</h3>
          <p className="text-sm text-gray-600">Search customers, view profiles, raise tickets, refunds.</p>
        </div>
        <div className="border p-4 bg-white">
          <h3 className="font-semibold mb-2">Order Tracking & Support</h3>
          <p className="text-sm text-gray-600">Real-time order status, reassign delivery partner, contact merchant/agent.</p>
        </div>
        <div className="border p-4 bg-white">
          <h3 className="font-semibold mb-2">Merchant & Inventory Support</h3>
          <p className="text-sm text-gray-600">Lookup merchants, check inventory, escalate stock mismatches.</p>
        </div>
        <div className="border p-4 bg-white">
          <h3 className="font-semibold mb-2">Ticketing & Escalations</h3>
          <p className="text-sm text-gray-600">Open/close tickets, track SLAs, escalate issues.</p>
        </div>
      </div>
    </Layout>
  );
}
