import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import {
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiChevronsLeft,
  FiChevronsRight,
} from 'react-icons/fi';
import { adminProductApi, adminCategoryApi, adminSubcategoryApi, adminAttributeApi, adminAttributeValueApi, variantApi } from '../../utils/api';
import AdminPageHeader from '../../components/admin/AdminPageHeader';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
// import { adminProductApi, adminCategoryApi, adminSubcategoryApi, adminAttributeApi, adminAttributeValueApi } from '../../utils/api';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Resolve a product image URL (absolute or media-relative) to a full URL.
function resolveImgUrl(image) {
  if (!image) return null;
  return image.startsWith('http') ? image : `${API_BASE.replace('/api', '')}${image}`;
}

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [variants, setVariants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [removeCoverImage, setRemoveCoverImage] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [newSubcategoryAttributes, setNewSubcategoryAttributes] = useState('');
  const [selectedSubcategoryDetails, setSelectedSubcategoryDetails] = useState(null);
  const [newAttributeName, setNewAttributeName] = useState('');
  const [newValueText, setNewValueText] = useState({});
  const [productAttributes, setProductAttributes] = useState({});
  // Gallery images: { url, file?, existing } — existing ones come from the
  // server (not re-sent), newly picked ones carry a File to upload.
  const [gallery, setGallery] = useState([]);
  const galleryRef = useRef(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    subCategory: '',
    location: '',
    shipping_days: '5',
    dispatch_days: '5',
    out_for_delivery_days: '5',
    image: null,
  });
  const fileRef = useRef(null);

  const fetchProducts = () => {
    setLoading(true);
    const params = {
      page,
      page_size: pageSize,
    };
    if (searchTerm.trim()) {
      params.search = searchTerm.trim();
    }
    if (categoryFilter && categoryFilter !== 'all') {
      params.category = categoryFilter;
    }

    adminProductApi
      .list(params)
      .then((data) => {
        if (data && Array.isArray(data.results)) {
          setProducts(data.results);
          setTotalCount(data.count ?? data.results.length);
        } else if (Array.isArray(data)) {
          setProducts(data);
          setTotalCount(data.length);
        } else {
          setProducts([]);
          setTotalCount(0);
        }
      })
      .catch((err) => setError(err.data?.detail || 'Failed to load products'))
      .finally(() => setLoading(false));
  };

  const fetchCategories = () => {
    adminCategoryApi
      .list({ all: 'true' })
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
        else if (data && Array.isArray(data.results)) setCategories(data.results);
      })
      .catch(() => { });
  };

  useEffect(() => {
    fetchCategories();
  }, []);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [page, pageSize, searchTerm, categoryFilter]);

  const fetchSubCategories = (categoryId) => {
    if (!categoryId) {
      setSubCategory([]);
      return;
    }
    adminSubcategoryApi.list(categoryId).then(setSubCategory).catch(() => { });
  };

  useEffect(() => {
    fetchSubCategories(form.category);
  }, [form.category]);

  useEffect(() => {
    if (form.subCategory) {
      const sub = subCategory.find((s) => s.id === Number(form.subCategory));
      if (sub && sub.slug) {
        adminSubcategoryApi.attributes(sub.slug).then(setSelectedSubcategoryDetails).catch(() => setSelectedSubcategoryDetails(null));
      } else {
        setSelectedSubcategoryDetails(null);
      }
    } else {
      setSelectedSubcategoryDetails(null);
    }
  }, [form.subCategory, subCategory]);
  const addVariant = () => {
    setVariants([
      ...variants,
      {
        sku: "",
        price: "",
        discount: "",
        discount_type: "percentage",
        stock: "",
        image: null,
        attributes: {},
        is_active: true,
      },
    ]);
  };
  // Update a variant field (e.g. price, stock, sku, image)
  const updateVariant = (index, field, value) => {
    setVariants((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Update an attribute value for a variant (e.g. Size -> XL, Color -> Black)
  const updateVariantAttribute = (variantIndex, attributeId, valueId) => {
    setVariants((prev) => {
      const next = [...prev];
      const attrs = { ...(next[variantIndex].attributes || {}) };
      attrs[attributeId] = valueId;
      next[variantIndex] = { ...next[variantIndex], attributes: attrs };
      return next;
    });
  };

  // Remove a variant from the list
  const removeVariant = (index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const resetGallery = () => {
    gallery.forEach((g) => {
      if (!g.existing) URL.revokeObjectURL(g.url);
    });
    setGallery([]);
    if (galleryRef.current) galleryRef.current.value = '';
  };

  const handleRemoveCoverImage = () => {
    setForm((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
    setRemoveCoverImage(true);
    if (fileRef.current) fileRef.current.value = '';
    if (fieldErrors.image) setFieldErrors((prev) => ({ ...prev, image: '' }));
  };

  const openCreate = () => {
    setEditProduct(null);
    setForm({
      name: '',
      description: '',
      price: '',
      category: categories[0]?.id?.toString() || '',
      subCategory: '',
      location: '',
      shipping_days: '5',
      dispatch_days: '5',
      out_for_delivery_days: '5',
      image: null,
    });
    setVariants([]); // 👈 Add this so previous variants don't linger!

    setImagePreview(null);
    setRemoveCoverImage(false);
    if (fileRef.current) fileRef.current.value = '';
    resetGallery();
    setFormError('');
    setFieldErrors({});
    setProductAttributes({});
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditProduct(product);

    let parentCat = product.category?.id?.toString() || product.category?.toString() || '';
    let subCat = '';
    if (product.category && typeof product.category === 'object' && product.category.parent) {
      parentCat = product.category.parent.toString();
      subCat = product.category.id.toString();
    }

    setForm({
      name: product.name,
      description: product.description || '',
      price: product.price,
      category: parentCat,
      subCategory: subCat,
      location: product.location || '',
      shipping_days: String(product.shipping_days ?? 5),
      dispatch_days: String(product.dispatch_days ?? 5),
      out_for_delivery_days: String(product.out_for_delivery_days ?? 5),
      image: null,
    });
    setImagePreview(product.image ? resolveImgUrl(product.image) : null);
    setRemoveCoverImage(false);
    if (fileRef.current) fileRef.current.value = '';
    resetGallery();
    setGallery((product.images || []).map((url) => ({ url: resolveImgUrl(url), existing: true })));
    setFormError('');
    setFieldErrors({});
    // If product has existing variants, load them:
    if (product.variants && product.variants.length > 0) {
      setVariants(
        product.variants.map((v) => {
          const attrs = {};
          v.attributes?.forEach((a) => {
            attrs[a.attribute] = a.value;
          });
          return {
            id: v.id,
            sku: v.sku,
            price: v.price,
            discount: v.discount?.value !== undefined && v.discount?.value !== null ? String(v.discount.value) : '',
            discount_type: v.discount?.type || 'percentage',
            is_active: v.is_active ?? true,
            stock: v.stock,
            image: v.image,
            attributes: attrs,
          };
        })
      );
    } else {
      setVariants([]);
    }

    const initialAttrs = {};
    if (product.attributes) {
      product.attributes.forEach(pa => {
        initialAttrs[pa.attribute] = pa.value;
      });
    }
    setProductAttributes(initialAttrs);

    setModalOpen(true);
  };

  const handleAddSubcategory = async () => {
    if (!form.category) {
      setFormError('Please select a category first before adding a subcategory.');
      return;
    }
    if (!newSubcategoryName.trim()) {
      setFormError('Please enter a subcategory name.');
      return;
    }
    try {
      const newSub = await adminSubcategoryApi.create(form.category, {
        name: newSubcategoryName,
        attributes: newSubcategoryAttributes,
      });
      setSubCategory((prev) => [...prev, newSub]);
      setForm({ ...form, subCategory: newSub.id });
      setNewSubcategoryName('');
      setNewSubcategoryAttributes('');
      setFormError('');
    } catch (err) {
      setFormError('Failed to add subcategory');
    }
  };

  const fetchCurrentAttributes = () => {
    if (form.subCategory) {
      const sub = subCategory.find((s) => s.id === Number(form.subCategory));
      if (sub && sub.slug) {
        adminSubcategoryApi.attributes(sub.slug).then(setSelectedSubcategoryDetails);
      }
    }
  };

  const handleAddAttribute = async () => {
    if (!newAttributeName.trim() || !form.subCategory) return;
    try {
      await adminAttributeApi.create(form.subCategory, { name: newAttributeName });
      setNewAttributeName('');
      fetchCurrentAttributes();
    } catch (err) {
      setFormError('Failed to add attribute');
    }
  };

  const handleDeleteAttribute = async (attrId) => {
    if (!window.confirm('Delete this attribute? This may affect existing products.')) return;
    try {
      await adminAttributeApi.delete(attrId);
      fetchCurrentAttributes();
    } catch (err) {
      setFormError('Failed to delete attribute');
    }
  };

  const handleEditAttribute = async (attrId, oldName) => {
    const newName = window.prompt("Enter new attribute name:", oldName);
    if (!newName || newName.trim() === '' || newName === oldName) return;
    try {
      await adminAttributeApi.update(attrId, { name: newName });
      fetchCurrentAttributes();
    } catch (err) {
      setFormError('Failed to update attribute');
    }
  };

  const handleAddValue = async (attrId) => {
    const val = newValueText[attrId];
    if (!val || !val.trim()) return;
    try {
      await adminAttributeValueApi.create(attrId, { value: val });
      setNewValueText((prev) => ({ ...prev, [attrId]: '' }));
      fetchCurrentAttributes();
    } catch (err) {
      setFormError('Failed to add attribute value');
    }
  };

  const handleDeleteValue = async (valId) => {
    if (!window.confirm('Delete this value? This may affect existing products.')) return;
    try {
      await adminAttributeValueApi.delete(valId);
      fetchCurrentAttributes();
    } catch (err) {
      setFormError('Failed to delete attribute value');
    }
  };

  const handleEditValue = async (valId, oldValue) => {
    const newVal = window.prompt("Enter new value:", oldValue);
    if (!newVal || newVal.trim() === '' || newVal === oldValue) return;
    try {
      await adminAttributeValueApi.update(valId, { value: newVal });
      fetchCurrentAttributes();
    } catch (err) {
      setFormError('Failed to update attribute value');
    }
  };

  // const validateForm = () => {
  //   const nextErrors = {};

  //   if (!form.name || !form.name.trim()) {
  //     nextErrors.name = 'Product name is required.';
  //   } else if (form.name.trim().length < 2) {
  //     nextErrors.name = 'Product name must be at least 2 characters.';
  //   } else if (form.name.trim().length > 200) {
  //     nextErrors.name = 'Product name must not exceed 200 characters.';
  //   }

  //   if (!form.category) {
  //     nextErrors.category = 'Please select a category.';
  //   }

  //   if (subCategory.length > 0 && !form.subCategory) {
  //     nextErrors.subCategory = 'Please select a sub-category.';
  //   }

  //   if (form.price === '' || form.price === null || form.price === undefined || form.price.toString().trim() === '') {
  //     nextErrors.price = 'Price is required.';
  //   } else {
  //     const p = Number(form.price);
  //     if (isNaN(p) || p <= 0) {
  //       nextErrors.price = 'Please enter a valid price greater than 0.';
  //     } else if (p > 10000000) {
  //       nextErrors.price = 'Price cannot exceed ₹10,000,000.';
  //     }
  //   }

  //   if (form.description && form.description.trim().length > 2000) {
  //     nextErrors.description = 'Description must not exceed 2000 characters.';
  //   }

  //   if (form.location && form.location.trim().length > 200) {
  //     nextErrors.location = 'Location must not exceed 200 characters.';
  //   }

  //   const shipDays = Number(form.shipping_days);
  //   if (form.shipping_days !== '' && (isNaN(shipDays) || shipDays < 0 || !Number.isInteger(shipDays) || shipDays > 100)) {
  //     nextErrors.shipping_days = 'Shipping days must be a whole number (0–100).';
  //   }

  //   const dispDays = Number(form.dispatch_days);
  //   if (form.dispatch_days !== '' && (isNaN(dispDays) || dispDays < 0 || !Number.isInteger(dispDays) || dispDays > 100)) {
  //     nextErrors.dispatch_days = 'Dispatch days must be a whole number (0–100).';
  //   }

  //   const ofdDays = Number(form.out_for_delivery_days);
  //   if (form.out_for_delivery_days !== '' && (isNaN(ofdDays) || ofdDays < 0 || !Number.isInteger(ofdDays) || ofdDays > 100)) {
  //     nextErrors.out_for_delivery_days = 'Out for delivery days must be a whole number (0–100).';
  //   }

  //   if (!editProduct && !form.image) {
  //     nextErrors.image = 'Cover image is required when creating a new product.';
  //   }

  //   return nextErrors;
  // };
  const validateForm = () => {
    const nextErrors = {};
    const hasVariants = variants.length > 0;

    if (!form.name || !form.name.trim()) {
      nextErrors.name = 'Product name is required.';
    } else if (form.name.trim().length < 2) {
      nextErrors.name = 'Product name must be at least 2 characters.';
    } else if (form.name.trim().length > 200) {
      nextErrors.name = 'Product name must not exceed 200 characters.';
    }

    if (!form.category) {
      nextErrors.category = 'Please select a category.';
    }

    if (subCategory.length > 0 && !form.subCategory) {
      nextErrors.subCategory = 'Please select a sub-category.';
    }

    // Price is only mandatory at the product level if there are no variants.
    // When variants exist, each variant supplies its own price.
    if (!hasVariants) {
      if (form.price === '' || form.price === null || form.price === undefined || form.price.toString().trim() === '') {
        nextErrors.price = 'Price is required.';
      } else {
        const p = Number(form.price);
        if (isNaN(p) || p <= 0) {
          nextErrors.price = 'Please enter a valid price greater than 0.';
        } else if (p > 10000000) {
          nextErrors.price = 'Price cannot exceed ₹10,000,000.';
        }
      }
    } else if (form.price !== '' && form.price !== null && form.price !== undefined) {
      // If they did type a base price anyway, still validate it's sane.
      const p = Number(form.price);
      if (isNaN(p) || p < 0) {
        nextErrors.price = 'Please enter a valid price.';
      } else if (p > 10000000) {
        nextErrors.price = 'Price cannot exceed ₹10,000,000.';
      }
    }

    if (form.description && form.description.trim().length > 2000) {
      nextErrors.description = 'Description must not exceed 2000 characters.';
    }

    if (form.location && form.location.trim().length > 200) {
      nextErrors.location = 'Location must not exceed 200 characters.';
    }

    const shipDays = Number(form.shipping_days);
    if (form.shipping_days !== '' && (isNaN(shipDays) || shipDays < 0 || !Number.isInteger(shipDays) || shipDays > 100)) {
      nextErrors.shipping_days = 'Shipping days must be a whole number (0–100).';
    }

    const dispDays = Number(form.dispatch_days);
    if (form.dispatch_days !== '' && (isNaN(dispDays) || dispDays < 0 || !Number.isInteger(dispDays) || dispDays > 100)) {
      nextErrors.dispatch_days = 'Dispatch days must be a whole number (0–100).';
    }

    const ofdDays = Number(form.out_for_delivery_days);
    if (form.out_for_delivery_days !== '' && (isNaN(ofdDays) || ofdDays < 0 || !Number.isInteger(ofdDays) || ofdDays > 100)) {
      nextErrors.out_for_delivery_days = 'Out for delivery days must be a whole number (0–100).';
    }

    // Extra: if variants exist, make sure each has its own price so nothing is left blank.
    if (hasVariants) {
      const missingVariantPrice = variants.some(
        (v) => v.price === '' || v.price === null || v.price === undefined || isNaN(Number(v.price)) || Number(v.price) <= 0
      );
      if (missingVariantPrice) {
        nextErrors.variants = 'Each variant needs a valid price.';
      }
    }

    return nextErrors;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    setSaving(true);

    try {
      const newImages = gallery.filter((g) => !g.existing).map((g) => g.file);
      const firstVariantPrice = variants[0]?.price;
      const data = {
        name: form.name.trim(),
        description: form.description ? form.description.trim() : '',
        price: form.price || firstVariantPrice || '0.00',
        category: form.subCategory || form.category,
        subCategory: form.subCategory,
        location: form.location ? form.location.trim() : '',
        shipping_days: form.shipping_days,
        dispatch_days: form.dispatch_days,
        out_for_delivery_days: form.out_for_delivery_days,
        attributes: JSON.stringify(productAttributes),
        ...(form.image ? { image: form.image } : {}),
        ...(removeCoverImage && !form.image ? { remove_image: 'true' } : {}),
        ...(newImages.length ? { images: newImages } : {}),
      };

      // 1. First save or update the base product:
      let savedProduct;
      if (editProduct) {
        savedProduct = await adminProductApi.update(editProduct.id, data);
      } else {
        savedProduct = await adminProductApi.create(data);
      }

      const targetProductId = editProduct?.id || savedProduct?.id;

      // 2. Then save the variants using the product's ID:
      if (targetProductId && variants.length > 0) {
        for (const variant of variants) {
          const variantData = new FormData();
          variantData.append('sku', variant.sku || `SKU-${targetProductId}-${Date.now()}`);
          variantData.append('price', variant.price || form.price || '0.00');
          variantData.append('stock', variant.stock || 0);
          variantData.append('attributes', JSON.stringify(variant.attributes || {}));
          variantData.append('is_active', variant.is_active !== undefined ? String(variant.is_active) : 'true');
          if (variant.discount !== undefined && variant.discount !== null && String(variant.discount).trim() !== '') {
            variantData.append('discount', String(variant.discount).trim());
            variantData.append('discount_type', variant.discount_type || 'percentage');
          } else {
            variantData.append('discount', '');
          }

          if (variant.imageFile) {
            variantData.append('image', variant.imageFile);
          }

          if (variant.id) {
            await variantApi.update(variant.id, variantData);
          } else {
            await variantApi.create(targetProductId, variantData);
          }
        }
      }

      setModalOpen(false);
      resetGallery();
      fetchProducts();
    } catch (err) {
      const data = err.data || {};
      if (typeof data === 'object' && !Array.isArray(data)) {
        const backendFieldErrors = {};
        Object.entries(data).forEach(([key, val]) => {
          if (Array.isArray(val)) {
            backendFieldErrors[key] = val.join(' ');
          } else if (typeof val === 'string') {
            backendFieldErrors[key] = val;
          }
        });
        if (Object.keys(backendFieldErrors).length > 0) {
          setFieldErrors((prev) => ({ ...prev, ...backendFieldErrors }));
          if (backendFieldErrors.detail || backendFieldErrors.non_field_errors) {
            setFormError(backendFieldErrors.detail || backendFieldErrors.non_field_errors);
          }
          return;
        }
      }
      setFormError(err.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await adminProductApi.delete(deleteId);
      fetchProducts();
    } catch {
      /* already removed or error */
    }
    setDeleteId(null);
  };

  const getCategoryName = (product) => {
    if (typeof product.category === 'object' && product.category?.name) return product.category.name;
    const cat = categories.find((c) => c.id === Number(product.category));
    return cat?.name || '—';
  };
  const getSubCategoryName = (product) => {
    if (typeof product.subCategory === 'object' && product.subCategory?.name) return product.subCategory.name;
    const cat = subCategory.find((c) => c.id === Number(product.subCategory));
    return cat?.name || '—';
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);

  const pageNumbers = (() => {
    const pages = [];
    const span = 1;
    const start = Math.max(1, currentPage - span);
    const end = Math.min(totalPages, currentPage + span);
    if (start > 1) pages.push(1);
    if (start > 2) pages.push('…');
    for (let p = start; p <= end; p++) pages.push(p);
    if (end < totalPages - 1) pages.push('…');
    if (end < totalPages) pages.push(totalPages);
    return pages;
  })();

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-w-0">
      <AdminPageHeader
        title="Products"
        subtitle="Manage your product catalog"
        action={
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-plum-950 px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-sm hover:bg-plum-900 transition-colors"
          >
            <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add Product</span>
          </button>
        }
      />

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
      )}

      {/* Search & Filter Bar */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center w-full">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md w-full">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search products by name or description..."
              className="w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600 shadow-sm"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                title="Clear search"
              >
                <FiX className="size-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="w-full sm:w-52">
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600 shadow-sm"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Counter Badge */}
        <div className="text-xs font-medium text-slate-500">
          Total: <span className="font-semibold text-slate-800">{totalCount}</span> product{totalCount !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Product Table */}
      <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3 whitespace-nowrap">Product</th>
                <th className="px-4 py-3 whitespace-nowrap">Category</th>
                <th className="px-4 py-3 whitespace-nowrap">Sub Category</th>
                <th className="px-4 py-3 whitespace-nowrap">Price</th>
                <th className="px-4 py-3 whitespace-nowrap">Delivery Timeline</th>
                <th className="px-4 py-3 text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-7 w-7 animate-spin rounded-full border-3 border-slate-200 border-t-plum-950" />
                      <span className="text-xs text-slate-400">Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-plum-950">
                      <div className="flex items-center gap-3">
                        {product.image ? (
                          <img
                            src={resolveImgUrl(product.image)}
                            alt={product.name}
                            className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-slate-200"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                            No img
                          </div>
                        )}
                        <div className="min-w-0 max-w-[200px] sm:max-w-xs">
                          <p className="font-medium text-slate-900 truncate">{product.name}</p>
                          <p className="text-xs text-slate-400 truncate">{product.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{getCategoryName(product)}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{getSubCategoryName(product)}</td>
                    <td className="px-4 py-3 font-semibold text-plum-950 whitespace-nowrap">₹{Number(product.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {(Number(product.shipping_days) || 0) +
                        (Number(product.dispatch_days) || 0) +
                        (Number(product.out_for_delivery_days) || 0)}
                      <span className="block text-xs text-slate-400">
                        {Number(product.shipping_days) || 0}S · {Number(product.dispatch_days) || 0}D · {Number(product.out_for_delivery_days) || 0}O
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(product)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                          title="Edit Product"
                        >
                          <FiEdit2 className="size-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteId(product.id)}
                          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                          title="Delete Product"
                        >
                          <FiTrash2 className="size-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {!loading && products.length === 0 && (searchTerm || categoryFilter !== 'all') && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <FiSearch className="mx-auto size-8 text-slate-300 mb-2" />
                    <p className="font-medium text-slate-800">No products found matching your search</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Try adjusting your search keywords or clearing the category filter.
                    </p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setCategoryFilter('all');
                        setPage(1);
                      }}
                      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                    >
                      Clear search & filters
                    </button>
                  </td>
                </tr>
              )}

              {!loading && products.length === 0 && !searchTerm && categoryFilter === 'all' && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    No products yet. Click "Add Product" to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-1">
        {/* Showing Range & Page Size Selector */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-900">
              {totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-semibold text-slate-900">
              {Math.min(currentPage * pageSize, totalCount)}
            </span>{' '}
            of <span className="font-semibold text-slate-900">{totalCount}</span> products
          </div>


        </div>

        {/* Page Navigation Buttons */}
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* <button
              onClick={() => setPage(1)}
              disabled={currentPage === 1}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              title="First Page"
            >
              <FiChevronsLeft className="size-4" />
            </button> */}
            <button
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              title="Previous Page"
            >
              <FiChevronLeft className="size-4" />
            </button>

            {pageNumbers.map((p, idx) =>
              p === '…' ? (
                <span key={`dots-${idx}`} className="px-1 text-xs text-slate-400">
                  …
                </span>
              ) : (
                <button
                  key={`page-${p}`}
                  onClick={() => setPage(p)}
                  className={`inline-flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors ${p === currentPage
                    ? 'bg-plum-950 text-white shadow-sm'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              title="Next Page"
            >
              <FiChevronRight className="size-4" />
            </button>
            {/* <button
              onClick={() => setPage(totalPages)}
              disabled={currentPage === totalPages}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white transition-colors"
              title="Last Page"
            >
              <FiChevronsRight className="size-4" />
            </button> */}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full max-w-3xl sm:max-w-4xl rounded-2xl bg-white p-6 sm:p-8 shadow-xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="text-xl font-bold text-plum-950">
              {editProduct ? 'Edit Product' : 'Add Product'}
            </DialogTitle>

            {formError && (
              <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</div>
            )}

            <form noValidate onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={form.name}
                  onChange={(e) => {
                    setForm({ ...form, name: e.target.value });
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${fieldErrors.name
                    ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-gold-500/50 focus:border-gold-600'
                    }`}
                  placeholder="Product name (max 200 characters)"
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => {
                      setForm({ ...form, category: e.target.value, subCategory: '' });
                      if (fieldErrors.category) setFieldErrors((prev) => ({ ...prev, category: '' }));
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${fieldErrors.category
                      ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-gold-500/50 focus:border-gold-600'
                      }`}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.category && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sub-category {subCategory.length > 0 && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={form.subCategory}
                    onChange={(e) => {
                      setForm({ ...form, subCategory: e.target.value });
                      if (fieldErrors.subCategory) setFieldErrors((prev) => ({ ...prev, subCategory: '' }));
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${fieldErrors.subCategory
                      ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-gold-500/50 focus:border-gold-600'
                      }`}
                  >
                    <option value="">Select sub category</option>
                    {subCategory.map((subCat) => (
                      <option key={subCat.id} value={subCat.id}>
                        {subCat.name}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.subCategory && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.subCategory}</p>
                  )}
                </div>
              </div>

              {/* Set Product Attributes */}
              {selectedSubcategoryDetails && selectedSubcategoryDetails.attributes?.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                  <h3 className="font-semibold text-slate-800 mb-3">Set Product Attributes</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {selectedSubcategoryDetails.attributes.map(attr => (
                      <div key={attr.id}>
                        <label className="block text-sm font-medium text-slate-700 mb-1">{attr.name}</label>
                        <select
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                          value={productAttributes[attr.id] || ''}
                          onChange={(e) => setProductAttributes(prev => ({ ...prev, [attr.id]: e.target.value }))}
                        >
                          <option value="">Select {attr.name}</option>
                          {attr.values?.map(val => (
                            <option key={val.id} value={val.id}>{val.value}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Manage Schema Attributes UI */}
              {selectedSubcategoryDetails && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <h3 className="font-semibold text-slate-800 mb-3">Attributes for {selectedSubcategoryDetails.name}</h3>
                  {selectedSubcategoryDetails.attributes?.map(attr => (
                    <div key={attr.id} className="mb-4 bg-white p-3 rounded shadow-sm border border-slate-100">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-plum-950">{attr.name}</span>
                        <div>
                          <button type="button" onClick={() => handleEditAttribute(attr.id, attr.name)} className="text-indigo-500 text-xs hover:underline mr-3">Edit</button>
                          <button type="button" onClick={() => handleDeleteAttribute(attr.id)} className="text-red-500 text-xs hover:underline">Delete</button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {attr.values?.map(val => (
                          <span key={val.id} className="inline-flex items-center bg-slate-100 px-2 py-1 rounded text-xs text-slate-700">
                            <span className="cursor-pointer hover:underline" onClick={() => handleEditValue(val.id, val.value)} title="Click to edit">
                              {val.value}
                            </span>
                            <button type="button" onClick={() => handleDeleteValue(val.id)} className="ml-1 text-slate-400 hover:text-red-500">×</button>
                          </span>
                        ))}
                      </div>
                      <div className="flex space-x-2 mt-2">
                        <input
                          type="text"
                          maxLength={100}
                          value={newValueText[attr.id] || ''}
                          onChange={(e) => setNewValueText(prev => ({ ...prev, [attr.id]: e.target.value }))}
                          placeholder="New value"
                          className="px-2 py-1 text-xs border border-slate-300 rounded flex-grow focus:outline-none focus:border-gold-600"
                        />
                        <button type="button" onClick={() => handleAddValue(attr.id)} className="px-3 py-1 bg-slate-800 text-white text-xs rounded hover:bg-slate-700 transition-colors">Add Value</button>
                      </div>
                    </div>
                  ))}
                  <div className="flex space-x-2 mt-4">
                    <input
                      type="text"
                      maxLength={100}
                      value={newAttributeName}
                      onChange={e => setNewAttributeName(e.target.value)}
                      placeholder="New attribute (e.g. Color)"
                      className="px-3 py-2 text-sm border border-slate-300 rounded-lg flex-grow focus:outline-none focus:border-gold-600"
                    />
                    <button type="button" onClick={handleAddAttribute} className="px-4 py-2 bg-gold-600 text-white rounded-lg text-sm hover:bg-gold-700 transition-colors">Add</button>
                  </div>
                </div>
              )}

              <div className="p-4 bg-gray-50 rounded-lg border border-slate-200">
                <h2 className="font-medium mb-2 text-sm text-slate-700">Add SubCategory if not exist</h2>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    maxLength={100}
                    className="px-3 py-2 text-sm border border-slate-300 rounded-lg flex-grow focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-600"
                    placeholder="Sub-category name"
                    value={newSubcategoryName}
                    onChange={(e) => setNewSubcategoryName(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleAddSubcategory}
                    className="px-4 py-2 text-sm font-medium bg-plum-950 text-white rounded-lg hover:bg-plum-900 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={form.description}
                  maxLength={2000}
                  onChange={(e) => {
                    setForm({ ...form, description: e.target.value });
                    if (fieldErrors.description) setFieldErrors((prev) => ({ ...prev, description: '' }));
                  }}
                  rows={3}
                  className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${fieldErrors.description
                    ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                    : 'border-slate-300 focus:ring-gold-500/50 focus:border-gold-600'
                    }`}
                  placeholder="Product description (max 2000 characters)"
                />
                {fieldErrors.description && (
                  <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.description}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Price (₹) {variants.length === 0 && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.price}
                    onChange={(e) => {
                      setForm({ ...form, price: e.target.value });
                      if (fieldErrors.price) setFieldErrors((prev) => ({ ...prev, price: '' }));
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${fieldErrors.price
                      ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-gold-500/50 focus:border-gold-600'
                      }`}
                    placeholder="0.00"
                  />
                  {fieldErrors.price && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.price}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    maxLength={200}
                    value={form.location}
                    onChange={(e) => {
                      setForm({ ...form, location: e.target.value });
                      if (fieldErrors.location) setFieldErrors((prev) => ({ ...prev, location: '' }));
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${fieldErrors.location
                      ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                      : 'border-slate-300 focus:ring-gold-500/50 focus:border-gold-600'
                      }`}
                    placeholder="e.g. Ahmedabad, India"
                  />
                  {fieldErrors.location && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.location}</p>
                  )}
                  <p className="mt-1 text-xs text-slate-400">Shown to customers on the product detail page.</p>
                </div>
                {/* Product Variants Section */}
                <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-plum-950">Product Variants & Custom Pricing</h3>
                      <p className="text-xs text-slate-500">
                        Add custom price, stock, and photos for different sizes, colors, or options.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addVariant}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-plum-950 px-3 py-1.5 text-xs font-semibold text-white hover:bg-plum-900 transition-colors"
                    >
                      + Add Variant
                    </button>
                  </div>

                  {variants.length === 0 ? (
                    <p className="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg">
                      No variants added yet. Click "+ Add Variant" to set custom prices and stock per option.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {variants.map((variant, index) => (
                        <div key={index} className="rounded-lg border border-slate-200 bg-white p-3.5 shadow-xs">
                          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                            <span className="text-xs font-bold text-slate-700">Variant #{index + 1}</span>
                            <button
                              type="button"
                              onClick={() => removeVariant(index)}
                              className="text-xs font-medium text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Dynamic Attribute Selectors (Size, Color, etc.) */}
                            {selectedSubcategoryDetails?.attributes?.map((attr) => (
                              <div key={attr.id}>
                                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                  {attr.name}
                                </label>
                                <select
                                  value={variant.attributes?.[attr.id] || ''}
                                  onChange={(e) => updateVariantAttribute(index, attr.id, e.target.value)}
                                  className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                                >
                                  <option value="">Select {attr.name}</option>
                                  {attr.values?.map((val) => (
                                    <option key={val.id} value={val.id}>
                                      {val.value}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}

                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                Variant Price (₹)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder={form.price || '0.00'}
                                value={variant.price}
                                onChange={(e) => updateVariant(index, 'price', e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                Discount Type
                              </label>
                              <select
                                value={variant.discount_type || 'percentage'}
                                onChange={(e) => updateVariant(index, 'discount_type', e.target.value)}
                                className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                              >
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (₹)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                Discount {variant.discount_type === 'percentage' ? '(%)' : '(₹)'}
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                max={variant.discount_type === 'percentage' ? '100' : undefined}
                                placeholder={variant.discount_type === 'percentage' ? 'e.g. 20' : 'e.g. 150'}
                                value={variant.discount ?? ''}
                                onChange={(e) => updateVariant(index, 'discount', e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                Stock
                              </label>
                              <input
                                type="number"
                                placeholder="0"
                                value={variant.stock}
                                onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                SKU
                              </label>
                              <input
                                type="text"
                                placeholder="e.g. LUX-RED-XL"
                                value={variant.sku}
                                onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                                className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-xs focus:ring-1 focus:ring-gold-500 focus:outline-none"
                              />
                            </div>

                            {/* Live preview calculation if discount is configured */}
                            {(() => {
                              const p = parseFloat(variant.price || form.price || 0);
                              const d = parseFloat(variant.discount || 0);
                              const t = variant.discount_type || 'percentage';
                              if (p > 0 && d > 0) {
                                const finalP = t === 'percentage' ? Math.max(0, p - (p * d) / 100) : Math.max(0, p - d);
                                const pct = t === 'percentage' ? Math.min(100, d) : Math.min(100, Math.round((d / p) * 100));
                                return (
                                  <div className="sm:col-span-2 flex items-center justify-between rounded-md bg-emerald-50 border border-emerald-200/80 px-2.5 py-1.5 text-xs text-emerald-800 font-medium">
                                    <span>Discounted Price: <strong className="text-emerald-950 font-bold">₹{finalP.toFixed(2)}</strong> (was ₹{p.toFixed(2)})</span>
                                    <span className="rounded-full bg-emerald-200/90 text-emerald-900 px-2 py-0.5 text-[11px] font-bold">{Math.round(pct)}% OFF</span>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Variant Image */}
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-medium text-slate-600 mb-1">
                                Variant Photo (Optional)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    updateVariant(index, 'imageFile', file);
                                    updateVariant(index, 'imagePreview', URL.createObjectURL(file));
                                  }
                                }}
                                className="w-full text-xs text-slate-500 file:mr-2 file:rounded file:border-0 file:bg-slate-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold hover:file:bg-slate-200"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Shipping timeline (days)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Shipping</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.shipping_days}
                      onChange={(e) => {
                        setForm({ ...form, shipping_days: e.target.value });
                        if (fieldErrors.shipping_days) setFieldErrors((prev) => ({ ...prev, shipping_days: '' }));
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${fieldErrors.shipping_days
                        ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-gold-500/50 focus:border-gold-600'
                        }`}
                      placeholder="5"
                    />
                    {fieldErrors.shipping_days && (
                      <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.shipping_days}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Dispatch</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.dispatch_days}
                      onChange={(e) => {
                        setForm({ ...form, dispatch_days: e.target.value });
                        if (fieldErrors.dispatch_days) setFieldErrors((prev) => ({ ...prev, dispatch_days: '' }));
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${fieldErrors.dispatch_days
                        ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-gold-500/50 focus:border-gold-600'
                        }`}
                      placeholder="5"
                    />
                    {fieldErrors.dispatch_days && (
                      <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.dispatch_days}</p>
                    )}
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">Out for delivery</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={form.out_for_delivery_days}
                      onChange={(e) => {
                        setForm({ ...form, out_for_delivery_days: e.target.value });
                        if (fieldErrors.out_for_delivery_days) setFieldErrors((prev) => ({ ...prev, out_for_delivery_days: '' }));
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${fieldErrors.out_for_delivery_days
                        ? 'border-red-500 ring-1 ring-red-500 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-gold-500/50 focus:border-gold-600'
                        }`}
                      placeholder="5"
                    />
                    {fieldErrors.out_for_delivery_days && (
                      <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.out_for_delivery_days}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Cover image <span className="text-xs font-normal text-slate-400">(Optional)</span>
                  </label>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      setForm({ ...form, image: file || null });
                      if (fieldErrors.image) setFieldErrors((prev) => ({ ...prev, image: '' }));
                      if (file) {
                        setRemoveCoverImage(false);
                        setImagePreview(URL.createObjectURL(file));
                      } else {
                        setImagePreview(editProduct?.image && !removeCoverImage ? resolveImgUrl(editProduct.image) : null);
                      }
                    }}
                    className={`w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-plum-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-plum-900 file:transition-colors ${fieldErrors.image ? 'border border-red-500 rounded-lg p-1' : ''
                      }`}
                  />
                  {fieldErrors.image && (
                    <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors.image}</p>
                  )}
                  {imagePreview && (
                    <div className="relative mt-2 inline-block">
                      <img
                        src={imagePreview}
                        alt="Cover Preview"
                        className="h-24 w-24 rounded-lg object-cover ring-1 ring-slate-200"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveCoverImage}
                        title="Remove cover image"
                        className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-plum-950 text-xs text-white shadow ring-2 ring-white hover:bg-red-600 transition-colors"
                      >
                        &times;
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Additional images</label>
                  <input
                    ref={galleryRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setGallery((prev) => [
                        ...prev,
                        ...files.map((f) => ({ url: URL.createObjectURL(f), file: f, existing: false })),
                      ]);
                    }}
                    className="w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-plum-950 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-plum-900 file:transition-colors"
                  />
                  <p className="mt-1 text-xs text-slate-400">Optional. Shown in the product image gallery.</p>
                  {gallery.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {gallery.map((g, idx) => (
                        <div key={idx} className="group relative">
                          <img
                            src={g.url}
                            alt="Gallery"
                            className="h-20 w-20 rounded-lg object-cover ring-1 ring-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (!g.existing) URL.revokeObjectURL(g.url);
                              setGallery((prev) => prev.filter((_, i) => i !== idx));
                            }}
                            className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-plum-950 text-xs text-white shadow ring-2 ring-white hover:bg-plum-900"
                            aria-label="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-plum-950 px-4 py-2 text-sm font-medium text-white hover:bg-plum-900 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        message="Are you sure you want to delete this product? This action cannot be undone."
      />
    </div>
  );
}