import React from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

export default function ProductCard({ product }) {
  const BASE_URL = import.meta.env.VITE_DJANGO_URL;

  const {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const cartItem = cartItems.find((item) => item.id === product.id);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition duration-300 overflow-hidden">

      {/* Clickable Product */}
      <Link to={`/product/${product.id}`}>
        <img
          src={
            product.image?.startsWith("http")
              ? product.image
              : `${BASE_URL}${product.image}`
          }
          alt={product.name}
          className="w-full h-56 object-cover"
        />

        <div className="p-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-right mr-2 truncate">
            {product.name}
          </h2>

          <p className="text-left text-2xl font-bold text-green-600">
            ₹{product.price}
          </p>
        </div>
      </Link>

      {/* Cart Controls */}
      <div className="px-4 pb-4">
        {!cartItem ? (
          <button
            onClick={() => addToCart(product)}
            className="w-full bg-blue-600 hover:bg-blue-700 cursor-pointer text-white py-2 rounded-lg transition"
          >
            🛒 Add to Cart
          </button>
        ) : (
          <>
            <div className="flex justify-center items-center gap-4 mb-3">
              <button
                onClick={() =>
                  updateQuantity(product.id, cartItem.quantity - 1)
                }
                className="w-10 h-10 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                -
              </button>

              <span className="font-bold text-lg">
                {cartItem.quantity}
              </span>

              <button
                onClick={() =>
                  updateQuantity(product.id, cartItem.quantity + 1)
                }
                className="w-10 h-10 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                +
              </button>
            </div>

            <button
              onClick={() => removeFromCart(product.id)}
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg transition"
            >
              Remove
            </button>
          </>
        )}
      </div>
    </div>
  );
}