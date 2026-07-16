import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const BASE_URL = import.meta.env.VITE_DJANGO_URL;

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/products/${id}/`);

        if (!response.ok) {
          throw new Error("Failed to fetch product.");
        }

        const data = await response.json();
        setProduct(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, BASE_URL]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <h2 className="text-2xl font-semibold animate-pulse">
          Loading Product...
        </h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="bg-red-100 text-red-700 px-6 py-4 rounded-lg shadow">
          <h2 className="text-xl font-bold">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <h2 className="text-2xl font-semibold">
          Product not found
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4">

        <Link
          to="/"
          className="inline-block mb-8 text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Products
        </Link>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8">

            {/* Product Image */}
            <div>
              <img
                src={
                  product.image?.startsWith("http")
                    ? product.image
                    : `${BASE_URL}${product.image}`
                }
                alt={product.name}
                className="w-full h-[500px] object-cover"
              />
            </div>

            {/* Product Info */}
            <div className="p-8 flex flex-col justify-center">
              <h1 className="text-4xl font-bold text-gray-800">
                {product.name}
              </h1>

              <p className="text-gray-600 mt-5 leading-7">
                {product.description}
              </p>

              <div className="mt-8">
                <span className="text-4xl font-bold text-green-600">
                  ${product.price}
                </span>
              </div>

              <button
                onClick={() => addToCart(product)}
                className="mt-8 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition duration-200 w-full md:w-fit"
              >
                🛒 Add to Cart
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}