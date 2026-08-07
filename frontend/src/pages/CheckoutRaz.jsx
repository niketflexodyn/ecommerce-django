import React, { useState } from "react";
import { useCart } from "../context/CartContext";
import axios from "axios";

const NAME_RE = /^[a-zA-Z\s'-]+$/;

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
  const [error, setError] = useState("");

  const total = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setError("");
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 13);
      setShippingData({
        ...shippingData,
        phone: digitsOnly,
      });
      return;
    }
    if (name === "pincode") {
      const digitsOnly = value.replace(/\D/g, "").slice(0, 10);
      setShippingData({
        ...shippingData,
        pincode: digitsOnly,
      });
      return;
    }
    setShippingData({
      ...shippingData,
      [name]: value,
    });
  };

  const validate = () => {
    const { full_name, phone, address, city, state, pincode } = shippingData;
    if (!full_name.trim()) {
      return "Full name is required.";
    }
    if (full_name.trim().length < 2 || full_name.trim().length > 100) {
      return "Full name must be between 2 and 100 characters.";
    }
    if (!NAME_RE.test(full_name.trim())) {
      return "Full name can only contain letters, spaces, and hyphens.";
    }

    const digits = phone.replace(/\D/g, "");
    if (!phone.trim()) {
      return "Phone number is required.";
    }
    if (digits.length < 10 || digits.length > 13) {
      return "Please enter a valid phone number (10–13 digits).";
    }

    if (!address.trim()) {
      return "Address is required.";
    }
    if (address.trim().length < 5 || address.trim().length > 500) {
      return "Address must be between 5 and 500 characters.";
    }
    if (!/[a-zA-Z0-9]/.test(address.trim())) {
      return "Please enter a valid street address.";
    }

    if (city && city.trim() && !NAME_RE.test(city.trim())) {
      return "City can only contain letters and spaces.";
    }

    if (state && state.trim() && !NAME_RE.test(state.trim())) {
      return "State can only contain letters and spaces.";
    }

    if (pincode && pincode.trim() && (pincode.replace(/\D/g, "").length < 4 || pincode.replace(/\D/g, "").length > 10)) {
      return "Please enter a valid pincode (4–10 digits).";
    }

    return "";
  };

  const handlePayment = async () => {
    setError("");
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

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

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div className="space-y-4">

            <input
              type="text"
              name="full_name"
              maxLength={100}
              placeholder="Full Name"
              value={shippingData.full_name}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="tel"
              name="phone"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={13}
              placeholder="Phone Number (max 13 digits)"
              value={shippingData.phone}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (
                  !/[0-9]/.test(e.key) &&
                  !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                  !e.ctrlKey &&
                  !e.metaKey
                ) {
                  e.preventDefault();
                }
              }}
              className="w-full border rounded-lg p-3"
            />

            <textarea
              name="address"
              maxLength={500}
              placeholder="Address (max 500 characters)"
              value={shippingData.address}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="text"
              name="city"
              maxLength={100}
              placeholder="City"
              value={shippingData.city}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="text"
              name="state"
              maxLength={100}
              placeholder="State"
              value={shippingData.state}
              onChange={handleChange}
              className="w-full border rounded-lg p-3"
            />

            <input
              type="tel"
              name="pincode"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={10}
              placeholder="Pincode"
              value={shippingData.pincode}
              onChange={handleChange}
              onKeyDown={(e) => {
                if (
                  !/[0-9]/.test(e.key) &&
                  !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                  !e.ctrlKey &&
                  !e.metaKey
                ) {
                  e.preventDefault();
                }
              }}
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

            {cartItems.map((item) => {
              const itemKey = item.cartItemId || `${item.id}-${item.variant_id || item.variant?.id || 'default'}`;
              return (
                <div
                  key={itemKey}
                  className="flex justify-between border-b pb-3"
                >
                  <div>
                    <p className="font-semibold">
                      {item.name}
                    </p>
                    {(item.variant_attributes?.length > 0 || item.variant?.attributes?.length > 0) && (
                      <p className="text-xs text-gray-500">
                        {item.variant_attributes?.map((a) => a.value_name).filter(Boolean).join(' • ') ||
                         item.variant?.attributes?.map((a) => a.value_name || a.value).filter(Boolean).join(' • ')}
                      </p>
                    )}
                    <p className="text-gray-500 text-sm">
                      Qty: {item.quantity} × ₹{Number(item.price).toLocaleString()}
                    </p>
                  </div>

                  <p className="font-semibold">
                    ₹{(Number(item.price) * item.quantity).toLocaleString()}
                  </p>
                </div>
              );
            })}

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