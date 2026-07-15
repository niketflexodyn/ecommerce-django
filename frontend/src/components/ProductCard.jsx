import React from 'react'
import { Link } from 'react-router-dom'
export default function ProductCard({ product }) {
  const BASE_URL = import.meta.env.VITE_DJANGO_URL;

  return (
    <Link to={`/product/${product.id}`} className="block bg-white rounded-xl shadow-md hover:shadow-lg cursor-pointer">
      <div className='bg-white rounded-xl shadow-md hover:shadow-lg'>
        <img
          src={product.image?.startsWith('http') ? product.image : `${BASE_URL}${product.image}`} alt={product.name}
          className='w-full h-56 object-cover rounded-lg mb-4' />
        <h2 className='text-lg font-semibold text-center text-gray-800 truncate'>{product.name}</h2>
        <p className='text-gray-600 mt-2 text-center'>₹{product.price}</p>

      </div>
    </Link>
  )
}
