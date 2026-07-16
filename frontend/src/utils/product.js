const BASE_URL = import.meta.env.VITE_DJANGO_URL

export function getProductImageUrl(image) {
  if (!image) return null
  return image.startsWith('http') ? image : `${BASE_URL}${image}`
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
