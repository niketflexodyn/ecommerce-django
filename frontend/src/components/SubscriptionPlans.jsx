import { useEffect, useState } from "react";
import { subscriptionApi } from "../utils/api";

export default function SubscriptionPlans() {

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [activePlanId, setActivePlanId] = useState(null); // persisted, from backend
  const [activePlanEndDate, setActivePlanEndDate] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [plansData, currentSub] = await Promise.all([
          subscriptionApi.plans(),
          subscriptionApi.current(), // GET /subscriptions/current/ — returns active sub or null
        ]);

        setPlans(plansData);

        if (currentSub && currentSub.status === "active") {
          setActivePlanId(currentSub.plan_id);
          if (currentSub.end_date) setActivePlanEndDate(currentSub.end_date);
          setSelectedPlan(
            plansData.find((p) => p.id === currentSub.plan_id) || null
          );
        }
      } catch (error) {
        console.error("Failed to load subscription data:", error);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const subscribeToPlan = async (planId) => {
    if (activePlanId || processing) return;
    setProcessing(true);

    try {
      const response = await subscriptionApi.create(planId);
      console.log("Subscription created:", response);

      const options = {
        key: response.razorpay_key_id,
        subscription_id: response.razorpay_subscription_id,
        name: "LUXORA",
        description: `${response.subscription.plan_name} Subscription`,

        handler: async function (paymentResponse) {
          try {
            const verificationResponse = await subscriptionApi.verify({
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_subscription_id: paymentResponse.razorpay_subscription_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            console.log("Verification response:", verificationResponse);

            // This is the actual fix: mark the plan active only after verified success
            setActivePlanId(planId);
            setSelectedPlan(plans.find((p) => p.id === planId));
          } catch (error) {
            console.error("Verification failed:", error);
            alert("Payment verification failed.");
          } finally {
            setProcessing(false);
          }
        },

        modal: {
          ondismiss: function () {
            setProcessing(false); // user closed checkout without paying
          },
        },

        theme: { color: "#3b0a2e" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error("Subscription creation failed:", error);
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-white">
        <div className="w-8 h-8 border-2 border-[#3b0a2e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-16">

        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 border border-[#3b0a2e]/20 text-[#3b0a2e] text-xs font-medium tracking-widest uppercase px-4 py-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Membership
          </span>
          <h1 className="mt-5 text-4xl font-serif text-[#1a0512]">
            Choose Your <span className="italic text-amber-500">Plan</span>
          </h1>
          <p className="mt-3 text-gray-500 max-w-md mx-auto">
            Unlock premium perks across every category — pick the plan that fits you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => {
            const isActive = activePlanId === plan.id;
            const isSelected = selectedPlan?.id === plan.id;
            const isPopular = idx === 1;
            const locked = activePlanId !== null && !isActive;

            return (
              <div
                key={plan.id}
                onClick={() => !activePlanId && setSelectedPlan(plan)}
                className={`relative rounded-2xl p-8 border transition-all duration-200 ${
                  locked ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                } ${
                  isSelected || isActive
                    ? "border-[#3b0a2e] bg-[#3b0a2e] text-white shadow-xl shadow-[#3b0a2e]/20 -translate-y-1"
                    : "border-gray-200 bg-white hover:border-[#3b0a2e]/40 hover:-translate-y-0.5"
                }`}
              >
                {isActive && (
                  <span className="absolute -top-3 left-6 bg-green-500 text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
                    Current Plan
                  </span>
                )}
                {isPopular && !isActive && (
                  <span className="absolute -top-3 right-6 bg-amber-400 text-[#1a0512] text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
                    Bestseller
                  </span>
                )}

                <h2 className={`text-lg font-serif ${isSelected || isActive ? "text-white" : "text-[#1a0512]"}`}>
                  {plan.name}
                </h2>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">₹{plan.price}</span>
                  <span className={`text-sm ${isSelected || isActive ? "text-white/60" : "text-gray-400"}`}>
                    /{plan.billing_cycle}
                  </span>
                </div>

                {isActive && activePlanEndDate && (
                  <div className="mt-3">
                    <p className={`text-xs font-medium px-2.5 py-1 inline-block rounded-md ${isSelected || isActive ? "bg-white/10 text-white" : "bg-green-50 text-green-700"}`}>
                      Valid until: {new Date(activePlanEndDate).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className={`mt-6 h-px w-full ${isSelected || isActive ? "bg-white/15" : "bg-gray-100"}`} />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!activePlanId) setSelectedPlan(plan);
                  }}
                  disabled={locked}
                  className={`mt-6 w-full py-2.5 rounded-full text-sm font-semibold tracking-wide transition-colors ${
                    isActive
                      ? "bg-green-500 text-white cursor-default"
                      : isSelected
                      ? "bg-amber-400 text-[#1a0512] hover:bg-amber-300"
                      : "bg-[#1a0512] text-white hover:bg-[#3b0a2e]"
                  } ${locked ? "opacity-40 cursor-not-allowed" : ""}`}
                >
                  {isActive ? "Active ✓" : isSelected ? "Selected ✓" : "Select Plan"}
                </button>
              </div>
            );
          })}
        </div>

        {selectedPlan && (
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-200 rounded-2xl px-8 py-6 bg-[#faf7f5]">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400">
                {activePlanId ? "Active Plan" : "Selected Plan"}
              </p>
              <p className="mt-1 font-serif text-xl text-[#1a0512]">
                {selectedPlan.name}
                <span className="text-gray-400 font-sans text-sm ml-2">
                  ₹{selectedPlan.price} / {selectedPlan.billing_cycle}
                </span>
              </p>
              {activePlanId && activePlanEndDate && (
                <p className="mt-2 text-sm text-green-600 font-medium">
                  Valid until: {new Date(activePlanEndDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <button
              onClick={() => subscribeToPlan(selectedPlan.id)}
              disabled={activePlanId !== null || processing}
              className={`px-8 py-3 rounded-full font-semibold tracking-wide transition-colors ${
                activePlanId
                  ? "bg-green-600 text-white cursor-default"
                  : processing
                  ? "bg-gray-300 text-gray-500 cursor-wait"
                  : "bg-amber-400 text-[#1a0512] hover:bg-amber-300"
              }`}
            >
              {activePlanId ? "Subscribed ✓" : processing ? "Processing..." : "Continue to Payment"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}