import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const CartContext = createContext()

const BASE_URL = import.meta.env.VITE_DJANGO_URL

export const CartProvider = ({ children }) => {
  const { user, tokens } = useAuth()
  const [cartItems, setCartItems] = useState([])
  const [serverCartId, setServerCartId] = useState(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    if (user && tokens?.access) {
      fetch(`${BASE_URL}/api/cart/`, {
        headers: {
          Authorization: `Bearer ${tokens.access}`,
        },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Failed to fetch cart')
          return res.json()
        })
        .then((data) => {
          if (data.id) {
            setServerCartId(data.id)
            const items = (data.items || []).map((item) => ({
              id: item.product,
              name: item.product_name,
              price: item.product_price,
              image: item.product_image,
              quantity: item.quantity,
              cartItemId: item.id,
            }))
            setCartItems(items)
          }
        })
        .catch(() => {
          // Failed to fetch server cart — keep local cart
        })
    } else {
      setCartItems([])
      setServerCartId(null)
    }
  }, [user, tokens?.access])

  const getAuthHeaders = useCallback(() => {
    if (tokens?.access) {
      return {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokens.access}`,
      }
    }
    return { 'Content-Type': 'application/json' }
  }, [tokens?.access])

  const addToCart = async (product) => {
    if (user && tokens?.access) {
      try {
        const res = await fetch(`${BASE_URL}/api/cart/add/`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ product_id: product.id, quantity: 1 }),
        })
        if (!res.ok) throw new Error('Failed to add to cart')
        await res.json()
        const cartRes = await fetch(`${BASE_URL}/api/cart/`, {
          headers: getAuthHeaders(),
        })
        if (cartRes.ok) {
          const cartData = await cartRes.json()
          if (cartData.id) {
            setServerCartId(cartData.id)
            const items = (cartData.items || []).map((item) => ({
              id: item.product,
              name: item.product_name,
              price: item.product_price,
              image: item.product_image,
              quantity: item.quantity,
              cartItemId: item.id,
            }))
            setCartItems(items)
          }
        }
        setIsCartOpen(true)
        return
      } catch {
        // Fallback to local
      }
    }

    const existing = cartItems.find((item) => item.id === product.id)
    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      )
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }])
    }
    setIsCartOpen(true)
  }

  const removeFromCart = async (productId) => {
    if (user && tokens?.access) {
      const item = cartItems.find((i) => i.id === productId)
      if (item?.cartItemId) {
        try {
          await fetch(`${BASE_URL}/api/cart/remove/${item.cartItemId}/`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
            body: JSON.stringify({ item_id: item.cartItemId }),
          })
        } catch {
          // Continue with local removal even if server fails
        }
      }
    }
    setCartItems(cartItems.filter((item) => item.id !== productId))
  }

  const updateQuantity = async (id, quantity) => {
    if (quantity < 1) {
      removeFromCart(id)
      return
    }

    if (user && tokens?.access) {
      const item = cartItems.find((i) => i.id === id)
      if (item?.cartItemId) {
        try {
          await fetch(`${BASE_URL}/api/cart/update/${item.cartItemId}/`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ item_id: item.cartItemId, quantity }),
          })
        } catch {
          // Continue with local update even if server fails
        }
      }
    }
    setCartItems(
      cartItems.map((item) => (item.id === id ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    setCartItems([])
    setServerCartId(null)
  }

  const closeCart = useCallback(() => setIsCartOpen(false), [])
  const toggleCart = useCallback(() => setIsCartOpen((v) => !v), [])

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        isCartOpen,
        closeCart,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)