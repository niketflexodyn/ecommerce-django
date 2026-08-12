import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { fetchProfile } from './features/auth/authThunk'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ProductList from './pages/ProductList'
import ProductDetails from './pages/ProductDetails'
import Login from './pages/Login'
import SearchResults from './components/SearchResults'
import CartPage from './pages/CartPage'
import Wishlist from './pages/Wishlist'
import Hero from './components/Hero'
import FeaturesStrip from './components/FeaturesStrip'
import PromoCarousel from './components/PromoCarousel'
import AboutStory from './components/AboutStory'
// import MarqueeStrip from './components/MarqueeStrip'
import SubscriptionPlans from './components/SubscriptionPlans'
import Register from './pages/Register'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import OrderHistory from './pages/OrderHistory'
import Profile from './pages/Profile'
import PrivacyPolicy from './pages/PrivacyPolicy'
import BackToTop from './components/BackToTop'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './components/admin/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminProducts from './pages/admin/AdminProducts'
import AdminCategories from './pages/admin/AdminCategories'
import AdminOrders from './pages/admin/AdminOrders'
import AdminRatings from './pages/admin/AdminRatings'
import AdminAdmins from './pages/admin/AdminAdmins'
import SuperAdminRoute from './components/SuperAdminRoute'
import EditAdminDetails from './components/admin/EditAdminDetails'
import ForgotPassword from './pages/ForgetPassword'
import ResetPassword from './pages/ResetPassword'
import CartDrawer from './components/CartDrawer'
import CategoryStrip from './components/CategoryStrip'
import SuperAdminSubscription from './components/admin/SuperAdminSubscription'

// import ScrollToTop from './pages/ScrollToTop'
export default function App() {
  const dispatch = useDispatch()
  const access = useSelector((s) => s.auth.tokens.access)
  const user = useSelector((s) => s.auth.user)
  const location = useLocation()

  // Scroll to top automatically when navigating between pages
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.pathname])

  // Bootstrap the logged-in user on cold load by resolving the stored access
  // token into a profile. Skipped right after login, since loginUser already
  // populated `user` from the login response — re-fetching would be a redundant
  // /api/profile/ call. Re-runs only when the token changes AND we don't yet
  // have a user (e.g. page reload with a token in localStorage).
  useEffect(() => {
    if (access && !user) dispatch(fetchProfile())
  }, [dispatch, access, user])

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden">
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
          <Route
            index
            element={
              user?.role === 'super_admin' ? (
                <Navigate to="/dashboard/admins" replace />
              ) : (
                <AdminDashboard />
              )
            }
          />

          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="ratings" element={<AdminRatings />} />
          <Route path="subscription" element={<SubscriptionPlans />} />
          <Route
            path="admins"
            element={
              <SuperAdminRoute>
                <AdminAdmins />
              </SuperAdminRoute>
            }
          />
          <Route
            path="subscription-plans"
            element={
              <SuperAdminRoute>
                <SuperAdminSubscription />
              </SuperAdminRoute>
            }
          />

          <Route path="edit-details" element={<EditAdminDetails />} />
        </Route>

        {/* Customer-facing routes — with Navbar/Footer */}
        <Route
          path="*"
          element={
            <>
              {/* <MarqueeStrip /> */}
              <Navbar />
              <CategoryStrip />
              <main className="flex-1">
                <Routes>
                  <Route path='/' element={
                    <>
                      <Hero />
                      <FeaturesStrip />
                      <ProductList hideBanner />
                      <PromoCarousel />
                      <AboutStory />

                    </>
                  } />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path='/register' element={<Register />} />
                  <Route path='/checkout' element={<Checkout />} />
                  <Route path='/order-success' element={<OrderSuccess />} />
                  <Route path='/orders' element={<OrderHistory />} />
                  <Route path='/profile' element={<Profile />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route
                    path="/reset-password/:uid/:token"
                    element={<ResetPassword />}
                  />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/privacy" element={<Navigate to="/privacy-policy" replace />} />
                  <Route path="/terms" element={<PrivacyPolicy />} />
                  <Route path="/refund-policy" element={<PrivacyPolicy />} />
                  <Route path="/shipping-policy" element={<PrivacyPolicy />} />
                </Routes>
                <CartDrawer />
                {/* <ScrollToTop /> */}
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