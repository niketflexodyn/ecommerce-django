import { useScrollReveal } from '../hooks/useScrollReveal';

const FEATURES = [
  {
    title: 'Free Shipping',
    subtitle: 'On orders over ₹50',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 1-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 1-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a8.25 8.25 0 0 0-2.034-4.926l-.726-.726a1.125 1.125 0 0 1-.298-.774V6.375c0-.621-.504-1.125-1.125-1.125H14.25M3.75 14.25h7.875c.621 0 1.125.504 1.125 1.125v3.75M3.75 14.25V6.375c0-.621.504-1.125 1.125-1.125h6.75" />
      </svg>
    ),
  },
  {
    title: 'Secure Checkout',
    subtitle: 'SSL encrypted payments',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    title: 'Easy Returns',
    subtitle: '30-day hassle-free returns',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
      </svg>
    ),
  },
  {
    title: '24/7 Support',
    subtitle: 'Dedicated customer care',
    icon: (
      <svg className="size-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.019-.158-2.978-.23-5.981-.988-7.79-2.572A4.003 4.003 0 0 1 2 12.614V10.61c0-1.003.59-1.897 1.5-2.398M20.25 8.511A8.966 8.966 0 0 0 12 2a8.966 8.966 0 0 0-8.25 5.213" />
      </svg>
    ),
  },
];

export default function FeaturesStrip() {
  const [ref, revealed] = useScrollReveal(0.2);

  return (
    <section ref={ref} className="font-body border-y border-slate-100 bg-white">
      <div className="page-container py-10 sm:py-12">
        <div className={`grid grid-cols-2 gap-8 md:grid-cols-4 ${revealed ? 'animate-fade-up' : 'opacity-0'}`}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold-500/15 text-gold-600">
                {feature.icon}
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-plum-950">
                  {feature.title}
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">{feature.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}