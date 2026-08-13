import imgFashion from '../assets/travel.png';
import imgElectronics from '../assets/laptop.png';
import imgHome from '../assets/shoes.png';
import imgBeauty from '../assets/bag.png';
import imgUnique from '../assets/furniture.png';

const CATEGORIES = [
  { name: 'Fashion', slug: 'fashion', image: imgFashion },
  { name: 'Electronics', slug: 'electronics', image: imgElectronics },
  { name: 'Home & Living', slug: 'home', image: imgHome },
  { name: 'Beauty', slug: 'beauty', image: imgBeauty },
  { name: 'Accessories', slug: 'accessories', image: imgUnique },
]

export default function CategoryUX({ onSelectCategory }) {
  return (
    <section className="page-container py-12 sm:py-12">
     
      {/* Mobile: horizontal scroll-snap row. sm+: wraps into a grid. */}
      <div
        className="
          mt-8 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2
          -mx-4 px-4
          sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:pb-0
          lg:grid-cols-5
        "
      >
        {CATEGORIES.map((category) => (
          <button
            key={category.slug}
            onClick={() => onSelectCategory?.(category.slug)}
            className="
              group relative aspect-[3/4] w-40 shrink-0 snap-start
              overflow-hidden rounded-2xl bg-slate-100
              sm:w-full
            "
          >
            <img
              src={category.image}
              alt={category.name}
              loading="lazy"
              className="
                absolute inset-0 h-full w-full object-cover
                transition duration-300 ease-out
                group-hover:scale-105
              "
            />

            {/* Subtle top-down gradient so white text stays legible on any photo */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/0 to-black/0" />

            <span className="absolute left-4 top-4 text-lg font-bold text-white drop-shadow-sm sm:text-xl">
              {category.name}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}