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
      className="relative overflow-hidden bg-linear-to-br from-plum-950 via-plum-900 to-plum-800 py-14 sm:py-20"
    >
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 top-1/4 size-80 rounded-full bg-gold-500/[0.06] blur-3xl" />
        <div className="absolute -right-20 bottom-1/4 size-64 rounded-full bg-gold-500/[0.04] blur-3xl" />
      </div>

      <div className="page-container font-body relative">
        {/* ── Heading ────────────────────────────── */}
        <div className={`mb-10 text-center ${revealed ? 'animate-fade-up' : 'opacity-0'}`}>
          <span className="inline-flex items-center gap-2 rounded-full border border-gold-600/40 bg-gold-600/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-gold-500">
            <span className="h-1.5 w-1.5 rounded-full bg-gold-500" />
            Limited Time Offers
          </span>
          <h2 className="font-display mt-4 text-3xl font-bold text-white sm:text-4xl">
            Deals You'll Love
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/60">
            Handpicked promotions across every category — don't miss out.
          </p>
        </div>

        {/* ── Deal Cards Carousel ────────────────── */}
        <div className={`mb-16 ${revealed ? 'animate-fade-up delay-150' : 'opacity-0'}`}>
  <Swiper
    modules={[Autoplay, FreeMode]}
    spaceBetween={20}
    slidesPerView={1.1}
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
      480: { slidesPerView: 1.3 },
      640: { slidesPerView: 2.1 },
      1024: { slidesPerView: 3.1 },
      1280: { slidesPerView: 4 },
    }}
    className="promo-swiper"
  >
    {DEALS.map((deal, i) => (
      <SwiperSlide key={i}>
        
         <a href="#products"
          onClick={scrollToProducts}
          className="group relative block h-[320px] overflow-hidden rounded-2xl sm:h-[360px]"
        >
          <img
            src={deal.image}
            alt={deal.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className={`absolute inset-0 bg-linear-to-r ${deal.gradient}`} />
          <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-gold-500">
              {deal.subtitle}
            </p>
            <h3
              className="font-display mt-1 text-2xl font-bold text-white sm:text-3xl"
            >
              {deal.title}
            </h3>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold-500 transition-colors group-hover:text-gold-400">
              {deal.cta}
              <svg className="size-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
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
      {/* ── Shop by Category ──────────────────── */}
<div className={`text-center ${revealed ? 'animate-fade-up delay-300' : 'opacity-0'}`}>
  <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-500">
    Shop by Category
  </h3>
  <Swiper
    modules={[Autoplay, FreeMode]}
    spaceBetween={16}
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
      640: { slidesPerView: 3.2, spaceBetween: 20 },
      1024: { slidesPerView: 4.2, spaceBetween: 24 },
    }}
    className="mt-6 category-swiper"
  >
    {CATEGORIES.map((cat, i) => (
      <SwiperSlide key={cat.name}>
        
        <a  href={`/?category=${cat.name.toLowerCase()}`}
          onClick={scrollToProductsWithCategory(cat.name.toLowerCase())}
          className="group relative block h-48 overflow-hidden rounded-2xl sm:h-56"
        >
          <img
            src={cat.image}
            alt={cat.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-linear-to-t from-plum-950/80 via-plum-950/20 to-transparent" />
          <div className="absolute inset-0 flex items-end justify-start p-5">
            <span
              className="font-display text-lg font-bold text-white sm:text-xl"
            >
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
        .promo-swiper .swiper-wrapper {
          align-items: stretch;
        }
      `}</style>
    </section>
  )
}