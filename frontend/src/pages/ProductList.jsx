import React, { useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = import.meta.env.VITE_DJANGO_URL;

  useEffect(() => {
    fetch(`${BASE_URL}/api/products/`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        return response.json();
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : data.results || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [BASE_URL]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="text-2xl font-semibold animate-pulse">
          Loading Products...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg shadow">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-gray-800">
              Our Products
            </h1>
            <p className="text-gray-500 mt-2">
              Discover our latest collection
            </p>
          </div>

          <div className="mt-4 md:mt-0 bg-white shadow px-5 py-3 rounded-lg">
            <span className="text-lg font-semibold">
              {products.length} Products
            </span>
          </div>
        </div>

        {/* Product Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-10 text-center">
            <h2 className="text-2xl font-semibold text-gray-700">
              No Products Available
            </h2>
            <p className="text-gray-500 mt-2">
              Please check back later.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}