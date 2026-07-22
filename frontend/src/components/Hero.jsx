import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import { useScrollReveal } from "../hooks/useScrollReveal";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import herophoto1 from "../assets/herophoto1.webp";
import heroImage2 from "../assets/hero-image2.webp";
import heroImage3 from "../assets/hero-image3.webp";
import heroImage5 from "../assets/hero-image5.webp";

const banners = [
  {
    image: herophoto1,
    category: "Fashion & Apparel",
    title: "Style That Speaks for You",
    subtitle: "Trending Looks, Every Season",
    badge: "New Season",
    cta: "Shop Fashion",
  },
  {
    image: heroImage2,
    category: "Electronics & Gadgets",
    title: "Tech That Powers Your Day",
    subtitle: "Latest Gadgets, Best Prices",
    badge: "Up to 40% Off",
    cta: "Shop Electronics",
  },
  {
    image: heroImage3,
    category: "Home & Living",
    title: "Spaces You'll Love Coming Home To",
    subtitle: "Furniture, Decor & More",
    badge: "Bestseller",
    cta: "Shop Home",
  },
  {
    image: heroImage5,
    category: "Beauty & Personal Care",
    title: "Look Good. Feel Better.",
    subtitle: "Skincare, Makeup & Grooming",
    badge: "New Arrival",
    cta: "Shop Beauty",
  },
];

