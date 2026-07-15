import ProductList from './pages/ProductList'
import { Route, Routes } from 'react-router-dom'
import ProductDetails from './pages/ProductDetails'
import Login from './pages/Login'
import Navbar from './components/Navbar'
import SearchResults from './components/SearchResults'


export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<ProductList />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/login/:role" element={<Login />} />
        <Route path="/search" element={<SearchResults />} />
      </Routes>
    </>
  )
}
