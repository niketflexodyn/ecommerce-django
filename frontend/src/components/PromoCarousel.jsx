import { useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, FreeMode } from 'swiper/modules'
import { useScrollReveal } from '../hooks/useScrollReveal'

import 'swiper/css'

const DEALS = [
  {
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
    title: 'Summer Collection',
    subtitle: 'Up to 50% Off',
    cta: 'Shop Fashion',
    gradient: 'from-plum-950/90 via-plum-950/60 to-transparent',
  },
  {
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800',
    title: 'Tech Essentials',
    subtitle: 'Latest Gadgets',
    cta: 'Shop Electronics',
    gradient: 'from-plum-900/90 via-plum-900/60 to-transparent',
  },
  {
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800',
    title: 'Home & Living',
    subtitle: 'Starting at $29',
    cta: 'Shop Home',
    gradient: 'from-plum-800/90 via-plum-800/60 to-transparent',
  },
  {
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800',
    title: 'Beauty Picks',
    subtitle: 'New Arrivals',
    cta: 'Shop Beauty',
    gradient: 'from-plum-950/90 via-plum-950/60 to-transparent',
  },
]

const CATEGORIES = [
  {
    name: 'Fashion',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600',
  },
  {
    name: 'Electronics',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=600',
  },
  {
    name: 'Home',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600',
  },
  {
    name: 'Beauty',
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600',
  },
]

export default function PromoCarousel() {
  const [ref, revealed] = useScrollReveal(0.1)
  const navigate = useNavigate()

  const scrollToProducts = (e) => {
    e.preventDefault()
    const el = document.getElementById('products')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToProductsWithCategory = (category) => (e) => {
    e.preventDefault()
    navigate(`/?category=${category}`)
    // Small delay for navigation + data fetch, then scroll
    setTimeout(() => {
      const el = document.getElementById('products')
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }, 500)
  }

  return (
    <section
      ref={ref}
      className="relative overflow-hidden bg-linear-to-br from-plum-950 via-plum-900 to-plum-800 py-10 sm:py-16 lg:py-20"
    >
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 size-80 rounded-full bg-gold-500/[0.06] blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 size-64 rounded-full bg-gold-500/[0.04] blur-3xl" />
      </div>

      <div className="page-container font-body relative">
        {/* ── Heading ────────────────────────────── */}
        <div className={`mb-8 text-center sm:mb-10 ${revealed ? 'animate-fade-up' : 'opacity-0'}`}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-gold-600/40 bg-gold-600/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-gold-500 sm:gap-2 sm:px-4 sm:py-1.5 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
            Limited Time Offers
          </span>
          <h2 className="font-display mt-3 text-2xl font-bold text-white sm:mt-4 sm:text-3xl lg:text-4xl">
            Deals You'll Love
          </h2>
          <p className="mx-auto mt-2 max-w-md text-xs text-white/60 sm:mt-3 sm:text-sm md:text-base">
            Handpicked promotions across every category — don't miss out.
          </p>
        </div>

        {/* ── Deal Cards Carousel ────────────────── */}
        <div className={`mb-10 sm:mb-16 ${revealed ? 'animate-fade-up delay-150' : 'opacity-0'}`}>
          <Swiper
            modules={[Autoplay, FreeMode]}
            spaceBetween={12}
            slidesPerView={1.15}
            centeredSlides={false}
            freeMode={true}
            loop={true}
            speed={5000}
            autoplay={{
              delay: 0,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            breakpoints={{
              480: { slidesPerView: 1.4, spaceBetween: 16 },
              640: { slidesPerView: 2.1, spaceBetween: 20 },
              1024: { slidesPerView: 3.1, spaceBetween: 20 },
              1280: { slidesPerView: 4, spaceBetween: 24 },
            }}
            className="promo-swiper"
          >
            {DEALS.map((deal, i) => (
              <SwiperSlide key={i}>
                <a
                  href="#products"
                  onClick={scrollToProducts}
                  className="group relative block h-[260px] overflow-hidden rounded-2xl sm:h-[320px] lg:h-[360px]"
                >
                  <img
                    src={deal.image}
                    alt={deal.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className={`absolute inset-0 bg-linear-to-r ${deal.gradient}`} />
                  <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-gold-500 sm:text-xs">
                      {deal.subtitle}
                    </p>
                    <h3 className="font-display mt-1 text-lg font-bold text-white sm:text-2xl lg:text-3xl">
                      {deal.title}
                    </h3>
                    <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-gold-500 transition-colors group-hover:text-gold-400 sm:mt-3 sm:text-sm">
                      {deal.cta}
                      <svg className="size-3.5 transition-transform group-hover:translate-x-1 sm:size-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </span>
                  </div>
                </a>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>

        {/* ── Shop by Category ──────────────────── */}
        <div className={`text-center ${revealed ? 'animate-fade-up delay-300' : 'opacity-0'}`}>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-500 sm:text-xs">
            Shop by Category
          </h3>
          <Swiper
            modules={[Autoplay, FreeMode]}
            spaceBetween={10}
            slidesPerView={2.2}
            freeMode={true}
            loop={true}
            speed={5000}
            autoplay={{
              delay: 0,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
              reverseDirection: true,
            }}
            breakpoints={{
              480: { slidesPerView: 2.6, spaceBetween: 14 },
              640: { slidesPerView: 3.2, spaceBetween: 18 },
              1024: { slidesPerView: 4.2, spaceBetween: 24 },
            }}
            className="mt-4 category-swiper sm:mt-6"
          >
            {CATEGORIES.map((cat) => (
              <SwiperSlide key={cat.name}>
                <a
                  href={`/?category=${cat.name.toLowerCase()}`}
                  onClick={scrollToProductsWithCategory(cat.name.toLowerCase())}
                  className="group relative block h-36 overflow-hidden rounded-2xl sm:h-48 lg:h-56"
                >
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-plum-950/80 via-plum-950/20 to-transparent" />
                  <div className="absolute inset-0 flex items-end justify-start p-3.5 sm:p-5">
                    <span className="font-display text-sm font-bold text-white sm:text-lg lg:text-xl truncate">
                      {cat.name}
                    </span>
                  </div>
                  {/* Gold accent line at bottom */}
                  <div className="absolute bottom-0 left-0 h-1 w-0 bg-gold-500 transition-all duration-300 group-hover:w-full" />
                </a>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Swiper overrides for promo carousel */}
      <style>{`
        .promo-swiper .swiper-wrapper,
        .category-swiper .swiper-wrapper {
          align-items: stretch;
        }
      `}</style>
    </section>
  )
}