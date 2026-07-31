import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { wishlistApi } from '../utils/api'

const WishlistContext = createContext()

export const WishlistProvider = ({ children }) => {
  const { user, tokens } = useAuth()
  const [wishlistItems, setWishlistItems] = useState([])

  const fetchWishlist = useCallback(async () => {
    if (user && tokens?.access) {
      try {
        const data = await wishlistApi.list()
        // API returns an array of wishlist objects: [{ id, product: {...}, product_id, created_at }]
        // We'll store the full product object alongside the wishlist item ID
        const items = data.map((item) => ({
          wishlistItemId: item.id,
          product: item.product,
          productId: item.product.id,
        }))
        setWishlistItems(items)
      } catch (err) {
        console.error('Failed to fetch wishlist', err)
      }
    } else {
      setWishlistItems([])
    }
  }, [user, tokens?.access])

  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  const addToWishlist = async (productId) => {
    if (!user) {
      console.warn('Must be logged in to add to wishlist')
      return false
    }
    try {
      await wishlistApi.add(productId)
      await fetchWishlist() // Refresh list to get the new wishlist item ID and populated product
      return true
    } catch (err) {
      console.error('Failed to add to wishlist', err)
      return false
    }
  }

  const removeFromWishlist = async (productId) => {
    if (!user) return false
    try {
      // Optimistic update
      setWishlistItems(prev => prev.filter(item => item.productId !== productId))
      await wishlistApi.remove(productId)
      return true
    } catch (err) {
      console.error('Failed to remove from wishlist', err)
      await fetchWishlist() // Revert on failure
      return false
    }
  }

  const toggleWishlist = async (productId) => {
    if (isInWishlist(productId)) {
      return await removeFromWishlist(productId)
    } else {
      return await addToWishlist(productId)
    }
  }

  const isInWishlist = (productId) => {
    return wishlistItems.some(item => item.productId === productId)
  }

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => useContext(WishlistContext)
