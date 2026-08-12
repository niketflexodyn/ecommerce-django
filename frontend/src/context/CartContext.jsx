import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { request } from '../utils/api'

const CartContext = createContext()

const BASE_URL = import.meta.env.VITE_DJANGO_URL

const mapServerCartItem = (item) => ({
  id: item.product,
  name: item.product_name,
  price: item.price ?? item.discounted_price ?? item.original_price ?? '0.00',
  original_price: item.original_price,
  discounted_price: item.discounted_price,
  discount: item.discount,
  variant: item.variant_detail,
  variant_id: item.variant,
  variant_sku: item.variant_sku,
  variant_attributes: item.variant_attributes || [],
  image: item.product_image,
  quantity: item.quantity,
  cartItemId: item.id,
  subtotal: item.subtotal,
})

export const CartProvider = ({ children }) => {
  const { user, tokens } = useAuth()
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [serverCartId, setServerCartId] = useState(null)
  const [isCartOpen, setIsCartOpen] = useState(false)

  useEffect(() => {
    if (user && tokens?.access) {
      request('/cart/')
        .then((data) => {
          if (data && data.id) {
            setServerCartId(data.id)
            const items = (data.items || []).map(mapServerCartItem)
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
    if (!user || !tokens?.access) {
      navigate('/login', { state: { from: '/checkout' } })
      return
    }

    const variantId = product.variant?.id || product.variant_id || null

    if (user && tokens?.access) {
      try {
        const data = await request('/cart/add/', {
          method: 'POST',
          body: JSON.stringify({
            product_id: product.id,
            variant_id: variantId,
            quantity: product.quantity || 1,
          }),
        })
        if (data.cart?.id) {
          setServerCartId(data.cart.id)
          setCartItems((data.cart.items || []).map(mapServerCartItem))
        } else {
          const cartData = await request('/cart/')
          if (cartData && cartData.id) {
            setServerCartId(cartData.id)
            setCartItems((cartData.items || []).map(mapServerCartItem))
          }
        }
        setIsCartOpen(true)
        return
      } catch {
        // Fallback to local
      }
    }

    const keyMatch = (item) =>
      item.id === product.id && (variantId ? (item.variant_id === variantId || item.variant?.id === variantId) : !item.variant_id)

    const existing = cartItems.find(keyMatch)
    if (existing) {
      setCartItems(
        cartItems.map((item) =>
          keyMatch(item) ? { ...item, quantity: item.quantity + (product.quantity || 1) } : item
        )
      )
    } else {
      setCartItems([
        ...cartItems,
        {
          ...product,
          variant_id: variantId,
          variant: product.variant,
          quantity: product.quantity || 1,
        },
      ])
    }
    setIsCartOpen(true)
  }

  const getItemIdentifier = (item) => `${item.id}-${item.variant_id || item.variant?.id || 'default'}`;

  const removeFromCart = async (identifier) => {
    const item = cartItems.find((i) => i.cartItemId === identifier || i.id === identifier || getItemIdentifier(i) === identifier)
    const targetCartItemId = item?.cartItemId

    if (user && tokens?.access && targetCartItemId) {
      try {
        await request(`/cart/remove/${targetCartItemId}/`, {
          method: 'DELETE',
          body: JSON.stringify({ item_id: targetCartItemId }),
        })
      } catch {
        // Continue with local removal even if server fails
      }
    }
    setCartItems(cartItems.filter((item) => item.cartItemId !== identifier && item.id !== identifier && getItemIdentifier(item) !== identifier))
  }

  const updateQuantity = async (identifier, quantity) => {
    if (quantity < 1) {
      removeFromCart(identifier)
      return
    }

    const item = cartItems.find((i) => i.cartItemId === identifier || i.id === identifier || getItemIdentifier(i) === identifier)
    const targetCartItemId = item?.cartItemId

    if (user && tokens?.access && targetCartItemId) {
      try {
        await request(`/cart/update/${targetCartItemId}/`, {
          method: 'PUT',
          body: JSON.stringify({ item_id: targetCartItemId, quantity }),
        })
      } catch {
        // Continue with local update even if server fails
      }
    }
    setCartItems(
      cartItems.map((item) =>
        (item.cartItemId === identifier || item.id === identifier || getItemIdentifier(item) === identifier) ? { ...item, quantity } : item
      )
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