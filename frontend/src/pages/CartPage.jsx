import { useCart } from "../context/CartContext";

function CartPage() {
  const { cartItems, removeFromCart, updateQuantity } = useCart();

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8">🛒 Shopping Cart</h1>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-10 text-center">
            <h2 className="text-2xl font-semibold">Your cart is empty</h2>
            <p className="text-gray-500 mt-2">
              Add some products to get started.
            </p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl shadow-md p-5 flex flex-col md:flex-row gap-6"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-40 h-40 object-cover rounded-lg"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-2xl font-semibold">
                        {item.name}
                      </h2>

                      <p className="text-gray-600 mt-2">
                        Price: ${item.price}
                      </p>

                      <p className="font-medium mt-2">
                        Subtotal: $
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 mt-5">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-10 h-10 rounded bg-gray-200 hover:bg-gray-300"
                      >
                        -
                      </button>

                      <span className="text-lg font-bold">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-10 h-10 rounded bg-blue-500 text-white hover:bg-blue-600"
                      >
                        +
                      </button>

                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="ml-auto bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-xl shadow-md p-6 h-fit sticky top-10">
              <h2 className="text-2xl font-bold mb-6">
                Order Summary
              </h2>

              <div className="flex justify-between mb-3">
                <span>Items</span>
                <span>{cartItems.length}</span>
              </div>

              <div className="flex justify-between mb-3">
                <span>Total Quantity</span>
                <span>
                  {cartItems.reduce(
                    (sum, item) => sum + item.quantity,
                    0
                  )}
                </span>
              </div>

              <hr className="my-4" />

              <div className="flex justify-between text-2xl font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <button className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold transition">
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CartPage;