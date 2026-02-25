import React from 'react';
import Layout from './Components/Layout';

const Darkstore = () => {
  return (
    <Layout title="Darkstore">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200 p-6">
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">Darkstore</h1>
            <p className="text-lg text-neutral-600 mb-8">Coming Soon...</p>
            <p className="text-neutral-500 max-w-md mx-auto">
              Dark Stores coming soon. Stay tuned for updates!
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Darkstore;