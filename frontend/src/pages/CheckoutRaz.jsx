import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import axios from "axios";

export default function Checkout() {
  const BASE_URL = import.meta.env.VITE_DJANGO_URL;

  const { cartItems } = useCart();

  const [shippingData, setShippingData] = useState({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleChange = (e) => {
    setShippingData({
      ...shippingData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePayment = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/create-payment/`,
        {
          amount: total,
        }
      );

      console.log(response.data);

      // Razorpay popup comes here in the next step

    } catch (error) {
      console.error(error);
      alert("Unable to initiate payment.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">

        {/* Shipping Address */}

        <div className="bg-white rounded-xl shadow-md p-6">

          <h2 className="text-2xl font-bold mb-6">
            Shipping Address
          </h2>

          <div className="space-y-4">

            <input
              type="text"
              name="full_name"
              placeholder="Full Name"
              value={shippingData.full_name}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              value={shippingData.phone}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

            <textarea
              name="address"
              placeholder="Address"
              value={shippingData.address}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="text"
              name="city"
              placeholder="City"
              value={shippingData.city}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="text"
              name="state"
              placeholder="State"
              value={shippingData.state}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="text"
              name="pincode"
              placeholder="Pincode"
              value={shippingData.pincode}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

          </div>

        </div>

        {/* Order Summary */}

        <div className="bg-white rounded-xl shadow-md p-6">

          <h2 className="text-2xl font-bold mb-6">
            Order Summary
          </h2>

          <div className="space-y-4">

            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex justify-between border-b pb-3"
              >
                <div>
                  <p className="font-semibold">
                    {item.name}
                  </p>

                  <p className="text-gray-500">
                    Qty: {item.quantity}
                  </p>
                </div>

                <p className="font-semibold">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            ))}

          </div>

          <div className="mt-6 border-t pt-4">

            <div className="flex justify-between text-xl font-bold">

              <span>Total</span>

              <span>₹{total}</span>

            </div>

          </div>

          <button
            onClick={handlePayment}
            className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-semibold"
          >
            Proceed to Pay
          </button>

        </div>

      </div>
    </div>
  );
}