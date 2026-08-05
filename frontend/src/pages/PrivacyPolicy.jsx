import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  const location = useLocation();

  // Determine active tab based on route pathname or default to 'privacy'
  const getInitialTab = () => {
    if (location.pathname.includes('terms')) return 'terms';
    if (location.pathname.includes('refund') || location.pathname.includes('return')) return 'refund';
    if (location.pathname.includes('shipping')) return 'shipping';
    if (location.pathname.includes('security') || location.pathname.includes('cookie')) return 'security';
    return 'privacy';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const tabs = [
    {
      id: 'privacy',
      name: 'Privacy Policy',
      icon: (
        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
        </svg>
      ),
      tagline: 'How we collect, protect, and handle your personal information.',
    },
    {
      id: 'terms',
      name: 'Terms & Conditions',
      icon: (
        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
      ),
      tagline: 'Rules, guidelines, and agreements for shopping on Luxora.',
    },
    {
      id: 'refund',
      name: 'Refund & Return Policy',
      icon: (
        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
      ),
      tagline: 'Hassle-free 30-day returns and transparent refund timelines.',
    },
    {
      id: 'shipping',
      name: 'Shipping Policy',
      icon: (
        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.215-9.102L16.5 5.25h-4.5v13.5m0 0h-3.75" />
        </svg>
      ),
      tagline: 'Express delivery options, shipping rates, and tracking details.',
    },
    {
      id: 'security',
      name: 'Data & Security',
      icon: (
        <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
        </svg>
      ),
      tagline: 'Bank-grade encryption and secure payment processing.',
    },
  ];

  return (
    <div className="font-body min-h-screen bg-slate-50 py-10 sm:py-16">
      <div className="page-container">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-slate-500">
          <Link to="/" className="transition hover:text-plum-950">Home</Link>
          <span>/</span>
          <span className="text-slate-400">Policies & Legal</span>
          <span>/</span>
          <span className="font-semibold text-plum-950 capitalize">{tabs.find((t) => t.id === activeTab)?.name}</span>
        </nav>

        {/* Hero Banner */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-linear-to-br from-plum-950 via-plum-900 to-plum-800 p-8 text-white shadow-xl sm:p-12">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-gold-500/10 blur-3xl" />

          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold-400/30 bg-gold-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-400">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              Luxora Trust & Transparency
            </span>

            <h1 className="font-display mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Legal & Privacy Center
            </h1>

            <p className="mt-4 text-base leading-relaxed text-white/70 sm:text-lg">
              We value your trust above everything. Explore our policies to learn how we protect your personal data, ensure seamless shopping, and uphold world-class customer transparency.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-white/60">
              <div className="flex items-center gap-2">
                <svg className="size-4 text-gold-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>Last Updated: February 2026</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="size-4 text-gold-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>GDPR & DPDP Act Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="size-4 text-gold-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg>
                <span>256-Bit SSL Encryption</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Layout */}
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Sidebar / Tab navigation */}
          <aside className="lg:col-span-4">
            <div className="sticky top-24 space-y-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm">
              <h2 className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                Navigation
              </h2>
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`flex w-full items-start gap-3 rounded-xl p-3.5 text-left transition-all duration-200 ${
                      isActive
                        ? 'bg-plum-950 text-white shadow-md'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-plum-950'
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg ${
                        isActive ? 'bg-gold-500 text-plum-950' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {tab.icon}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">{tab.name}</div>
                      <div
                        className={`text-xs leading-snug line-clamp-1 ${
                          isActive ? 'text-white/70' : 'text-slate-500'
                        }`}
                      >
                        {tab.tagline}
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Contact Support Tile */}
              <div className="mt-4 rounded-xl border border-gold-500/20 bg-linear-to-br from-cream to-white p-4">
                <div className="flex items-center gap-2 text-xs font-bold text-plum-950">
                  <svg className="size-4 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                  <span>Have questions?</span>
                </div>
                <p className="mt-1 text-xs text-slate-600">
                  Reach out to our Data Protection & Privacy team directly.
                </p>
                <a
                  href="mailto:support@mystore.com"
                  className="mt-3 inline-block w-full rounded-lg bg-plum-950 py-2 text-center text-xs font-semibold text-white transition hover:bg-plum-900"
                >
                  support@mystore.com
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-8">
            <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-10">
              {/* TAB 1: PRIVACY POLICY */}
              {activeTab === 'privacy' && (
                <div className="space-y-8">
                  <div>
                    <span className="inline-block rounded-full bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700">
                      Privacy & Data Protection
                    </span>
                    <h2 className="font-display mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                      Luxora Privacy Policy
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Effective Date: January 1, 2026 | Last Reviewed: February 2026
                    </p>
                  </div>

                  <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 space-y-6">
                    <p>
                      At <strong>Luxora</strong>, we respect your privacy and are committed to safeguarding your personal data. This Privacy Policy describes how we collect, use, process, and disclose your information when you browse our website, make purchases, or interact with our customer support.
                    </p>

                    {/* Section 1 */}
                    <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                      <h3 className="font-display text-lg font-bold text-plum-950 flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-plum-950 text-xs font-semibold text-white">1</span>
                        Information We Collect
                      </h3>
                      <p className="mt-3 text-slate-600">
                        We collect information necessary to provide seamless shopping experiences, process your transactions, and personalize your luxury journey:
                      </p>
                      <ul className="mt-3 list-disc pl-5 space-y-1.5 text-slate-600">
                        <li><strong>Personal Identification:</strong> Name, email address, phone number, shipping address, and billing address.</li>
                        <li><strong>Account Details:</strong> Login credentials, profile preferences, saved wishlist items, and order history.</li>
                        <li><strong>Payment Information:</strong> Transaction identifiers, payment methods (we do not store raw credit/debit card numbers; transactions are processed via secure certified gateways like Razorpay/Stripe).</li>
                        <li><strong>Device & Browsing Data:</strong> IP address, browser type, operating system, pages visited, time spent, and cookie identifiers.</li>
                      </ul>
                    </div>

                    {/* Section 2 */}
                    <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                      <h3 className="font-display text-lg font-bold text-plum-950 flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-plum-950 text-xs font-semibold text-white">2</span>
                        How We Use Your Information
                      </h3>
                      <p className="mt-3 text-slate-600">
                        Your information is used strictly for legitimate business purposes:
                      </p>
                      <ul className="mt-3 list-disc pl-5 space-y-1.5 text-slate-600">
                        <li>Processing and delivering your orders with real-time tracking updates.</li>
                        <li>Managing your account, wishlists, and order histories securely.</li>
                        <li>Providing responsive 24/7 customer care and handling return requests.</li>
                        <li>Detecting and preventing fraudulent transactions, security breaches, and abuse.</li>
                        <li>Sending order confirmations, tracking notifications, and relevant product recommendations (with easy opt-out options).</li>
                      </ul>
                    </div>

                    {/* Section 3 */}
                    <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                      <h3 className="font-display text-lg font-bold text-plum-950 flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-plum-950 text-xs font-semibold text-white">3</span>
                        Information Sharing & Third Parties
                      </h3>
                      <p className="mt-3 text-slate-600">
                        <strong>We never sell, rent, or trade your personal information.</strong> We only share data with vetted partners required to deliver our services:
                      </p>
                      <ul className="mt-3 list-disc pl-5 space-y-1.5 text-slate-600">
                        <li><strong>Payment Processors:</strong> Certified PCI-DSS compliant providers handling encrypted transactions.</li>
                        <li><strong>Logistics & Courier Partners:</strong> Trusted delivery services that receive solely the recipient's name, phone, and delivery address.</li>
                        <li><strong>Cloud Infrastructure:</strong> Secure enterprise cloud hosting with encrypted database storage.</li>
                        <li><strong>Legal Authorities:</strong> Only when strictly required by applicable law or judicial subpoena.</li>
                      </ul>
                    </div>

                    {/* Section 4 */}
                    <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                      <h3 className="font-display text-lg font-bold text-plum-950 flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-plum-950 text-xs font-semibold text-white">4</span>
                        Your Privacy Rights & Controls
                      </h3>
                      <p className="mt-3 text-slate-600">
                        Under global and domestic data privacy laws (including GDPR and the Digital Personal Data Protection Act), you have the right to:
                      </p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-white p-3.5 border border-slate-200/80">
                          <span className="font-semibold text-slate-900">Access & Export:</span>
                          <p className="text-xs text-slate-500 mt-1">Request a copy of all personal information we hold about you.</p>
                        </div>
                        <div className="rounded-xl bg-white p-3.5 border border-slate-200/80">
                          <span className="font-semibold text-slate-900">Correction & Update:</span>
                          <p className="text-xs text-slate-500 mt-1">Update incorrect or outdated details directly in your Profile page.</p>
                        </div>
                        <div className="rounded-xl bg-white p-3.5 border border-slate-200/80">
                          <span className="font-semibold text-slate-900">Right to Erasure:</span>
                          <p className="text-xs text-slate-500 mt-1">Request permanent deletion of your account and personal history.</p>
                        </div>
                        <div className="rounded-xl bg-white p-3.5 border border-slate-200/80">
                          <span className="font-semibold text-slate-900">Communication Preferences:</span>
                          <p className="text-xs text-slate-500 mt-1">Easily unsubscribe from marketing emails with one click.</p>
                        </div>
                      </div>
                    </div>

                    {/* Section 5 */}
                    <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100">
                      <h3 className="font-display text-lg font-bold text-plum-950 flex items-center gap-2">
                        <span className="flex size-6 items-center justify-center rounded-full bg-plum-950 text-xs font-semibold text-white">5</span>
                        Cookies & Tracking Preferences
                      </h3>
                      <p className="mt-3 text-slate-600">
                        We use standard essential cookies to keep items in your cart, maintain your login session, and analyze site performance. You can manage or disable cookie preferences through your browser settings at any time without losing access to basic browsing.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TERMS & CONDITIONS */}
              {activeTab === 'terms' && (
                <div className="space-y-8">
                  <div>
                    <span className="inline-block rounded-full bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700">
                      User Agreement
                    </span>
                    <h2 className="font-display mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                      Terms & Conditions
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Effective Date: January 1, 2026
                    </p>
                  </div>

                  <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 space-y-6">
                    <p>
                      Welcome to <strong>Luxora</strong>. By accessing or shopping on our website, you agree to comply with and be bound by the following terms and conditions.
                    </p>

                    <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 space-y-4">
                      <h3 className="font-display text-lg font-bold text-plum-950">1. Account Registration & Eligibility</h3>
                      <p>
                        To purchase products, you may create an account or checkout as a registered customer. You agree to provide accurate and complete information and maintain the confidentiality of your account credentials.
                      </p>

                      <h3 className="font-display text-lg font-bold text-plum-950">2. Pricing & Product Availability</h3>
                      <p>
                        All product prices are listed in INR (₹) and are inclusive of applicable taxes unless specified otherwise. We reserve the right to revise product specifications, images, and prices without prior notice. In the event of a technical pricing error, we reserve the right to cancel affected orders and issue a full refund.
                      </p>

                      <h3 className="font-display text-lg font-bold text-plum-950">3. Orders & Payment Processing</h3>
                      <p>
                        Receipt of an order confirmation does not constitute acceptance of an order. We reserve the right to decline or limit orders suspected of unauthorized reseller behavior or fraudulent activity.
                      </p>

                      <h3 className="font-display text-lg font-bold text-plum-950">4. Intellectual Property</h3>
                      <p>
                        All trademarks, graphics, logos, product imagery, and designs are the exclusive property of Luxora. Any reproduction or unauthorized use is strictly prohibited.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: REFUND & RETURN POLICY */}
              {activeTab === 'refund' && (
                <div className="space-y-8">
                  <div>
                    <span className="inline-block rounded-full bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700">
                      Returns & Exchanges
                    </span>
                    <h2 className="font-display mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                      Refund & Return Policy
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      30-Day Risk-Free Guarantee
                    </p>
                  </div>

                  <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 space-y-6">
                    <p>
                      At Luxora, we stand behind the quality of every product we curate. If you are not completely satisfied with your purchase, we are here to help.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5 text-center">
                        <div className="font-display text-2xl font-bold text-plum-950">30 Days</div>
                        <div className="mt-1 text-xs font-semibold uppercase text-slate-500">Return Window</div>
                        <p className="mt-2 text-xs text-slate-600">Return eligible items within 30 days of delivery date.</p>
                      </div>

                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5 text-center">
                        <div className="font-display text-2xl font-bold text-plum-950">Free Pickup</div>
                        <div className="mt-1 text-xs font-semibold uppercase text-slate-500">Doorstep Collection</div>
                        <p className="mt-2 text-xs text-slate-600">Our logistics team will collect the parcel from your doorstep.</p>
                      </div>

                      <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-5 text-center">
                        <div className="font-display text-2xl font-bold text-plum-950">3-5 Days</div>
                        <div className="mt-1 text-xs font-semibold uppercase text-slate-500">Refund Processing</div>
                        <p className="mt-2 text-xs text-slate-600">Funds credited back to original payment mode swiftly.</p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 space-y-3">
                      <h3 className="font-display text-base font-bold text-plum-950">Return Conditions</h3>
                      <ul className="list-disc pl-5 space-y-1 text-slate-600">
                        <li>Item must be unused, in original condition with all tags and protective packaging intact.</li>
                        <li>Products marked as non-returnable (e.g. customized items or intimate hygiene products) will be indicated on product pages.</li>
                        <li>To initiate a return, visit your <strong>Order History</strong> or contact support@mystore.com with your order number.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SHIPPING POLICY */}
              {activeTab === 'shipping' && (
                <div className="space-y-8">
                  <div>
                    <span className="inline-block rounded-full bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700">
                      Fulfillment & Tracking
                    </span>
                    <h2 className="font-display mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                      Shipping & Delivery Policy
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Fast, Insured & Tracked Deliveries
                    </p>
                  </div>

                  <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 space-y-6">
                    <p>
                      We partner with top-tier courier networks to ensure your luxury items reach you quickly and in immaculate condition.
                    </p>

                    <div className="overflow-hidden rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-plum-950 text-white">
                          <tr>
                            <th className="p-3.5">Shipping Method</th>
                            <th className="p-3.5">Estimated Time</th>
                            <th className="p-3.5">Cost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 bg-white">
                          <tr>
                            <td className="p-3.5 font-semibold text-slate-900">Standard Delivery</td>
                            <td className="p-3.5 text-slate-600">3 - 5 Business Days</td>
                            <td className="p-3.5 text-emerald-600 font-semibold">FREE (Orders ₹50+)</td>
                          </tr>
                          <tr>
                            <td className="p-3.5 font-semibold text-slate-900">Express Priority</td>
                            <td className="p-3.5 text-slate-600">1 - 2 Business Days</td>
                            <td className="p-3.5 text-slate-700">₹99</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="rounded-2xl bg-slate-50 p-6 border border-slate-100 space-y-3">
                      <h3 className="font-display text-base font-bold text-plum-950">Real-Time Tracking</h3>
                      <p className="text-slate-600">
                        Once your order is dispatched, you will receive an SMS and email notification with an active tracking link. You can also view step-by-step delivery updates in your Luxora order dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: DATA & SECURITY */}
              {activeTab === 'security' && (
                <div className="space-y-8">
                  <div>
                    <span className="inline-block rounded-full bg-gold-500/10 px-3 py-1 text-xs font-semibold text-gold-700">
                      Cybersecurity & Safeguards
                    </span>
                    <h2 className="font-display mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                      Data & Security Standards
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                      Enterprise-level security for your peace of mind
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-6">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-gold-500/20 text-gold-700">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                        </svg>
                      </div>
                      <h3 className="font-display mt-4 text-base font-bold text-plum-950">256-Bit SSL Encryption</h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        All web traffic and sensitive interactions are transmitted over bank-grade encrypted HTTPS protocols.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-6">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-gold-500/20 text-gold-700">
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                        </svg>
                      </div>
                      <h3 className="font-display mt-4 text-base font-bold text-plum-950">PCI-DSS Level 1</h3>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600">
                        Payment credentials are tokenized directly with certified payment gateways without touching our application servers.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
