import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProductList from './pages/ProductList'
import ProductDetails from './pages/ProductDetails'
import Login from './pages/Login'
import SearchResults from './components/SearchResults'
import CartPage from './pages/CartPage'
// import Cart from './pages/Cart' // uncomment once you have a Cart page

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </>
  )
}