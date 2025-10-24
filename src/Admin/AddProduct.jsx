import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, ArrowLeft, Loader2, XCircle, CircleCheck, Image, Tag, Scale, Box, Star, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import ChipInput from '../Components/ChipInput';
import Layout from '../Components/Layout';

export default function AddProduct() {
  const navigate = useNavigate();
  // Role guard state
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const allowedRoles = ['super_admin', 'admin', 'inventory_manager'];

  const fetchCurrentUser = useCallback(async () => {
    try {
      const local = localStorage.getItem('adminUser');
      if (local) {
        setCurrentUser(JSON.parse(local));
      } else {
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (response.ok && data.admin) {
          setCurrentUser(data.admin);
          localStorage.setItem('adminUser', JSON.stringify(data.admin));
        }
      }
    } catch (err) {
      console.error('Failed to fetch current user', err);
    } finally {
      setCheckingUser(false);
    }
  }, [navigate]);

  useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);
  const isAuthorized = allowedRoles.includes(currentUser?.role);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    highlights: [],
    images: [],
    thumbnail: '',
    brand: '',
    category: '',
  hsnCode: '',
    // Weight/Dimension field
    weightDimension: {
      value: '',
      unit: ''
    },
    pricing: {
      mrp: 0,
    },
    isActive: true,
    isFeatured: false,
    tags: [],
    searchKeywords: []
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // File upload states
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const unitOptions = [
    // Weight units
    { value: 'kg', label: 'Kilogram' },
    { value: 'g', label: 'Gram' },
    { value: 'l', label: 'Liter' },
    { value: 'ml', label: 'Milliliter' },
    // Dimension units
    { value: 'cm', label: 'Centimeter' },
    { value: 'mm', label: 'Millimeter' },
    { value: 'inch', label: 'Inch' },
    { value: 'feet', label: 'Feet' },
    { value: 'meter', label: 'Meter' },
    // Quantity units
    { value: 'pack', label: 'Pack' },
    { value: 'piece', label: 'Piece' },
    { value: 'unit', label: 'Unit' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(()=>{
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!isAuthorized) return; // wait until authorized
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/categories`, {
          credentials: 'include', // use cookie for auth
        });

        if (!response.ok) throw new Error('Failed to fetch categories');

        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
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
  }, [navigate, isAuthorized]);

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

  // File upload handlers
  const handleThumbnailFileSelect = (file) => {
    setSelectedThumbnailFile(file);
    // Clear URL if file is selected
    if (file) {
      setFormData(prev => ({ ...prev, thumbnail: '' }));
    }
  };

  const handleImageFileSelect = (files) => {
    setSelectedImageFiles(files);
    // Clear URL inputs if files are selected
    if (files && files.length > 0) {
      setFormData(prev => ({ ...prev, images: [] }));
    }
  };

  // Upload image to Cloudinary
  const uploadImage = async (file, folder = 'products') => {
    const formDataUpload = new FormData();
    formDataUpload.append('image', file);

    const response = await fetch(`${import.meta.env.VITE_SERVER}/image/upload/cloudinary`, {
      method: 'POST',
      body: formDataUpload,
    });

    const data = await response.json();

    if (response.ok) {
      return data.imageUrl;
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadingImages(true);

    try {
      let finalThumbnail = formData.thumbnail;
      let finalImages = [...formData.images];

      // Upload thumbnail if file selected
      if (selectedThumbnailFile) {
        const uploadedUrl = await uploadImage(selectedThumbnailFile, 'products');
        finalThumbnail = uploadedUrl;
      }

      // Upload additional images if files selected
      if (selectedImageFiles && selectedImageFiles.length > 0) {
        const uploadedUrls = await Promise.all(
          selectedImageFiles.map(file => uploadImage(file, 'products'))
        );
        finalImages = uploadedUrls;
      }

      // Prepare payload
      const payload = {
        ...formData,
        thumbnail: finalThumbnail,
        pricing: {
          ...formData.pricing,
          mrp: parseFloat(formData.pricing.mrp),
        },
        tags: formData.tags,
        highlights: formData.highlights.filter(h => h.trim() !== ''),
        images: finalImages.filter(img => img.trim() !== ''),
        searchKeywords: formData.searchKeywords.filter(kw => kw.trim() !== '')
      };

      // Only include weightDimension if both value and unit are provided
      if (formData.weightDimension?.value && formData.weightDimension?.unit) {
        payload.weightDimension = {
          value: parseFloat(formData.weightDimension.value),
          unit: formData.weightDimension.unit
        };
      }

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
      if (data.tokenValid === false) {
        navigate('/login', { replace: true });
        return;
      }

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
          hsnCode: '',
          // Weight/Dimension field
          weightDimension: {
            value: '',
            unit: ''
          },
          pricing: {
            mrp: 0,
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
      setUploadingImages(false);
      setSelectedThumbnailFile(null);
      setSelectedImageFiles([]);
    }
  };

  if (checkingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only Admins and Super Admins can add products.</p>
      </div>
    );
  }

  return (
    <Layout title="Add Product">
      <div className="min-h-screen bg-gray-50 flex items-start justify-center p-4 font-sans">

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
                  Thumbnail Image *
                </label>
                
                {/* File Upload Option */}
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleThumbnailFileSelect(e.target.files[0])}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={uploadingImages}
                  />
                  {selectedThumbnailFile && (
                    <p className="text-sm text-green-600">Selected: {selectedThumbnailFile.name}</p>
                  )}
                  <p className="text-xs text-gray-500">Or enter URL below</p>
                </div>

                {/* URL Input Option */}
                <div className="relative">
                  <input
                    type="text"
                    name="thumbnail"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.thumbnail}
                    onChange={handleChange}
                    placeholder="https://example.com/image.jpg"
                    disabled={uploadingImages || selectedThumbnailFile}
                  />
                  <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Images
                </label>
                
                {/* File Upload Option */}
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleImageFileSelect(Array.from(e.target.files))}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    disabled={uploadingImages}
                  />
                  {selectedImageFiles && selectedImageFiles.length > 0 && (
                    <p className="text-sm text-green-600">
                      Selected: {selectedImageFiles.length} file{selectedImageFiles.length > 1 ? 's' : ''}
                    </p>
                  )}
                  <p className="text-xs text-gray-500">Or enter URLs below</p>
                </div>

                {/* URL Input Options */}
                {formData.images.map((image, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        value={image}
                        onChange={(e) => handleArrayChange('images', index, e.target.value)}
                        placeholder="Image URL"
                        disabled={uploadingImages || selectedImageFiles.length > 0}
                      />
                    </div>
                    {formData.images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayItem('images', index)}
                        className="p-2 text-red-500 hover:bg-red-50 transition-colors"
                        disabled={uploadingImages}
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
                  disabled={uploadingImages || selectedImageFiles.length > 0}
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

              {/* Weight/Dimension */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Weight/Dimension
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    name="weightDimension.value"
                    className="px-3 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.weightDimension.value}
                    onChange={(e) => handleNestedChange('weightDimension', 'value', e.target.value)}
                    placeholder="e.g. 500"
                    min="0"
                    step="0.01"
                    onWheel={(e) => e.target.blur()}
                  />
                  <select
                    name="weightDimension.unit"
                    className="px-3 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    value={formData.weightDimension.unit}
                    onChange={(e) => handleNestedChange('weightDimension', 'unit', e.target.value)}
                  >
                    <option value="">Select Unit</option>
                    {unitOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-gray-500">e.g. 500ml, 1kg, 250g, 12inch, 30cm, 1pack</p>
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
                    required
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
                HSN Code
              </label>
              <input
                type="text"
                name="hsnCode"
                className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                value={formData.hsnCode}
                onChange={(e) => {
                  const sanitizedValue = e.target.value.replace(/[^0-9]/g, '');
                  setFormData(prev => ({ ...prev, hsnCode: sanitizedValue }));
                }}
                placeholder="e.g. 08081000"
              />
            </div>

            </div>
          </div>

          {/* Pricing */}
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
                  onWheel={(e) => e.target.blur()} // Prevent scroll from changing value
                  placeholder="e.g. 299"
                  required
                  min="0"
                  step="0.01"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              </div>
            </div>
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
                disabled={loading || uploadingImages}
              >
                {loading || uploadingImages ? (
                  <>
                    <Loader2 className="animate-spin w-5 h-5" />
                    <span>{uploadingImages ? 'Uploading Images...' : 'Adding Product...'}</span>
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
    </Layout>
  );
}