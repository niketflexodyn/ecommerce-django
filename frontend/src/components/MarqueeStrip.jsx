const fontBody = { fontFamily: "'Jost', sans-serif" };

// Row 1 — brand promises scrolling left, separated by a star.
const PROMISES = [
  'Free Shipping Over ₹50',
  'Secure Checkout',
  '30-Day Easy Returns',
  'Curated Quality',
  '24/7 Customer Care',
  'New Drops Weekly',
];

// Row 2 — category mood words scrolling right, separated by a diamond.
const VIBES = [
  'Fashion',
  'Electronics',
  'Home & Kitchen',
  'Beauty & Health',
  'Sports & Outdoors',
  'Books',
  'Everyday Essentials',
  'Standout Finds',
];

const Star = () => (
  <span className="mx-6 inline-flex text-[#C9A227] sm:mx-8" aria-hidden="true">
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 21 12 16.51 5.79 21l2.39-7.15L2 9.36h7.61z" />
    </svg>
  </span>
);

const Diamond = () => <span className="mx-5 text-[#C9A227]/70 sm:mx-7" aria-hidden="true">◆</span>;

// Render the list twice so the -50% translate loops seamlessly.
const Row = ({ items, separator: Sep, reverse, className }) => (
  <div className="flex w-max flex-nowrap" aria-hidden="true">
    <div className={`marquee-track ${reverse ? 'animate-marquee-reverse' : 'animate-marquee'} ${className}`}>
      {[...items, ...items].map((item, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <span>{item}</span>
          <Sep />
        </span>
      ))}
    </div>
  </div>
);

export default function MarqueeStrip() {
  return (
    <section className="relative overflow-hidden bg-[#E8C766] py-5 sm:py-6" style={fontBody}>
      {/* Edge fades so items dissolve in/out instead of hard-cutting */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#E8C766] to-transparent sm:w-28" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#E8C766] to-transparent sm:w-28" />

      <div className="marquee-pause relative select-none">
        <Row
          items={PROMISES}
          separator={Star}
          className="text-lg font-semibold uppercase tracking-[0.18em] text-[#2A1A2C] sm:text-xl"
        />
        <div className="mt-3 border-t border-[#2A1A2C]/10" />
        <Row
          items={VIBES}
          separator={Diamond}
          reverse
          className="mt-3 text-sm font-medium uppercase tracking-[0.25em] text-[#3D2136]/80"
        />
      </div>
    </section>
  );
}