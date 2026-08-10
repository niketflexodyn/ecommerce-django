import { useEffect, useState } from "react";
import { subscriptionApi } from "../utils/api";

export default function SubscriptionPlans() {

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const fetchPlans = async () => {

      try {

        const data = await subscriptionApi.plans();

        console.log("Subscription plans:", data);

        setPlans(data);

      } catch (error) {

        console.error(
          "Failed to load subscription plans:",
          error
        );

      } finally {

        setLoading(false);

      }
    };

    fetchPlans();

  }, []);


  const subscribeToPlan = async (planId) => {

    try {

      const response =
        await subscriptionApi.create(planId);

      console.log(
        "Subscription created:",
        response
      );

    } catch (error) {

      console.error(
        "Subscription creation failed:",
        error
      );

    }

  };


  if (loading) {
    return <div>Loading plans...</div>;
  }


  return (

    <div className="p-6">

      <h1 className="text-2xl font-bold mb-6">
        Subscription Plans
      </h1>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {plans.map((plan) => (

          <div
            key={plan.id}
            className="border rounded-xl p-6"
          >

            <h2 className="text-xl font-semibold">
              {plan.name}
            </h2>


            <p className="text-2xl font-bold mt-3">
              ₹{plan.price}
            </p>


            <p className="text-gray-500">
              per {plan.billing_cycle}
            </p>


            <button
              onClick={() =>
                subscribeToPlan(plan.id)
              }
              className="mt-5 px-5 py-2 rounded-lg bg-black text-white"
            >
              Subscribe
            </button>

          </div>

        ))}

      </div>

    </div>

  );
}