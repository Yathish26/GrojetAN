import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import AdminNew from './Admin/AdminNew.jsx'
import AdminLogin from './Admin/AdminLogin.jsx'
import AdminRegister from './Admin/AdminRegister.jsx'
import Categories from './Admin/Categories.jsx'
import Products from './Admin/Products.jsx'
import AddProduct from './Admin/AddProduct.jsx'
import Users from './Admin/Users.jsx'
import UserData from './Admin/UserData.jsx'
import Orders from './Admin/Orders.jsx'
import OrderDetails from './Admin/OrderDetails.jsx'
import DeliveryAgents from './Admin/DeliveryAgents.jsx'
import DeliveryAgentDetails from './Admin/DeliveryAgentDetails.jsx'
import DeliveryZones from './Admin/DeliveryZones.jsx'
import Analytics from './Admin/Analytics.jsx'
import AdminManagement from './Admin/AdminManagement.jsx'
import Profile from './Admin/Profile.jsx'
import Settings from './Admin/Settings.jsx'
import DeliveryAgentSignup from './Admin/DeliveryAgentSignup.jsx'
import Error404 from './Error404.jsx'
import { Toaster } from 'react-hot-toast'
import MerchantEnq from './Admin/MerchantEnq.jsx'
import Merchants from './Admin/Merchants.jsx'
import AddMerchant from './Admin/AddMerchant.jsx'
import MerchantDetails from './Admin/MerchantDetails.jsx'
import EditMerchant from './Admin/EditMerchant.jsx'
import MerchantInventory from './Admin/MerchantInventory.jsx'
import AppControls from './Admin/AppControls.jsx'
import Careers from './Admin/Careers.jsx'
import RequestedProducts from './Admin/RequestedProducts.jsx'
import Offers from './Admin/Offers.jsx'
import MarketArea from './Admin/MarketArea.jsx'
import DeleteRequests from './Admin/DeleteRequests.jsx'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#333',
              border: '1px solid #e5e7eb',
              padding: '16px',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#fff'
              }
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#fff'
              }
            }
          }}
        />
        
        <Routes>
          {/* Main Dashboard */}
          <Route path="/" element={<AdminNew />} />
          
          {/* Authentication */}
          <Route path="/login" element={<AdminLogin />} />
          
          {/* Product Management */}
          <Route path="/products" element={<Products />} />
          <Route path="/products/add" element={<AddProduct />} />
          <Route path="/products/requests" element={<RequestedProducts />} />
          
          {/* Order Management */}
          <Route path="/orders" element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          
          {/* User Management */}
          <Route path="/users" element={<Users />} />
          <Route path="/users/:id" element={<UserData />} />
          <Route path="/delete-requests" element={<DeleteRequests />} />
          
          {/* Merchant Management */}
          <Route path="/merchant-enquiries" element={<MerchantEnq />} />
          <Route path="/merchants" element={<Merchants />} />
          <Route path="/merchants/add" element={<AddMerchant />} />
          <Route path="/merchants/:id" element={<MerchantDetails />} />
          <Route path="/merchants/:id/edit" element={<EditMerchant />} />
          <Route path="/merchants/:id/inventory" element={<MerchantInventory />} />
          
          {/* Category Management */}
          <Route path="/categories" element={<Categories />} />
          
          {/* Careers Management */}
          <Route path="/careers" element={<Careers />} />
          
          {/* Delivery Management */}
          <Route path="/delivery-agents" element={<DeliveryAgents />} />
          <Route path="/delivery-agents/:id" element={<DeliveryAgentDetails />} />
          <Route path="/delivery-zones" element={<DeliveryZones />} />
          <Route path="/market-area" element={<MarketArea />} />
          <Route path="/delivery-signup" element={<DeliveryAgentSignup />} />
          <Route path="/offers" element={<Offers />} />
          
          {/* Analytics & Reports */}
          <Route path="/analytics" element={<Analytics />} />
          
          {/* Admin Management (Super Admin only) */}
          <Route path="/admin-management" element={<AdminManagement />} />
          <Route path="/admin-register" element={<AdminRegister />} />
          
          {/* Settings & Profile */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/app-controls" element={<AppControls />} />

          {/* 404 */}
          <Route path="*" element={<Error404 />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

