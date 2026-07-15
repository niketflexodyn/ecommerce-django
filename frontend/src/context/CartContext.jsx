import { useContext, createContext, useState } from "react";
const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const useCart = () => useContext(cartContext);
    const addToCart = (product) => {
        const existing = cartItems.find(item => item.id === product.id);
        if(existing){
            setCartItems(cartItems.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCartItems([...cartItems, { ...product, quantity: 1 }]);
    }

    const removeFromCart = (productId) => {
        setCartItems(cartItems.filter((item) => item.id !== productId))
    }
    const updateQuantity = (id, quantity) => {
        if(quantity < 1)
            return;
        setCartItems(
            cartItems.map((item) => 
                item.id === id ? { ...item, quantity } : item

            )
        )
    }

    return (
        <CartContext.Provider value={{ cart, setCart, addToCart, updateQuantity, removeFromCart }}>
            {children}
        </CartContext.Provider>
    )
}
}

export const useCart = () => useContext(cartContext);