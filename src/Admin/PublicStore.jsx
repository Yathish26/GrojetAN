import React from 'react';
import Layout from '../Components/Layout';

const PublicStore = () => {
  return (
    <Layout title="Public Store">
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Public Store</h1>
            <p className="mt-1 text-sm text-gray-500">Manage your public store settings and configuration</p>
          </div>

          {/* Content */}
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="bg-orange-600 px-6 py-4">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                🏪 Public Store Management
              </h2>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                  <span className="text-4xl">🏪</span>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Public Store Coming Soon</h3>
                <p className="text-gray-500 max-w-md mx-auto">
                  This section will allow you to manage your public store settings, including store appearance,
                  product visibility, customer access controls, and more.
                </p>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl mb-2">🎨</div>
                    <h4 className="font-medium text-gray-900">Store Design</h4>
                    <p className="text-sm text-gray-500">Customize store appearance</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl mb-2">📦</div>
                    <h4 className="font-medium text-gray-900">Product Management</h4>
                    <p className="text-sm text-gray-500">Control product visibility</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-2xl mb-2">👥</div>
                    <h4 className="font-medium text-gray-900">Customer Access</h4>
                    <p className="text-sm text-gray-500">Manage customer permissions</p>
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

export default PublicStore;