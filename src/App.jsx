
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import Admin from './Admin/Admin.jsx'
import AdminLogin from './Admin/AdminLogin.jsx'
import Merchants from './Admin/Merchants.jsx'
import Categories from './Admin/Categories.jsx'
import Products from './Admin/Products.jsx'
import AddProduct from './Admin/AddProduct.jsx'
import Users from './Admin/Users.jsx'
import Error404 from './Error404.jsx'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Admin />} />
        <Route path="/products/add" element={<AddProduct />} />
        <Route path="/login" element={<AdminLogin />} />
        <Route path="/products" element={<Products />} />
        <Route path="/merchants" element={<Merchants />} />
        <Route path="/categories" element={<Categories />} />
        <Route path="/users" element={<Users />} />
        <Route path="*" element={<Error404 />} />
      </Routes>
    </Router>
  )
}

export default App

