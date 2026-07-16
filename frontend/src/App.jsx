import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProductList from './pages/ProductList'
import ProductDetails from './pages/ProductDetails'
import Login from './pages/Login'
import SearchResults from './components/SearchResults'
import CartPage from './pages/CartPage'
import Hero from './components/Hero'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path='/' element={
            <>
            <Hero />
            <ProductList />
            </>
        } />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/login/:role" element={<Login />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/cart" element={<CartPage />} />
          
          Route
        </Routes>
      </main>
      <Footer />
    </div>
  )
}
