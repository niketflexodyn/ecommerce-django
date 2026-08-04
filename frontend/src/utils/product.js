const DJANGO_URL = import.meta.env.VITE_DJANGO_URL || 'http://127.0.0.1:8000'

export function getProductImageUrl(image) {
  if (!image) return null
  return image.startsWith('http') ? image : `${DJANGO_URL}${image.startsWith('/') ? '' : '/'}${image}`
}

export function formatPrice(price) {
  const amount = Number(price)
  if (Number.isNaN(amount)) return price
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}
