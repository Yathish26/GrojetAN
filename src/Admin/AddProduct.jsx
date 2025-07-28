import React, { useState, useEffect } from 'react';
import { Package, Plus, ArrowLeft, Loader2, XCircle, CircleCheck, Image, Tag, Scale, Box, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import ChipInput from '../Components/ChipInput';

export default function AddProduct() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    highlights: [],
    images: [],
    thumbnail: '',
    brand: '',
    category: '',
    sku: '',
    barcode: '',
    variants: [{
      label: '',
      price: 0,
      mrp: 0,
      stock: 0,
      unit: 'kg',
      image: '',
      sellerId: ''
    }],
    pricing: {
      mrp: 0,
      sellingPrice: 0,
      discountPercent: 0,
      offerTag: ''
    },
    tax: {
      gstRate: 0,
      includedInPrice: true
    },
    stock: {
      quantity: 0,
      status: 'in_stock'
    },
    delivery: {
      isInstant: true,
      deliveryTimeInMinutes: 0,
      zones: ['']
    },
    isActive: true,
    isFeatured: false,
    tags: [],
    searchKeywords: []
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const unitOptions = [
    { value: 'kg', label: 'Kilogram' },
    { value: 'liter', label: 'Liter' },
    { value: 'pack', label: 'Pack' },
    { value: 'piece', label: 'Piece' },
    { value: 'g', label: 'Gram' },
    { value: 'ml', label: 'Milliliter' },
    { value: 'unit', label: 'Unit' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(()=>{
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/categories`, {
          credentials: 'include', // use cookie for auth
        });

        if (response.status === 401) {
          navigate('/login');
          return;
        }

        if (!response.ok) throw new Error('Failed to fetch categories');

        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories. Please refresh the page.');
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
    // eslint-disable-next-line
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const handleArrayChange = (arrayName, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]];
      newArray[index] = value;
      return { ...prev, [arrayName]: newArray };
    });
  };

  const addArrayItem = (arrayName) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], '']
    }));
  };

  const removeArrayItem = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };

      // Auto-calculate discount if both MRP and price are set
      if (field === 'price' && newVariants[index].mrp > 0) {
        newVariants[index].discountPercent = Math.round(
          ((newVariants[index].mrp - parseFloat(value)) / newVariants[index].mrp * 100)
        );
      } else if (field === 'mrp' && newVariants[index].price > 0) {
        newVariants[index].discountPercent = Math.round(
          ((parseFloat(value) - newVariants[index].price) / parseFloat(value) * 100)
        );
      }

      return { ...prev, variants: newVariants };
    });
  };

  const addVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          label: '',
          price: 0,
          mrp: 0,
          stock: 0,
          unit: 'kg',
          image: '',
          sellerId: ''
        }
      ]
    }));
  };

  const removeVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleCategoryChange = (e) => {
    const selectedId = e.target.value;
    if (e.target.checked) {
      setFormData(prev => ({
        ...prev,
        category: [...prev.category, selectedId]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        category: prev.category.filter(id => id !== selectedId)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Prepare payload
    const payload = {
      ...formData,
      pricing: {
        ...formData.pricing,
        mrp: parseFloat(formData.pricing.mrp),
        sellingPrice: parseFloat(formData.pricing.sellingPrice),
        discountPercent: parseFloat(formData.pricing.discountPercent)
      },
      stock: {
        ...formData.stock,
        quantity: parseInt(formData.stock.quantity)
      },
      variants: formData.variants.map(variant => ({
        ...variant,
        price: parseFloat(variant.price),
        mrp: parseFloat(variant.mrp),
        stock: parseInt(variant.stock)
      })),
      tags: formData.tags,
      highlights: formData.highlights.filter(h => h.trim() !== ''),
      images: formData.images.filter(img => img.trim() !== ''),
      searchKeywords: formData.searchKeywords.filter(kw => kw.trim() !== ''),
      delivery: {
        ...formData.delivery,
        zones: formData.delivery.zones.filter(zone => zone.trim() !== '')
      }
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // use cookie for auth
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        toast.error('Authentication error. Please login again.');
        navigate('/login');
        return;
      }

      const data = await response.json();

      if (response.ok) {
        toast.success(`"${formData.name}" added successfully!`);
        // Reset form but keep category selection
        setFormData({
          name: '',
          description: '',
          highlights: [],
          images: [],
          thumbnail: '',
          brand: '',
          category: '',
          sku: '',
          barcode: '',
          variants: [{
            label: '',
            price: 0,
            mrp: 0,
            stock: 0,
            unit: 'kg',
            image: '',
            sellerId: ''
          }],
          pricing: {
            mrp: 0,
            sellingPrice: 0,
            discountPercent: 0,
            offerTag: ''
          },
          tax: {
            gstRate: 0,
            includedInPrice: true
          },
          stock: {
            quantity: 0,
            status: 'in_stock'
          },
          delivery: {
            isInstant: true,
            deliveryTimeInMinutes: 0,
            zones: ['']
          },
          isActive: true,
          isFeatured: false,
          tags: [],
          searchKeywords: []
        });
      } else {
        throw new Error(data.message || 'Failed to add product');
      }
    } catch (error) {
      toast.error(error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 font-sans">
      <Toaster position="top-center" />

      <div className="bg-white p-6 shadow-sm border border-gray-200 w-full max-w-6xl mx-4 my-8">
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 mr-3 transition-colors border border-gray-200"
          >
            <ArrowLeft className="text-gray-600" size={20} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800">
            Add New Product
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="name"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Organic Apples"
                    required
                  />
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Product description..."
                />
              </div>

              <ChipInput
                label="Highlights"
                values={formData.highlights}
                setValues={vals => setFormData(prev => ({ ...prev, highlights: vals }))}
                disabled={loading}
                placeholder="Add highlight and press Enter or comma"
                maxTags={3}
              />
            </div>

            {/* Images and Brand */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Media</h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Thumbnail Image URL *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="thumbnail"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.thumbnail}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                  <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Images
                </label>
                {formData.images.map((image, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={image}
                        onChange={(e) => handleArrayChange('images', index, e.target.value)}
                        placeholder="Image URL"
                      />
                    </div>
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('images', index)}
                        className="p-2 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayItem('images')}
                  className="flex items-center text-sm text-green-600 hover:text-green-700 mt-2"
                >
                  <Plus size={16} className="mr-1" />
                  Add another image URL
                </button>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Brand
                </label>
                <input
                  type="text"
                  name="brand"
                  className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.brand}
                  onChange={handleChange}
                  placeholder="Brand name"
                />
              </div>
            </div>
          </div>

          {/* Categories and Inventory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Category</h3>

              {loadingCategories ? (
                <p>Loading categories...</p>
              ) : (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Inventory</h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  SKU (Stock Keeping Unit) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="sku"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="e.g. PROD-12345"
                    required
                  />
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Barcode
                </label>
                <input
                  type="text"
                  name="barcode"
                  className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="e.g. 123456789012"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Stock Status *
                </label>
                <select
                  name="stock.status"
                  className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.stock.status}
                  onChange={(e) => handleNestedChange('stock', 'status', e.target.value)}
                  required
                >
                  <option value="in_stock">In Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                  <option value="limited">Limited Stock</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock.quantity"
                  className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.stock.quantity}
                  onChange={(e) => handleNestedChange('stock', 'quantity', e.target.value)}
                  placeholder="e.g. 100"
                  required
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Pricing and Tax */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Pricing</h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  MRP (Maximum Retail Price) *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="pricing.mrp"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.pricing.mrp}
                    onChange={(e) => handleNestedChange('pricing', 'mrp', e.target.value)}
                    placeholder="e.g. 299"
                    required
                    min="0"
                    step="0.01"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Selling Price *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="pricing.sellingPrice"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.pricing.sellingPrice}
                    onChange={(e) => handleNestedChange('pricing', 'sellingPrice', e.target.value)}
                    placeholder="e.g. 249"
                    required
                    min="0"
                    step="0.01"
                  />
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Discount Percent
                </label>
                <input
                  type="number"
                  name="pricing.discountPercent"
                  className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.pricing.discountPercent}
                  onChange={(e) => handleNestedChange('pricing', 'discountPercent', e.target.value)}
                  placeholder="e.g. 20"
                  min="0"
                  max="100"
                  readOnly
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Offer Tag
                </label>
                <input
                  type="text"
                  name="pricing.offerTag"
                  className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.pricing.offerTag}
                  onChange={(e) => handleNestedChange('pricing', 'offerTag', e.target.value)}
                  placeholder="e.g. Special Offer"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Tax & Delivery</h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  name="tax.gstRate"
                  className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.tax.gstRate}
                  onChange={(e) => handleNestedChange('tax', 'gstRate', e.target.value)}
                  placeholder="e.g. 18"
                  min="0"
                  max="100"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="tax.includedInPrice"
                  id="taxIncluded"
                  checked={formData.tax.includedInPrice}
                  onChange={(e) => handleNestedChange('tax', 'includedInPrice', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="taxIncluded" className="text-sm text-gray-700">
                  Tax included in price
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Time (minutes)
                </label>
                <input
                  type="number"
                  name="delivery.deliveryTimeInMinutes"
                  className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.delivery.deliveryTimeInMinutes}
                  onChange={(e) => handleNestedChange('delivery', 'deliveryTimeInMinutes', e.target.value)}
                  placeholder="e.g. 120"
                  min="0"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="delivery.isInstant"
                  id="isInstant"
                  checked={formData.delivery.isInstant}
                  onChange={(e) => handleNestedChange('delivery', 'isInstant', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="isInstant" className="text-sm text-gray-700">
                  Instant Delivery Available
                </label>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Zones
                </label>
                {formData.delivery.zones.map((zone, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={zone}
                        onChange={(e) => {
                          const newZones = [...formData.delivery.zones];
                          newZones[index] = e.target.value;
                          handleNestedChange('delivery', 'zones', newZones);
                        }}
                        placeholder="e.g. North Delhi"
                      />
                    </div>
                    {formData.delivery.zones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newZones = formData.delivery.zones.filter((_, i) => i !== index);
                          handleNestedChange('delivery', 'zones', newZones);
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <XCircle size={18} />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    const newZones = [...formData.delivery.zones, ''];
                    handleNestedChange('delivery', 'zones', newZones);
                  }}
                  className="flex items-center text-sm text-green-600 hover:text-green-700 mt-2"
                >
                  <Plus size={16} className="mr-1" />
                  Add another delivery zone
                </button>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Product Variants</h3>

            {formData.variants.map((variant, index) => (
              <div key={index} className="border border-gray-200 p-4 rounded-lg space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium text-gray-700">Variant {index + 1}</h4>
                  {formData.variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center"
                    >
                      <XCircle size={16} className="mr-1" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Label *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={variant.label}
                      onChange={(e) => handleVariantChange(index, 'label', e.target.value)}
                      placeholder="e.g. 1kg Pack"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Unit *
                    </label>
                    <select
                      className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={variant.unit}
                      onChange={(e) => handleVariantChange(index, 'unit', e.target.value)}
                    >
                      {unitOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      MRP *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={variant.mrp}
                        onChange={(e) => handleVariantChange(index, 'mrp', e.target.value)}
                        placeholder="e.g. 299"
                        min="0"
                        step="0.01"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Selling Price *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        placeholder="e.g. 249"
                        min="0"
                        step="0.01"
                      />
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Stock *
                    </label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      value={variant.stock}
                      onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                      placeholder="e.g. 100"
                      min="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Image URL
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={variant.image}
                        onChange={(e) => handleVariantChange(index, 'image', e.target.value)}
                        placeholder="https://example.com/image.jpg"
                      />
                      <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addVariant}
              className="flex items-center text-sm text-green-600 hover:text-green-700"
            >
              <Plus size={16} className="mr-1" />
              Add another variant
            </button>
          </div>

          {/* Additional Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Tags & Keywords</h3>

              <ChipInput
                label="Tags"
                values={formData.tags}
                setValues={vals => setFormData(prev => ({ ...prev, tags: vals }))}
                disabled={loading}
                placeholder="Add tag and press Enter or comma"
                maxTags={10}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Search Keywords</h3>

              <ChipInput
                label="Search Keywords"
                values={formData.searchKeywords}
                setValues={vals => setFormData(prev => ({ ...prev, searchKeywords: vals }))}
                disabled={loading}
                placeholder="Add keyword and press Enter or comma"
                maxTags={10}
              />
            </div>
          </div>

          {/* Status and Submit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Status</h3>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={(e) => setFormData(prev => ({ ...prev, isFeatured: e.target.checked }))}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isFeatured" className="ml-2 text-sm text-gray-700">
                    Featured
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end items-end">
              <button
                type="submit"
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 px-6 font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm rounded"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>Adding Product...</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Add Product</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}