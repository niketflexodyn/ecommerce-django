import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";

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
  return (
    <section
      className="relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #2A1A2C 0%, #3D2136 55%, #4A2536 100%)",
      }}
    >
      {/* Ideally move this <link> into your index.html <head> instead of rendering it here */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,600;0,700;0,800;1,600&family=Jost:wght@400;500;600&display=swap"
      />

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
          <div className="text-white" style={fontBody}>
            <span className="inline-flex items-center gap-2 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-[#E8C766]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8C766]" />
              Everything You Need, In One Place
            </span>

            <h1
              className="mt-6 text-5xl font-bold leading-[1.05] lg:text-6xl"
              style={fontDisplay}
            >
              Shop Every Category,
              <span className="block italic text-[#E8C766]">
                All in One Store
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-white/70">
              From fashion and electronics to home essentials and beauty —
              discover thousands of products across every category, all in
              one place.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                to="/products"
                className="rounded-full bg-[#E8C766] px-8 py-4 font-semibold text-[#2A1A2C] transition duration-300 hover:scale-[1.03] hover:bg-[#F1D9A0]"
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
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/60">
              <span>🚚 Free shipping over $50</span>
              <span>↩ 30-day returns</span>
              <span>★ 4.8/5 from 10,000+ reviews</span>
            </div>

            {/* Stats */}
            <div className="mt-14 flex flex-wrap gap-10 border-t border-white/10 pt-8">
              <div>
                <h2 className="text-3xl font-bold" style={fontDisplay}>
                  100K+
                </h2>
                <p className="text-white/60">Happy Customers</p>
              </div>

              <div className="border-l border-white/10 pl-10">
                <h2 className="text-3xl font-bold" style={fontDisplay}>
                  10,000+
                </h2>
                <p className="text-white/60">Products</p>
              </div>

              <div className="border-l border-white/10 pl-10">
                <h2 className="text-3xl font-bold" style={fontDisplay}>
                  20+
                </h2>
                <p className="text-white/60">Categories</p>
              </div>
            </div>
          </div>

          {/* Right Slider */}
          <div>
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
                        to="/products"
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