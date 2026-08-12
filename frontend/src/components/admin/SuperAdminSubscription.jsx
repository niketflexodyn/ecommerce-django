import { useEffect, useState } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiX } from "react-icons/fi";
import { subscriptionPlanApi } from "../../utils/api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";

export default function SuperAdminSubscription() {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingPlanId, setEditingPlanId] = useState(null);
    const [formError, setFormError] = useState("");
    const [form, setForm] = useState({
        name: "",
        description: "",
        monthly_price: "",
        annual_price: "",
        duration_days: 30,
        product_limit: "",
        is_active: true,
    });
    const openCreateModal = () => {
        setForm({
            name: "",
            description: "",
            monthly_price: "",
            annual_price: "",
            duration_days: 30,
            product_limit: "",
            is_active: true,
        });
        setEditingPlanId(null);
        setFormError("");
        setShowModal(true);
    };

    const openEditModal = (plan) => {
        setForm({
            name: plan.name,
            description: plan.description || "",
            monthly_price: plan.monthly_price,
            annual_price: plan.annual_price,
            duration_days: plan.duration_days,
            product_limit: plan.product_limit ?? "",
            is_active: plan.is_active,
        });
        setEditingPlanId(plan.id);
        setFormError("");
        setShowModal(true);
    };

    const handleDeletePlan = async (id) => {
        if (!window.confirm("Are you sure you want to delete this plan?")) return;
        try {
            await subscriptionPlanApi.delete(id);
            await loadPlans();
        } catch (error) {
            console.error("Failed to delete plan:", error);
            alert("Failed to delete plan");
        }
    };

    const handleSavePlan = async (e) => {
        e.preventDefault();
        setFormError("");

        if (!form.name.trim()) {
            setFormError("Plan name is required");
            return;
        }
        if (!form.monthly_price || Number(form.monthly_price) < 0) {
            setFormError("Enter a valid monthly price");
            return;
        }
        if (!form.annual_price || Number(form.annual_price) < 0) {
            setFormError("Enter a valid annual price");
            return;
        }
        if (!form.duration_days || Number(form.duration_days) <= 0) {
            setFormError("Enter a valid duration");
            return;
        }

        try {
            setSaving(true);

            const data = {
                name: form.name,
                description: form.description,

                monthly_price: form.monthly_price,
                annual_price: form.annual_price,

                duration_days: Number(form.duration_days),

                product_limit:
                    form.product_limit === ""
                        ? null
                        : Number(form.product_limit),

                is_active: form.is_active,
            };

            if (editingPlanId) {
                await subscriptionPlanApi.update(editingPlanId, data);
            } else {
                await subscriptionPlanApi.create(data);
            }

            await loadPlans();
            setShowModal(false);
        } catch (error) {
            console.error("Failed to save plan:", error);
            setFormError("Failed to save subscription plan");
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        loadPlans();
    }, []);

    const loadPlans = async () => {
        try {
            const response = await subscriptionPlanApi.list();
            setPlans(response);
        } catch (error) {
            console.error("Failed to load plans:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0">
            <AdminPageHeader
                title="Subscription Plans"
                subtitle="Manage the plans vendors can subscribe to"
                action={
                    <button
                        onClick={openCreateModal}
                        className="inline-flex items-center gap-2 rounded-lg bg-plum-950 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-plum-900 transition-colors"
                    >
                        <FiPlus className="size-4 shrink-0" />
                        <span>Add Plan</span>
                    </button>
                }
            />

            {/* Loading state */}
            {loading ? (
                <div className="mt-16 flex flex-col items-center justify-center gap-2">
                    <div className="h-7 w-7 animate-spin rounded-full border-3 border-slate-200 border-t-plum-950" />
                    <span className="text-xs text-slate-400">Loading plans...</span>
                </div>
            ) : plans.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-16 text-center">
                    <p className="font-medium text-slate-800">No subscription plans yet</p>
                    <p className="mt-1 text-xs text-slate-400">Click "Add Plan" to create your first plan.</p>
                </div>
            ) : (
                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {plans.map((plan) => (
                        <div
                            key={plan.id}
                            className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
                        >
                            {/* Status badge */}
                            <span
                                className={`absolute top-4 right-4 rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${plan.is_active
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-slate-100 text-slate-500"
                                    }`}
                            >
                                {plan.is_active ? "Active" : "Inactive"}
                            </span>

                            <h2 className="pr-16 text-lg font-bold font-display text-plum-950">{plan.name}</h2>

                            {plan.description && (
                                <p className="mt-1.5 text-sm text-slate-500 line-clamp-2">{plan.description}</p>
                            )}

                            <div className="mt-4 flex flex-col gap-1.5">
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-bold text-plum-950">₹{plan.monthly_price}</span>
                                    <span className="text-xs font-medium uppercase text-slate-400">
                                        / monthly
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-xl font-bold text-plum-950">₹{plan.annual_price}</span>
                                    <span className="text-xs font-medium uppercase text-slate-400">
                                        / annual
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Duration</span>
                                    <span className="font-medium text-slate-800">{plan.duration_days} days</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-slate-400">Product limit</span>
                                    <span className="font-medium text-slate-800">
                                        {plan.product_limit ?? (
                                            <span className="rounded bg-gold-500/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold-600">
                                                Unlimited
                                            </span>
                                        )}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center gap-1.5 border-t border-slate-100 pt-4">
                                <button
                                    onClick={() => openEditModal(plan)}
                                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                                >
                                    <FiEdit2 className="size-3.5" />
                                    <span>Edit</span>
                                </button>
                                <button
                                    onClick={() => handleDeletePlan(plan.id)}
                                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                                >
                                    <FiTrash2 className="size-3.5" />
                                    <span>Delete</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create / Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="mb-5 flex items-center justify-between">
                            <h2 className="text-xl font-bold text-plum-950">
                                {editingPlanId ? "Edit Subscription Plan" : "Add Subscription Plan"}
                            </h2>
                            <button
                                onClick={() => setShowModal(false)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                            >
                                <FiX className="size-5" />
                            </button>
                        </div>

                        {formError && (
                            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
                        )}

                        <form onSubmit={handleSavePlan} className="space-y-4">
                            {/* Plan Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Plan Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    placeholder="Basic"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="For small vendors"
                                    rows={3}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Monthly Price */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Monthly Price (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.monthly_price}
                                        onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
                                        placeholder="499"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                                    />
                                </div>

                                {/* Annual Price */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Annual Price (₹) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.annual_price}
                                        onChange={(e) => setForm({ ...form, annual_price: e.target.value })}
                                        placeholder="4999"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Duration */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Duration (days) <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.duration_days}
                                        onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                                    />
                                </div>

                                {/* Product Limit */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Product Limit</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={form.product_limit}
                                        onChange={(e) => setForm({ ...form, product_limit: e.target.value })}
                                        placeholder="Unlimited"
                                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                                    />
                                </div>
                            </div>
                            <p className="-mt-2 text-xs text-slate-400">Leave product limit empty to allow unlimited products.</p>

                            {/* Active */}
                            <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form.is_active}
                                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                                    className="size-4 rounded border-slate-300 text-plum-950 focus:ring-gold-500/50"
                                />
                                <span className="text-sm font-medium text-slate-700">Plan is active</span>
                            </label>

                            {/* Buttons */}
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="rounded-lg bg-plum-950 px-4 py-2 text-sm font-medium text-white hover:bg-plum-900 transition-colors disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : editingPlanId ? "Update Plan" : "Create Plan"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}