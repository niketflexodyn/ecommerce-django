import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProductList from './pages/ProductList'
import ProductDetails from './pages/ProductDetails'
import Login from './pages/Login'
import SearchResults from './components/SearchResults'
import CartPage from './pages/CartPage'
import Hero from './components/Hero'
import FeaturesStrip from './components/FeaturesStrip'
import PromoCarousel from './components/PromoCarousel'
import AboutStory from './components/AboutStory'
import MarqueeStrip from './components/MarqueeStrip'
import Register from './pages/Register'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import OrderHistory from './pages/OrderHistory'
import BackToTop from './components/BackToTop'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminRatings from './pages/admin/AdminRatings'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Routes>
        {/* Admin dashboard routes — separate layout, no Navbar/Footer */}
        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="ratings" element={<AdminRatings />} />
        </Route>

        {/* Customer-facing routes — with Navbar/Footer */}
        <Route
          path="*"
          element={
            <>
              <Navbar />
              <main className="flex-1">
                <Routes>
                  <Route path='/' element={
                    <>
                      <Hero />
                      <FeaturesStrip />
                      <PromoCarousel />
                      <AboutStory />
                      <MarqueeStrip />
                      <ProductList hideBanner />
                    </>
                  } />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path='/register' element={<Register />} />
                  <Route path='/checkout' element={<Checkout />} />
                  <Route path='/order-success' element={<OrderSuccess />} />
                  <Route path='/orders' element={<OrderHistory />} />
                </Routes>
              </main>
              <Footer />
              <BackToTop />
            </>
          }
        />
      </Routes>
    </div>
  )
}