export default function Hero() {
  const [revealRef, revealed] = useScrollReveal();

  return (
    <section
      className="relative overflow-hidden bg-linear-to-br from-plum-950 via-plum-900 to-plum-800"
    >
      {/* Swiper theme overrides */}
      <style>{`
        .hero-swiper .swiper-pagination-bullet {
          background: rgba(255,255,255,0.5);
          opacity: 1;
        }
        .hero-swiper .swiper-pagination-bullet-active {
          background: var(--color-gold-500);
        }
        .hero-swiper .swiper-button-next,
        .hero-swiper .swiper-button-prev {
          color: var(--color-gold-500);
        }
      `}</style>

      {/* Signature: oversized ghost word behind the copy */}
      <span
        aria-hidden="true"
        className="font-display pointer-events-none absolute -left-6 top-1/2 hidden -translate-y-1/2 select-none text-[220px] font-bold italic leading-none text-white/[0.04] lg:block"
      >
        Discover
      </span>

      <div className="page-container relative py-10 sm:py-16 lg:py-24">
        <div className="grid items-center gap-8 sm:gap-12 lg:grid-cols-2">
          {/* Left Content */}
          <div ref={revealRef} className={`font-body text-white ${revealed ? "animate-fade-up" : "opacity-0"}`}>
            <span className={`inline-flex items-center gap-2 rounded-full border border-gold-600/40 bg-gold-600/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-gold-500 ${revealed ? "animate-fade-up delay-150" : "opacity-0"}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
              Everything You Need, In One Place
            </span>

            <h1
              className={`font-display mt-5 text-4xl font-bold max-w-sm sm:max-w-lg leading-[1.08] sm:text-5xl sm:mt-6 lg:text-6xl ${revealed ? "animate-fade-up delay-300" : "opacity-0"}`}
            >
              Discover Premium Style,
              <span className="block italic text-gold-500">
                All in One Place
              </span>
            </h1>

            <p className={`mt-5 max-w-sm sm:max-w-xl  text-base leading-7 text-white/70 sm:mt-6 sm:text-lg sm:leading-8 ${revealed ? "animate-fade-up delay-450" : "opacity-0"}`}>
              From fashion and electronics to home essentials and beauty —
              discover thousands of products across every category, all in
              one place.
            </p>

            <div className={`mt-8 flex flex-wrap gap-3 sm:mt-10 sm:gap-4 ${revealed ? "animate-fade-up delay-600" : "opacity-0"}`}>
              <a
                href="#products"


                className="rounded-full bg-gold-500 px-6 py-3 text-sm font-semibold text-plum-950 shadow-md shadow-gold-500/20 transition duration-300 hover:scale-[1.03] hover:bg-gold-400 sm:px-8 sm:py-4 sm:text-base"
              >
                Shop Now
              </a>

              <a
                href="#products"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 sm:px-8 sm:py-4 sm:text-base"
              >
                Browse Categories
              </a>
            </div>

            {/* E-commerce trust strip */}
            <div className={`mt-6  flex flex-wrap items-center gap-x-4 gap-y-2 ${revealed ? "animate-fade-up" : "opacity-0"}`}>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/70">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 shrink-0">
                  <path d="M8 1a3 3 0 0 0-3 3v2H3.5A1.5 1.5 0 0 0 2 7.5v6A1.5 1.5 0 0 0 3.5 15h9A1.5 1.5 0 0 0 14 13.5v-6A1.5 1.5 0 0 0 12.5 6H11V4a3 3 0 0 0-3-3Zm2 5V4a2 2 0 1 0-4 0v2h4Z" />
                </svg>
                Free shipping over ₹50
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
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 sm:mt-14 sm:gap-10 sm:pt-8">
              <div className="border-l-2 border-gold-500/40 pl-3 sm:pl-6">
                <h2 className="font-display text-xl font-bold sm:text-3xl">
                  100K+
                </h2>
                <p className="text-xs text-white/60 sm:text-base">Happy Customers</p>
              </div>

              <div className="border-l-2 border-gold-500/40 pl-3 sm:pl-6">
                <h2 className="font-display text-xl font-bold sm:text-3xl">
                  10,000+
                </h2>
                <p className="text-xs text-white/60 sm:text-base">Products</p>
              </div>

              <div className="border-l-2 border-gold-500/40 pl-3 sm:pl-6">
                <h2 className="font-display text-xl font-bold sm:text-3xl">
                  20+
                </h2>
                <p className="text-xs text-white/60 sm:text-base">Categories</p>
              </div>
            </div>
          </div>

          {/* Right Slider */}
          <div className="relative min-w-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 size-96 rounded-full bg-gold-500 opacity-[0.08] blur-3xl pointer-events-none" />
            <Swiper
              modules={[Autoplay, Navigation]}
              spaceBetween={30}
              slidesPerView={1}
              loop={true}
              autoplay={{
                delay: 4000,
                disableOnInteraction: false,
              }}

              navigation={true}
              className="hero-swiper rounded-3xl shadow-2xl ring-1 ring-white/10"
            >
              {banners.map((banner, index) => (
                <SwiperSlide key={index}>
                  <div className="relative h-[280px] overflow-hidden rounded-2xl sm:h-[360px] md:h-[420px] md:rounded-3xl">
                    <img
                      src={banner.image}
                      alt={banner.title}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-0 bg-linear-to-t from-plum-950/85 via-plum-950/10 to-transparent" />

                    {/* Promo/status badge */}
                    <span className="absolute right-3 top-3 rounded-full bg-gold-500 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wide text-plum-950 md:right-4 md:top-4 md:px-3 md:py-1 md:text-[10px]">
                      {banner.badge}
                    </span>

                    <div className="absolute bottom-3 left-3 right-3 text-white sm:bottom-4 sm:left-4 sm:right-4 md:bottom-6 md:left-6 md:right-6">
                      <p
                        className="font-body text-[9px] font-semibold uppercase tracking-[0.2em] text-gold-500 md:text-[10px]"
                      >
                        {banner.category}
                      </p>

                      <h2 className="font-display mt-1 text-base font-bold leading-tight sm:mt-1.5 sm:text-lg md:mt-2 md:text-2xl">
                        {banner.title}
                      </h2>

                      <p className="mt-1 text-[11px] text-white/70 sm:mt-1.5 sm:text-xs md:mt-2 md:text-sm">
                        {banner.subtitle}
                      </p>

                      <a
                        href="#products"
                        className="mt-2 inline-block border-b border-gold-500 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gold-500 transition hover:text-gold-400 sm:mt-3 sm:text-[11px] md:mt-4 md:text-xs"
                      >
                        {banner.cta} →
                      </a>
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