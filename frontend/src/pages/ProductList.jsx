    import React, { useEffect, useState } from 'react'
import ProductCard from '../components/ProductCard'

export default function ProductList() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const BASE_URL = import.meta.env.VITE_DJANGO_URL;

    useEffect(() => {
        fetch(`${BASE_URL}/api/products/`)
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch products");
            }
            return response.json();
        })
        .then((data) => {
            setProducts(data);
            setLoading(false);
        })
        .catch((err) => {
            setError(err.message);
            setLoading(false);
        });
    }, [BASE_URL]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="min-h-screen  bg-gray-100 py-8">
            {/* <h1 className="text-3xl font-bold mb-6 mx-auto text-center text-gray-800 ">Product List</h1> */}
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.length > 0 ? (
                products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))
                ) : (
                    <p>No posts Avaiable</p>
            
                )}
            </div>
        </div>
    )    
} 

