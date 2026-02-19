import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import AdminNew from './Admin/AdminNew.jsx'
import AdminLogin from './Admin/AdminLogin.jsx'
import AdminRegister from './Admin/AdminRegister.jsx'
import Categories from './Admin/Categories.jsx'
import Products from './Admin/Products.jsx'
import AddProduct from './Admin/AddProduct.jsx'
import Users from './Admin/Users.jsx'
import UserAnalytics from './Admin/UserAnalytics.jsx'
import UserData from './Admin/UserData.jsx'
import UserOrders from './Admin/UserOrders.jsx'
import Orders from './Admin/Orders.jsx'
import OrderDetails from './Admin/OrderDetails.jsx'
import DeliveryAgents from './Admin/DeliveryAgents.jsx'
import DeliveryAgentDetails from './Admin/DeliveryAgentDetails.jsx'
import DeliveryRatings from './Admin/DeliveryRatings.jsx'
import RidersZone from './Admin/RidersZone.jsx'
import DeliveryZones from './Admin/DeliveryZones.jsx'
import Analytics from './Admin/Analytics.jsx'
import CloudAnalytics from './Admin/CloudAnalytics.jsx'
import Finance from './Admin/Finance.jsx'
import AdminManagement from './Admin/AdminManagement.jsx'
import Profile from './Admin/Profile.jsx'
import Settings from './Admin/Settings.jsx'
import DeliveryAgentSignup from './Admin/DeliveryAgentSignup.jsx'
import Error404 from './Error404.jsx'
import { Toaster } from 'react-hot-toast'
import MerchantEnq from './Admin/MerchantEnq.jsx'
import Merchants from './Admin/Merchants.jsx'
import Eateries from './Admin/Eateries.jsx'
import AddMerchant from './Admin/AddMerchant.jsx'
import MerchantDetails from './Admin/MerchantDetails.jsx'
import EditMerchant from './Admin/EditMerchant.jsx'
import MerchantInventory from './Admin/MerchantInventory.jsx'
import AddMerchantInventory from './Admin/AddMerchantInventory.jsx'
import AppControls from './Admin/AppControls.jsx'
import Careers from './Admin/Careers.jsx'
import RequestedProducts from './Admin/RequestedProducts.jsx'
import Offers from './Admin/Offers.jsx'
import MarketArea from './Admin/MarketArea.jsx'
import UpdateNotesAdmin from './Admin/UpdateNotesAdmin.jsx'
import HomeAds from './Admin/HomeAds.jsx'
import BugReports from './Admin/BugReports.jsx'
import Support from './Admin/Support.jsx'
import LiveChat from './Admin/LiveChat.jsx'
import Security from './Admin/Security.jsx'
import Xpress from './Admin/Xpress.jsx'
import XpressOrderDetails from './Admin/XpressOrderDetails.jsx'
import { WebSocketProvider } from './context/WebSocketContext.jsx'
import ContactQur from './Admin/ContactQur.jsx'
import EmailSender from './Admin/EmailSender.jsx'
import S3store from './Admin/S3store.jsx'
import PublicStore from './Admin/PublicStore.jsx'
import PublicStoreDetails from './Admin/PublicStoreDetails.jsx'
import Darkstore from './Darkstore.jsx'

function App() {
  return (
    <WebSocketProvider>
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
          <Route path="/public-store" element={<PublicStore />} />
          <Route path="/public-store-details/:id" element={<PublicStoreDetails />} />
          
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
          <Route path="/users/:id/orders" element={<UserOrders />} />
          <Route path="/user-analytics" element={<UserAnalytics />} />
          
          {/* Merchant Management */}
          <Route path="/merchant-enquiries" element={<MerchantEnq />} />
          <Route path="/merchants" element={<Merchants />} />
          <Route path="/merchants/add" element={<AddMerchant />} />
          <Route path="/merchants/:id" element={<MerchantDetails />} />
          <Route path="/merchants/:id/edit" element={<EditMerchant />} />
          <Route path="/merchants/:id/inventory" element={<MerchantInventory />} />
          <Route path="/merchants/:id/inventory/add" element={<AddMerchantInventory />} />
          <Route path="/eateries" element={<Eateries />} />
          <Route path="/darkstore" element={<Darkstore />} />
          
          {/* Support Management */}
          <Route path="/support" element={<Support />} />
          
          {/* Category Management */}
          <Route path="/categories" element={<Categories />} />
          
          {/* Xpress */}
          <Route path="/xpress" element={<Xpress />} />
          <Route path="/xpress/:id" element={<XpressOrderDetails />} />
          
          {/* Careers Management */}
          <Route path="/careers" element={<Careers />} />
          
          {/* Delivery Management */}
          <Route path="/delivery-agents" element={<DeliveryAgents />} />
          <Route path="/delivery-agents/:id" element={<DeliveryAgentDetails />} />
          <Route path="/delivery-ratings" element={<DeliveryRatings />} />
          <Route path="/riders-zone" element={<RidersZone />} />
          <Route path="/delivery-zones" element={<DeliveryZones />} />
          <Route path="/market-area" element={<MarketArea />} />
          <Route path="/delivery-signup" element={<DeliveryAgentSignup />} />
          <Route path="/offers" element={<Offers />} />
          
          {/* Home Ads Management */}
          <Route path="/home-ads" element={<HomeAds />} />
          
          {/* Dark Store */}
          <Route path="/contact-qur" element={<ContactQur />} />
          <Route path="/email-sender" element={<EmailSender />} />
          
          {/* Live Chat */}
          <Route path="/live-chat" element={<LiveChat />} />
          
          {/* Analytics & Reports */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/cloud-analytics" element={<CloudAnalytics />} />
          <Route path="/finance" element={<Finance />} />
          
          {/* Admin Management (Super Admin only) */}
          <Route path="/admin-management" element={<AdminManagement />} />
          <Route path="/security" element={<Security />} />
          <Route path="/admin-register" element={<AdminRegister />} />
          <Route path="/update-notes" element={<UpdateNotesAdmin />} />
          <Route path="/bug-reports" element={<BugReports />} />
          
          {/* Settings & Profile */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/app-controls" element={<AppControls />} />
          <Route path="/s3-store" element={<S3store />} />

          {/* 404 */}
          <Route path="*" element={<Error404 />} />
        </Routes>
      </div>
    </Router>
    </WebSocketProvider>
  )
}

export default App

