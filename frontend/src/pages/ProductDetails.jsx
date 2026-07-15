import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom'

export default function ProductDetails() {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const BASE_URL = import.meta.env.VITE_DJANGO_URL;
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/products/${id}/`);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setProduct(data);
                setLoading(false);
            } catch (error) {
                setError(error);
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, BASE_URL]);
    if (loading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div>Error: {error.message}</div>;
    }
    if(!product) {
        return <div>Product not found</div>;

    }


    return (
        <div className="min-h-screen mx-auto flex justify-center items-center w-full">
  <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden w-full">
    <div className="flex flex-col md:flex-row">
      <div className="md:w-8/12">
        <img
          src={product.image?.startsWith('http') ? product.image : `${BASE_URL}${product.image}`}
          alt={product.name}
          className="w-full h-96 md:h-full object-cover"
        />
      </div>
      <div className="md:w-4/12 w-full flex flex-col justify-center p-6 space-y-3">
        <h1 className="text-2xl font-bold text-center md:text-center">{product.name}</h1>
        <p className="text-gray-600 text-center md:text-center">{product.description}</p>
        <p className="text-gray-800 font-semibold text-lg text-center md:text-center">{product.price}</p>
        <button className="bg-blue-500 text-white px-4 py-2 rounded-md w-fit hover:bg-blue-600 transition-colors mx-auto">
          Add to Cart
        </button>
      </div>
    </div>
  </div>
</div>
    );

}