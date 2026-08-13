import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categoryApi, subcategoryAttributesApi } from '../utils/api'

/* Pill styles shared with ProductList so the strip matches the storefront. */
const PILL =
  'relative flex items-center justify-center shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-300 whitespace-nowrap shadow-sm hover:shadow-md active:scale-95'
const PILL_ACTIVE = 'bg-gradient-to-r from-plum-800 to-plum-950 text-white shadow-plum-900/20 shadow-md ring-2 ring-plum-900/20 ring-offset-1'
const PILL_IDLE = 'bg-white text-slate-700 hover:bg-gold-50 hover:text-gold-800 border border-slate-200'

/* Build a fresh URLSearchParams from the current one so we only mutate the
 * relevant level and clear everything deeper than the clicked level. */
function nextParams(prev, mutate) {
  const next = new URLSearchParams(prev)
  mutate(next)
  return next
}

/* Drop every attr_* param (used when category or subcategory changes). */
function clearAttrs(next) {
  for (const k of [...next.keys()]) {
    if (k.startsWith('attr_')) next.delete(k)
  }
}

export default function CategoryStrip() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [categories, setCategories] = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [attributes, setAttributes] = useState([])
  const [attributesLoading, setAttributesLoading] = useState(false)
  const [hoveredCategory, setHoveredCategory] = useState(null)

  // Single source of truth = the URL (shared with ProductList).
  const activeCategory = searchParams.get('category') || ''
  const activeSub = searchParams.get('subcategory') || ''

  const category = categories.find((c) => c.slug === activeCategory) || null
  const subcategory =
    category?.children?.find((s) => s.slug === activeSub) || null

  // Fetch the category tree (top-level + subcategory children) once.
  useEffect(() => {
    categoryApi
      .list()
      .then((data) => {
        const list = Array.isArray(data) ? data : data.results || []
        // De-duplicate by name (case-insensitive) like ProductList does.
        const seen = new Set()
        setCategories(
          list.filter((c) => {
            const key = (c.name || '').toLowerCase()
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
        )
      })
      .catch(() => {})
      .finally(() => setCategoriesLoading(false))
  }, [])

  // Fetch attributes for the active subcategory whenever it changes.
  useEffect(() => {
    if (!subcategory) {
      setAttributes([])
      return
    }
    setAttributesLoading(true)
    subcategoryAttributesApi
      .get(subcategory.slug)
      .then((data) => setAttributes(data.attributes || []))
      .catch(() => setAttributes([]))
      .finally(() => setAttributesLoading(false))
  }, [subcategory])

  /* Level 1 — set category, clear subcategory + all attributes. */
  const selectCategory = (slug) => {
    setSearchParams(
      (prev) =>
        nextParams(prev, (next) => {
          if (!slug) next.delete('category')
          else next.set('category', slug)
          next.delete('subcategory')
          clearAttrs(next)
        }),
      { replace: true }
    )
    scrollToProducts()
  }

  /* Level 2 — set subcategory, clear all attributes. */
  const selectSubcategory = (slug) => {
    setSearchParams(
      (prev) =>
        nextParams(prev, (next) => {
          if (!slug) next.delete('subcategory')
          else next.set('subcategory', slug)
          clearAttrs(next)
        }),
      { replace: true }
    )
    scrollToProducts()
  }

  /* Level 3 — toggle an attribute value (clicking the active value clears it). */
  const selectAttr = (attrName, value) => {
    const param = `attr_${attrName}`
    setSearchParams(
      (prev) =>
        nextParams(prev, (next) => {
          if (next.get(param) === value) next.delete(param)
          else next.set(param, value)
        }),
      { replace: true }
    )
    scrollToProducts()
  }

  const scrollToProducts = () => {
    setTimeout(() => {
      document
        .getElementById('products')
        ?.scrollIntoView({ behavior: 'smooth' })
    }, 0)
  }

  return (
    <section 
      className="sticky top-[73px] z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md shadow-sm"
      onMouseLeave={() => setHoveredCategory(null)}
    >
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2.5 space-y-2.5 relative">
        {/* Row 1 — categories */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 sm:w-36 shrink-0">
            Main Categories
          </span>
          <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide w-full">
          <button
            onClick={() => selectCategory('')}
            className={`${PILL} ${!activeCategory ? PILL_ACTIVE : PILL_IDLE}`}
          >
            All
          </button>
          {categoriesLoading
            ? [...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-9 w-24 shrink-0 animate-pulse rounded-full bg-slate-100"
                />
              ))
            : categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => selectCategory(c.slug)}
                  onMouseEnter={() => setHoveredCategory(c.slug)}
                  className={`${PILL} ${
                    activeCategory === c.slug ? PILL_ACTIVE : PILL_IDLE
                  }`}
                >
                  {c.name}
                </button>
              ))}
        </div>
        </div>

        {/* Mega Menu Dropdown */}
        {hoveredCategory && (
          <div 
            className="absolute top-full left-0 w-full bg-white shadow-xl shadow-slate-900/10 border-t border-slate-100 overflow-hidden transition-all duration-300 animate-fade-in z-50 rounded-b-xl"
          >
            {(() => {
              const activeCat = categories.find((c) => c.slug === hoveredCategory)
              if (!activeCat || !activeCat.children || activeCat.children.length === 0) return null
              
              return (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                  {activeCat.children.map((subcat) => (
                    <div key={subcat.id} className="flex flex-col">
                      <button 
                        onClick={() => {
                          selectSubcategory(subcat.slug)
                          setHoveredCategory(null)
                        }}
                        className="font-bold text-left text-plum-950 text-xs uppercase tracking-wide mb-2 hover:text-gold-600 transition-colors"
                      >
                        {subcat.name}
                      </button>
                      {subcat.children?.length > 0 && (
                        <div className="flex flex-col gap-1.5 items-start">
                          {subcat.children.map(child => (
                            <button 
                              key={child.id}
                              onClick={() => {
                                selectSubcategory(child.slug)
                                setHoveredCategory(null)
                              }}
                              className="text-sm text-left text-slate-500 hover:text-plum-950 transition-colors"
                            >
                              {child.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}

        {/* Row 2 — subcategories */}
        {category && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center animate-fade-in-up">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 sm:w-36 shrink-0">
              Subcategories
            </span>
            <div className="flex gap-3 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide w-full">
            {category.children?.map((s) => (
              <button
                key={s.id}
                onClick={() => selectSubcategory(s.slug)}
                className={`${PILL} ${
                  activeSub === s.slug ? PILL_ACTIVE : PILL_IDLE
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
          </div>
        )}

        {/* Row 3 — attribute values */}
        {subcategory && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start pt-2 border-t border-slate-100 animate-fade-in-up">
             <span className="text-xs font-bold uppercase tracking-widest text-slate-400 sm:w-36 shrink-0 mt-1.5">
              Refine By
            </span>
            <div className="flex-1 space-y-2">
            {attributesLoading ? (
              <div className="h-7 w-40 animate-pulse rounded-full bg-slate-100" />
            ) : (
              attributes.map((attr) => (
                <div
                  key={attr.id}
                  className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide"
                >
                  <span className="shrink-0 text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                    {attr.name}:
                  </span>
                  {attr.values?.map((val) => {
                    const param = `attr_${attr.name}`
                    const isActive = searchParams.get(param) === val.value
                    return (
                      <button
                        key={val.id}
                        onClick={() => selectAttr(attr.name, val.value)}
                        className={`${PILL} ${
                          isActive ? PILL_ACTIVE : PILL_IDLE
                        }`}
                      >
                        {val.value}
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
          </div>
        )}
      </div>
    </section>
  )
}