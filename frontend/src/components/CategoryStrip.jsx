import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { categoryApi, subcategoryAttributesApi } from '../utils/api'

/* Pill styles shared with ProductList so the strip matches the storefront. */
const PILL =
  'shrink-0 rounded-full px-5 py-2 text-sm font-semibold transition whitespace-nowrap'
const PILL_ACTIVE = 'bg-plum-950 text-white'
const PILL_IDLE = 'bg-gold-500/10 text-gold-700 hover:bg-gold-500/20'

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
    <section className="border-b border-slate-100 bg-white">
      <div className="page-container py-3">
        {/* Row 1 — categories */}
        <div className="flex gap-2 overflow-x-auto pb-1">
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
                  className={`${PILL} ${
                    activeCategory === c.slug ? PILL_ACTIVE : PILL_IDLE
                  }`}
                >
                  {c.name}
                </button>
              ))}
        </div>

        {/* Row 2 — subcategories (only when a known category is active) */}
        {category && (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
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
        )}

        {/* Row 3 — attribute values (only when a known subcategory is active) */}
        {subcategory && (
          <div className="mt-3 space-y-2">
            {attributesLoading ? (
              <div className="h-7 w-40 animate-pulse rounded-full bg-slate-100" />
            ) : (
              attributes.map((attr) => (
                <div
                  key={attr.id}
                  className="flex items-center gap-2 overflow-x-auto pb-1"
                >
                  <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
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
        )}
      </div>
    </section>
  )
}