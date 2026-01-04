import React from 'react';
import Layout from '../Components/Layout';

const Events = () => {
  return (
    <Layout title="Events">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="mt-1 text-sm text-gray-500">Manage and organize events like concerts, festivals, and gatherings</p>
          </div>

          {/* Content */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-green-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                🎪 Events Management
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">🎪</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Events Platform Coming Soon</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  This section will provide comprehensive event management including concerts,
                  festivals, corporate events, and community gatherings.
                </p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl mb-2">🎵</div>
                    <h4 className="font-medium text-gray-900">Concerts & Music</h4>
                    <p className="text-sm text-gray-500">Live music events and performances</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl mb-2">🎭</div>
                    <h4 className="font-medium text-gray-900">Festivals & Shows</h4>
                    <p className="text-sm text-gray-500">Cultural festivals and entertainment</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl mb-2">🏢</div>
                    <h4 className="font-medium text-gray-900">Corporate Events</h4>
                    <p className="text-sm text-gray-500">Business conferences and seminars</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Events;