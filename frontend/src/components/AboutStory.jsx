import { useScrollReveal } from '../hooks/useScrollReveal';

const fontDisplay = { fontFamily: "'Playfair Display', serif" };
const fontBody = { fontFamily: "'Jost', sans-serif" };

// Small trust tiles that back up the brand story with a few numbers.
const STATS = [
  { value: '500+', label: 'Curated products' },
  { value: '4.8★', label: 'Average rating' },
  { value: '30-day', label: 'Easy returns' },
];

export default function AboutStory() {
  const [ref, revealed] = useScrollReveal(0.2);

  const scrollToProducts = (e) => {
    e.preventDefault();
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section ref={ref} className="border-y border-slate-100 bg-[#FBF8F3]" style={fontBody}>
      <div className="page-container py-16 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div className={`max-w-xl ${revealed ? 'animate-fade-up' : 'opacity-0'}`}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-[#C9A227]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8C766]" />
              Our Story
            </span>

            <h2 className="mt-4 text-3xl font-bold text-[#2A1A2C] sm:text-4xl" style={fontDisplay}>
              Curated for the modern shopper
            </h2>

            <p className="mt-5 text-base leading-relaxed text-slate-600">
              We started with a simple idea: great products shouldn't be hard to find. Every item
              in our collection is hand-picked for quality, design, and value — so you can shop
              with confidence and skip the endless scrolling.
            </p>

            <p className="mt-4 text-base leading-relaxed text-slate-600">
              From everyday essentials to standout finds, our marketplace brings together the
              things you actually want, backed by secure checkout, fast delivery, and a support
              team that genuinely cares.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#products"
                onClick={scrollToProducts}
                className="inline-flex items-center gap-2 rounded-lg bg-[#2A1A2C] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#3D2136]"
              >
                Explore the collection
                <svg className="size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </a>
              <span className="text-sm text-slate-500">No account needed to browse.</span>
            </div>
          </div>

          {/* Visual panel */}
          <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#2A1A2C] via-[#3D2136] to-[#4A2536] p-8 text-white shadow-xl sm:p-10 ${
              revealed ? 'animate-fade-up delay-150' : 'opacity-0'
            }`}
          >
            {/* soft gold glow */}
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#E8C766]/[0.08] blur-3xl" />
            <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-[#E8C766]/[0.06] blur-3xl" />

            <div className="relative">
              <svg className="size-8 text-[#E8C766]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9.983 3v7.391c0 5.704-3.731 9.57-8.983 10.609l-.995-2.151c2.432-.917 3.995-3.638 3.995-5.849h-4v-10h9.983zm14.017 0v7.391c0 5.704-3.748 9.571-9 10.609l-.996-2.151c2.433-.917 3.996-3.638 3.996-5.849h-3.983v-10h9.983z" />
              </svg>

              <p className="mt-6 text-xl font-medium leading-relaxed sm:text-2xl" style={fontDisplay}>
                Quality you can trust, prices you'll love, and a checkout that's done in seconds.
              </p>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-sm font-semibold tracking-wide text-[#E8C766]">The Marketplace Team</p>
                <p className="mt-1 text-sm text-white/50">Curating better shopping, every day.</p>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4">
                {STATS.map((stat) => (
                  <div key={stat.label} className="rounded-xl bg-white/5 px-3 py-4 text-center ring-1 ring-white/10">
                    <div className="text-lg font-bold text-white" style={fontDisplay}>
                      {stat.value}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-wide text-white/50">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}