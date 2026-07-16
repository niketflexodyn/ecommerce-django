import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { useScrollReveal } from "../hooks/useScrollReveal";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const banners = [
  {
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200",
    category: "Fashion & Apparel",
    title: "Style That Speaks for You",
    subtitle: "Trending Looks, Every Season",
    badge: "New Season",
    cta: "Shop Fashion",
  },
  {
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200",
    category: "Electronics & Gadgets",
    title: "Tech That Powers Your Day",
    subtitle: "Latest Gadgets, Best Prices",
    badge: "Up to 40% Off",
    cta: "Shop Electronics",
  },
  {
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200",
    category: "Home & Living",
    title: "Spaces You'll Love Coming Home To",
    subtitle: "Furniture, Decor & More",
    badge: "Bestseller",
    cta: "Shop Home",
  },
  {
    image:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200",
    category: "Beauty & Personal Care",
    title: "Look Good. Feel Better.",
    subtitle: "Skincare, Makeup & Grooming",
    badge: "New Arrival",
    cta: "Shop Beauty",
  },
];

const fontDisplay = { fontFamily: "'Playfair Display', serif" };
const fontBody = { fontFamily: "'Jost', sans-serif" };

export default function Hero() {
  const [revealRef, revealed] = useScrollReveal();

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #2A1A2C 0%, #3D2136 55%, #4A2536 100%)",
      }}
    >
      {/* Swiper theme overrides */}
      <style>{`
        .hero-swiper .swiper-pagination-bullet {
          background: rgba(255,255,255,0.5);
          opacity: 1;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: #E8C766;
        }
        .hero-swiper .swiper-button-next,
        .hero-swiper .swiper-button-prev {
          color: #E8C766;
        }
      `}</style>

      {/* Signature: oversized ghost word behind the copy */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-6 top-1/2 hidden -translate-y-1/2 select-none text-[220px] font-bold italic leading-none text-white/[0.04] lg:block"
        style={fontDisplay}
      >
        Discover
      </span>

      <div className="page-container relative py-16 lg:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div ref={revealRef} className={`text-white ${revealed ? "animate-fade-up" : "opacity-0"}`} style={fontBody}>
            <span className={`inline-flex items-center gap-2 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[#E8C766] ${revealed ? "animate-fade-up delay-150" : "opacity-0"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8C766]" />
              Everything You Need, In One Place
            </span>

            <h1
              className={`mt-6 text-5xl font-bold leading-[1.05] lg:text-6xl ${revealed ? "animate-fade-up delay-300" : "opacity-0"}`}
              style={fontDisplay}
            >
              Shop Every Category,
              <span className="block italic text-[#E8C766]">
                All in One Store
              </span>
            </h1>

            <p className={`mt-6 max-w-xl text-lg leading-8 text-white/70 ${revealed ? "animate-fade-up delay-450" : "opacity-0"}`}>
              From fashion and electronics to home essentials and beauty —
              discover thousands of products across every category, all in
              one place.
            </p>

            <div className={`mt-10 flex flex-wrap gap-4 ${revealed ? "animate-fade-up delay-600" : "opacity-0"}`}>
              <Link
                to="/#products"
                className="rounded-full bg-[#E8C766] px-8 py-4 font-semibold text-[#2A1A2C] shadow-md shadow-[#E8C766]/20 transition duration-300 hover:scale-[1.03] hover:bg-[#F1D9A0]"
              >
                Shop Now
              </Link>

              <Link
                to="/"
                className="rounded-full border border-white/30 px-8 py-4 font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                Browse Categories
              </Link>
            </div>

            {/* E-commerce trust strip */}
            <div className={`mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 ${revealed ? "animate-fade-up" : "opacity-0"}`}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/70">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 shrink-0">
                  <path d="M8 1a3 3 0 0 0-3 3v2H3.5A1.5 1.5 0 0 0 2 7.5v6A1.5 1.5 0 0 0 3.5 15h9A1.5 1.5 0 0 0 14 13.5v-6A1.5 1.5 0 0 0 12.5 6H11V4a3 3 0 0 0-3-3Zm2 5V4a2 2 0 1 0-4 0v2h4Z" />
                </svg>
                Free shipping over $50
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/70">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 shrink-0">
                  <path fillRule="evenodd" d="M8.5 1.669a.75.75 0 0 0-1 0L3.638 5.03a.75.75 0 0 0-.25.55v5.17c0 .414.336.75.75.75h2.362a.75.75 0 0 0 .75-.75V8.5h1v2.25c0 .414.336.75.75.75h2.362a.75.75 0 0 0 .75-.75V5.58a.75.75 0 0 0-.25-.55L8.5 1.67Z" clipRule="evenodd" />
                  <path d="M1 12.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5A.75.75 0 0 1 1 12.75ZM6.25 12.75a.75.75 0 0 1 .75-.75h2a.75.75 0 0 1 0 1.5H7a.75.75 0 0 1-.75-.75ZM11 12.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 0 1.5h-1.5a.75.75 0 0 1-.75-.75Z" />
                </svg>
                Secure checkout
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/70">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 shrink-0">
                  <path fillRule="evenodd" d="M12.576 3.424a.75.75 0 0 0-1.06-1.06l-7.18 7.18a.75.75 0 1 0 1.06 1.06l7.18-7.18ZM3.464 7.464a.75.75 0 0 0-1.06-1.06L1.06 7.747a.75.75 0 1 0 1.06 1.06l1.344-1.343ZM8.464 12.464a.75.75 0 0 0-1.06-1.06l-1.344 1.343a.75.75 0 0 0 1.06 1.06l1.344-1.343Z" clipRule="evenodd" />
                </svg>
                30-day returns
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/70">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 shrink-0">
                  <path d="M8 1a.75.75 0 0 1 .69.457l1.246 2.972 3.216.267a.75.75 0 0 1 .426 1.317l-2.453 2.115.742 3.143a.75.75 0 0 1-1.114.808L8 10.606l-2.753 1.873a.75.75 0 0 1-1.114-.808l.742-3.143L2.422 6.013a.75.75 0 0 1 .426-1.317l3.216-.267L7.31 1.457A.75.75 0 0 1 8 1Z" />
                </svg>
                4.8/5 from 10,000+ reviews
              </span>
            </div>

            {/* Stats */}
            <div className="mt-14 flex flex-wrap gap-10 border-t border-white/10 pt-8">
              <div className="border-l-2 border-[#E8C766]/40 pl-6">
                <h2 className="text-3xl font-bold" style={fontDisplay}>
                  100K+
                </h2>
                <p className="text-white/60">Happy Customers</p>
              </div>

              <div className="border-l-2 border-[#E8C766]/40 pl-6">
                <h2 className="text-3xl font-bold" style={fontDisplay}>
                  10,000+
                </h2>
                <p className="text-white/60">Products</p>
              </div>

              <div className="border-l-2 border-[#E8C766]/40 pl-6">
                <h2 className="text-3xl font-bold" style={fontDisplay}>
                  20+
                </h2>
                <p className="text-white/60">Categories</p>
              </div>
            </div>
          </div>

          {/* Right Slider */}
          <div className="relative">
            <div className="absolute -top-20 -right-20 size-96 rounded-full bg-[#E8C766] opacity-[0.08] blur-3xl pointer-events-none" />
            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              spaceBetween={30}
              slidesPerView={1}
              loop={true}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}
              pagination={{
                clickable: true,
              }}
              navigation={true}
              className="hero-swiper rounded-3xl shadow-2xl ring-1 ring-white/10"
            >
              {banners.map((banner, index) => (
                <SwiperSlide key={index}>
                  <div className="relative h-[550px] overflow-hidden rounded-3xl">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#2A1A2C]/85 via-[#2A1A2C]/10 to-transparent" />

                    {/* Promo/status badge */}
                    <span className="absolute right-6 top-6 rounded-full bg-[#E8C766] px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-[#2A1A2C]">
                      {banner.badge}
                    </span>

                    <div className="absolute bottom-10 left-10 text-white">
                      <p
                        className="text-xs font-semibold uppercase tracking-[0.2em] text-[#E8C766]"
                        style={fontBody}
                      >
                        {banner.category}
                      </p>

                      <h2 className="mt-2 text-4xl font-bold" style={fontDisplay}>
                        {banner.title}
                      </h2>

                      <p className="mt-3 text-lg text-white/70">
                        {banner.subtitle}
                      </p>

                      <Link
                        to="/#products"
                        className="mt-5 inline-block border-b border-[#E8C766] pb-1 text-sm font-semibold uppercase tracking-wide text-[#E8C766] transition hover:text-[#F1D9A0]"
                      >
                        {banner.cta} →
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </section>
  );
}