import { useEffect, useState, useMemo } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { formatPrice, getProductImageUrl } from '../utils/product'
import { ratingApi } from '../utils/api'
import StarRating from '../components/StarRating'
import { useSelector } from "react-redux";

export default function ProductDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart, cartItems } = useCart()
  const { toggleWishlist, isInWishlist } = useWishlist()
  
  const user = useSelector((state) => state.auth.user);
  const tokens = useSelector((state) => state.auth.tokens);
  const authLoading = useSelector((state) => state.auth.loading);
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [adding, setAdding] = useState(false)

  // Rating state
  const [userRating, setUserRating] = useState(0)
  const [ratingSubmitted, setRatingSubmitted] = useState(false)
  const [ratingError, setRatingError] = useState('')
  const [productRatings, setProductRatings] = useState([])
  const [myRatingScore, setMyRatingScore] = useState(null)

  // Variant selection state
  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [selectedVariantId, setSelectedVariantId] = useState(null)

  // Image carousel state
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const BASE_URL = import.meta.env.VITE_DJANGO_URL
  const inCart = cartItems.some((item) => item.id === Number(id))

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`${BASE_URL}/api/products/${id}/`)
        if (!response.ok) throw new Error('Failed to fetch product.')
        const data = await response.json()
        setProduct(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id, BASE_URL])

  // Group available attributes and their values across all active variants
  const attributeOptions = useMemo(() => {
    if (!product?.variants?.length) return {}
    const options = {}
    product.variants.forEach((variant) => {
      if (!variant.is_active) return
      variant.attributes?.forEach((attr) => {
        if (!options[attr.attribute_name]) {
          options[attr.attribute_name] = []
        }
        if (!options[attr.attribute_name].some((v) => v.name === attr.value_name)) {
          options[attr.attribute_name].push({ id: attr.value, name: attr.value_name })
        }
      })
    })
    return options
  }, [product])

  // Auto-select initial variant and attributes on product load
  useEffect(() => {
    if (product?.variants?.length) {
      const firstActive = product.variants.find((v) => v.is_active) || product.variants[0]
      if (firstActive) {
        setSelectedVariantId(firstActive.id)
        if (firstActive.attributes?.length) {
          const initial = {}
          firstActive.attributes.forEach((attr) => {
            if (attr.attribute_name && attr.value_name) {
              initial[attr.attribute_name] = attr.value_name
            }
          })
          setSelectedAttributes(initial)
        }
      }
    }
  }, [product])

  // Find the matching variant based on currently selected attributes or selectedVariantId
  const activeVariant = useMemo(() => {
    if (!product?.variants?.length) return null

    // 1. Check if an active variant matches selected attributes
    if (Object.keys(selectedAttributes).length > 0) {
      const match = product.variants.find((variant) => {
        if (!variant.is_active) return false
        return (
          variant.attributes?.length > 0 &&
          variant.attributes.every(
            (attr) => selectedAttributes[attr.attribute_name] === attr.value_name
          )
        )
      })
      if (match) return match
    }

    // 2. Fallback to explicitly selectedVariantId
    if (selectedVariantId) {
      const match = product.variants.find((v) => v.id === selectedVariantId && v.is_active)
      if (match) return match
    }

    // 3. Fallback to first active variant
    return product.variants.find((v) => v.is_active) || product.variants[0] || null
  }, [product, selectedAttributes, selectedVariantId])

  // Dynamic price & stock based on active variant
  const originalPrice = activeVariant?.price || product?.price
  const currentPrice = activeVariant?.discounted_price || activeVariant?.price || product?.price
  const hasDiscount = Boolean(activeVariant?.discounted_price && Number(activeVariant.discounted_price) < Number(activeVariant.price))
  const isOutOfStock = activeVariant ? activeVariant.stock <= 0 : false

  // Fetch product ratings
  useEffect(() => {
    ratingApi.forProduct(id).then(setProductRatings).catch(() => { })
  }, [id])

  // Fetch user's own rating for this product
  useEffect(() => {
    if (!user) return
    ratingApi.mine().then((ratings) => {
      const found = ratings.find((r) => r.product === Number(id))
      if (found) {
        setMyRatingScore(found.score)
        setUserRating(found.score)
      }
    }).catch(() => { })
  }, [user, id])

  // Build the image gallery: variant image first (if present), then product cover and extra images.
  const gallery = useMemo(() => {
    if (!product) return []
    const images = []
    if (activeVariant?.image) {
      images.push(activeVariant.image)
    }
    if (product.image) {
      images.push(product.image)
    }
    if (product.images?.length) {
      images.push(...product.images)
    }
    return images.filter(Boolean).map(getProductImageUrl).filter(Boolean)
  }, [product, activeVariant?.image])

  // Reset to first image when variant changes or product changes
  useEffect(() => {
    setCurrent(0)
  }, [id, activeVariant?.id])

  // Auto-advance the carousel every 3s when there's more than one image
  // and the customer isn't hovering over it.
  useEffect(() => {
    if (gallery.length <= 1 || paused) return
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % gallery.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [gallery.length, paused])

  const handleAddToCart = () => {
    if (!product || adding || isOutOfStock) return
    if (!user) {
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    setAdding(true)
    addToCart({
      ...product,
      price: currentPrice,
      variant: activeVariant,
    })
    navigate('/cart')
  }

  const handleRateProduct = async (score) => {
    if (!user) {
      navigate('/login')
      return
    }
    setUserRating(score)
    setRatingError('')
    setRatingSubmitted(false)
    try {
      const result = await ratingApi.create({ product: Number(id), score })
      setMyRatingScore(score)
      setRatingSubmitted(true)
      // Refresh product ratings
      const updated = await ratingApi.forProduct(id)
      setProductRatings(updated)
      // Refresh product to get updated average
      const response = await fetch(`${BASE_URL}/api/products/${id}/`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
      }
    } catch (err) {
      setRatingError(err.data?.product?.[0] || err.data?.score?.[0] || err.data?.detail || 'Failed to submit rating. You may need to purchase this product first.')
      setUserRating(myRatingScore || 0)
    }
  }

  if (loading) {
    return (
      <div className="page-container py-16">
        <div className="card mx-auto max-w-4xl animate-pulse p-8">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="h-96 rounded-xl bg-slate-100" />
            <div className="space-y-4">
              <div className="h-8 w-2/3 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-4/5 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="page-container py-16">
        <div className="card mx-auto max-w-md p-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900">{error || 'Product not found'}</h2>
          <Link to="/" className="btn-primary mt-4">Back to Shop</Link>
        </div>
      </div>
    )
  }

  const avgRating = product.average_rating
  const ratingCount = product.rating_count || productRatings.length

  return (
    <div className="page-container font-body py-8 sm:py-12">
      <nav className="mb-6 text-sm text-slate-500">
        <Link to="/" className="transition hover:text-gold-500">Home</Link>
        <span className="mx-2 text-slate-300">/</span>
        <span className="text-slate-900">{product.name}</span>
      </nav>

      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div
            className="bg-white p-4 sm:p-6"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {gallery.length > 0 ? (
              <>
                {/* Sliding carousel */}
                <div className="relative overflow-hidden rounded-xl">
                  <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${current * 100}%)` }}
                  >
                    {gallery.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        decoding="async"
                        alt={product.name}
                        className="h-72 w-full shrink-0 object-contain sm:h-[38rem]"
                        draggable={false}
                      />
                    ))}
                  </div>

                  {gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setCurrent((c) => (c - 1 + gallery.length) % gallery.length)}
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-plum-950 shadow-sm transition hover:bg-white"
                      >
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrent((c) => (c + 1) % gallery.length)}
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-plum-950 shadow-sm transition hover:bg-white"
                      >
                        <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </>
                  )}
                </div>

                {gallery.length > 1 && (
                  <>
                    <div className="mt-3 flex justify-center gap-1.5">
                      {gallery.map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrent(i)}
                          aria-label={`Go to image ${i + 1}`}
                          className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-plum-950' : 'w-2 bg-slate-300 hover:bg-slate-400'}`}
                        />
                      ))}
                    </div>
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {gallery.map((src, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrent(i)}
                          className={`overflow-hidden rounded-lg ring-2 transition ${i === current ? 'ring-gold-600' : 'ring-transparent hover:ring-slate-300'}`}
                        >
                          <img src={src} alt="" loading="lazy" decoding="async" className="h-14 w-14 object-cover" />
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-center text-xs text-slate-400">
                      {current + 1} / {gallery.length}
                    </p>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-72 items-center justify-center rounded-xl bg-slate-100 text-slate-400 sm:h-[28rem]">
                <div className="text-center">
                  <svg className="mx-auto size-16 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5a1.5 1.5 0 0 0 1.5-1.5V5.25a1.5 1.5 0 0 0-1.5-1.5H3.75a1.5 1.5 0 0 0-1.5 1.5v14.25a1.5 1.5 0 0 0 1.5 1.5Z" />
                  </svg>
                  <p className="mt-2 text-sm">No image available</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-10">
            {product.category?.name && (
              <span className="mb-3 w-fit rounded-full bg-gold-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gold-700">
                {product.category.name}
              </span>
            )}
            <h1 className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">
              {product.name}
            </h1>

            {/* Star rating display */}
            <div className="mt-3 flex items-center gap-2">
              <StarRating
                value={avgRating || 0}
                size="sm"
                showCount={ratingCount > 0}
                count={ratingCount}
              />
              {avgRating && (
                <span className="text-sm font-medium text-slate-700">
                  {avgRating}
                </span>
              )}
            </div>

            {/* Seller */}
            <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
              <svg className="size-4 shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21V7.5m0 0 6.75-3.75v13.5M13.5 7.5l-6.75-3.75v13.5M6.75 17.25l6.75 3.75 6.75-3.75" />
              </svg>
              Sold by
              <span className="font-medium text-slate-700">
                {product.seller_name || 'Luxora Marketplace'}
              </span>
            </p>

            {/* Location */}
            {product.location && (
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                <svg className="size-4 shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                </svg>
                <span className="font-medium text-slate-700">{product.location}</span>
              </p>
            )}

            <p className="mt-4 leading-relaxed text-slate-600">{product.description}</p>

            {/* Price & SKU */}
            <div className="mt-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Price</span>
                  <div className="flex items-baseline flex-wrap gap-2.5">
                    <p className="font-display text-4xl font-bold tracking-tight text-plum-950">
                      {formatPrice(currentPrice)}
                    </p>
                    {hasDiscount && (
                      <span className="text-xl text-slate-400 line-through">
                        {formatPrice(originalPrice)}
                      </span>
                    )}
                    {hasDiscount && (
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        {activeVariant?.discount?.percentage_off
                          ? `${Math.round(activeVariant.discount.percentage_off)}% OFF`
                          : 'SALE'}
                      </span>
                    )}
                  </div>
                </div>
                {activeVariant?.sku && (
                  <span className="text-xs font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                    SKU: {activeVariant.sku}
                  </span>
                )}
              </div>

              {/* Stock indicator */}
              {activeVariant && (
                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  {activeVariant.stock > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full font-medium">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      In Stock ({activeVariant.stock} available)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full font-medium">
                      <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                      Out of Stock
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Variant Selection */}
            {product.variants?.length > 0 && (
              <div className="mt-6 space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                {/* Mode 1: Attribute-based selectors (e.g. Storage, Color, RAM, Size) */}
                {Object.keys(attributeOptions).length > 0 ? (
                  Object.entries(attributeOptions).map(([attrName, values]) => (
                    <div key={attrName}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                          {attrName}: <span className="font-semibold text-gold-600 normal-case">{selectedAttributes[attrName] || 'Select'}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {values.map((val) => {
                          const isSelected = selectedAttributes[attrName] === val.name
                          return (
                            <button
                              key={val.id || val.name}
                              type="button"
                              onClick={() => {
                                setSelectedAttributes((prev) => {
                                  const updated = { ...prev, [attrName]: val.name }
                                  // Also sync selectedVariantId if matching variant found
                                  const match = product.variants.find((v) =>
                                    v.attributes?.every(
                                      (a) => (a.attribute_name === attrName ? val.name : updated[a.attribute_name]) === a.value_name
                                    )
                                  )
                                  if (match) setSelectedVariantId(match.id)
                                  return updated
                                })
                              }}
                              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all duration-150 ${
                                isSelected
                                  ? 'bg-plum-950 text-white border-plum-950 shadow-md ring-2 ring-gold-500/50'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-gold-500 hover:bg-gold-50/20'
                              }`}
                            >
                              {val.name}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  /* Mode 2: Direct Variant options (e.g. S24 128GB, S24 256GB, SKU / options) */
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span  className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        Select Variant / Edition:
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.filter((v) => v.is_active).map((v, idx) => {
                        const isSelected = activeVariant?.id === v.id
                        return (
                          <button
                            key={v.id || idx}
                            type="button"
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all duration-150 flex items-center gap-2 ${
                              isSelected
                                ? 'bg-plum-950 text-white border-plum-950 shadow-md ring-2 ring-gold-500/50'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-gold-500 hover:bg-gold-50/20'
                            }`}
                          >
                            <span>{v.sku || `Option ${idx + 1}`}</span>
                            <span className={isSelected ? 'text-gold-300 font-bold' : 'text-slate-500 font-medium'}>
                              {formatPrice(v.discounted_price || v.price)}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={adding || isOutOfStock}
                className="btn-primary min-w-[180px] flex items-center justify-center gap-2 shadow-lg shadow-plum-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? (
                  <>
                    <svg className="size-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Adding...
                  </>
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : inCart ? (
                  <>
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.936-4.708 2.436-7.18.075-.37-.221-.7-.598-.7H5.106M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                    </svg>
                    Add Another & Go to Cart
                  </>
                ) : (
                  <>
                    <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.936-4.708 2.436-7.18.075-.37-.221-.7-.598-.7H5.106M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                    </svg>
                    Add to Cart
                  </>
                )}
              </button>
              {inCart && (
                <Link to="/cart" className="btn-secondary flex items-center justify-center gap-2">
                  <svg className="size-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.936-4.708 2.436-7.18.075-.37-.221-.7-.598-.7H5.106M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                  </svg>
                  View Cart
                </Link>
              )}
              
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                className={`btn-secondary flex items-center justify-center gap-2 ${
                  isInWishlist(product.id)
                    ? 'border-rose-500 text-rose-500 hover:bg-rose-50'
                    : 'text-slate-500 hover:text-rose-500 hover:border-rose-300'
                }`}
              >
                <svg
                  className="size-5"
                  fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
                  />
                </svg>
                {isInWishlist(product.id) ? 'Saved' : 'Wishlist'}
              </button>
            </div>

            {/* Rate this product section */}
            <div className="mt-8 border-t border-slate-100 pt-6">
              <h3 className="text-sm font-semibold text-slate-900">Rate this product</h3>
              {user ? (
                <div className="mt-2">
                  {myRatingScore && !ratingSubmitted ? (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">Your rating:</span>
                      <StarRating
                        value={userRating || myRatingScore}
                        onChange={handleRateProduct}
                        size="md"
                      />
                      {myRatingScore && (
                        <span className="rounded-full bg-gold-500/20 px-2 py-0.5 text-xs font-semibold text-gold-700">
                          {myRatingScore}/5
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        {myRatingScore ? 'Update your rating:' : 'Select your rating:'}
                      </span>
                      <StarRating
                        value={userRating || 0}
                        onChange={handleRateProduct}
                        size="md"
                      />
                    </div>
                  )}
                  {ratingSubmitted && (
                    <p className="mt-2 text-sm font-medium text-emerald-600">
                      ✓ Rating submitted — thank you!
                    </p>
                  )}
                  {ratingError && (
                    <p className="mt-2 text-sm text-red-500">{ratingError}</p>
                  )}
                  {!myRatingScore && !ratingSubmitted && (
                    <p className="mt-1 text-xs text-slate-400">
                      You can only rate products you've purchased.
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  <Link to="/login" className="font-medium text-gold-700 hover:underline">Sign in</Link> to rate this product.
                </p>
              )}
            </div>

            {/* Trust signals */}
            <ul className="mt-6 space-y-3 border-t border-slate-100 pt-6">
              <li className="flex items-center gap-3 text-sm text-slate-500">
                <svg className="size-5 shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 1-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 1-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a8.25 8.25 0 0 0-2.034-4.926l-.726-.726a1.125 1.125 0 0 1-.298-.774V6.375c0-.621-.504-1.125-1.125-1.125H14.25M3.75 14.25h7.875c.621 0 1.125.504 1.125 1.125v3.75M3.75 14.25V6.375c0-.621.504-1.125 1.125-1.125h6.75" />
                </svg>
                Free delivery on orders over ₹50
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500">
                <svg className="size-5 shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                </svg>
                Secure checkout
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-500">
                <svg className="size-5 shrink-0 text-gold-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3" />
                </svg>
                30-day easy returns
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      {productRatings.length > 0 && (
        <div className="mt-10 card p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold text-slate-900">
            Customer Reviews
          </h2>
          <div className="mt-2 h-1 w-12 rounded-full bg-gold-500" />

          <div className="mt-6 space-y-4">
            {productRatings.map((r) => (
              <div key={r.id} className="border-b border-slate-100 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-plum-950 text-xs font-bold text-white">
                    {r.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{r.username}</p>
                    <div className="flex items-center gap-2">
                      <StarRating value={r.score} size="sm" />
                      <span className="text-xs text-slate-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}