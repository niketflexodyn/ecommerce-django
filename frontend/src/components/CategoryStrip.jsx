import { useEffect, useState } from "react";
import axios from "axios";
import { categoryApi } from "../utils/api";

const CategoryStrip = () => {
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState(null);
    // categories = Category.objects.filter(parent__isnull = True)
    useEffect(() => {
        getCategories();
    }, []);

    const getCategories = async () => {
        try {
            const { data } = await axios.get(
                "http://127.0.0.1:8000/api/categories/"
            );

            setCategories(data);
        } catch (err) {
            console.log(err);
        }
    };

    const scrollToProducts = () => {
        document
            .getElementById("products-section")
            ?.scrollIntoView({ behavior: "smooth" });
    };

    const handleCategoryClick = (category) => {
        setSelectedCategory(category);
        setSelectedSubcategory(null);

        scrollToProducts();
    };

    const handleSubcategoryClick = (subcategory) => {
        setSelectedSubcategory(subcategory);

        scrollToProducts();
    };

    return (
        <div className="bg-white border-y shadow-sm">
            <div className="max-w-7xl mx-auto py-4">

                <h3 className="text-lg font-semibold text-[#311432] mb-4">
                    Shop by Category
                </h3>

                <div className="flex flex-wrap gap-4">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => handleCategoryClick(category)}
                            className={`px-5 py-2 rounded-full transition
            ${selectedCategory?.id === category.id
                                    ? "bg-[#311432] text-white"
                                    : "bg-gray-100 hover:bg-[#311432] hover:text-white"
                                }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {selectedCategory && selectedCategory.children?.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-3">
                        {selectedCategory.children.map((subcategory) => (
                            <button
                                key={subcategory.id}
                                onClick={() => handleSubcategoryClick(subcategory)}
                                className={`px-4 py-2 rounded-lg border transition
              ${selectedSubcategory?.id === subcategory.id
                                        ? "bg-yellow-400 border-yellow-400"
                                        : "bg-white hover:border-yellow-400"
                                    }`}
                            >
                                {subcategory.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default CategoryStrip;