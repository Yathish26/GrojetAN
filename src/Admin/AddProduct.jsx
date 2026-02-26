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
      setCheckingUser(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/auth/profile`, { credentials: 'include' });
      if (response.status === 401) {
        setRedirecting(true);
        navigate('/login', { replace: true });
        return;
      }
      const data = await response.json();
      if (data.tokenValid === false) {
        setRedirecting(true);
        navigate('/login', { replace: true });
        return;
      }
      if (response.ok && data.admin) {
        setCurrentUser(data.admin);
      } else {
        setRedirecting(true);
        navigate('/login', { replace: true });
        return;
      }
    } catch (err) {
      console.error('Failed to fetch current user', err);
      setRedirecting(true);
      navigate('/login', { replace: true });
    } finally {
      setCheckingUser(false);
    }
  }, [navigate]);

  useEffect(() => { fetchCurrentUser(); }, [fetchCurrentUser]);
  const isAuthorized = allowedRoles.includes(currentUser?.role);
  const [formData, setFormData] = useState({
    name: '',
  description: '',
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
      mrp: "",
    },
    variants: [],
    isActive: true,
  tags: [],
  customFields: []
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // File upload states
  const [selectedThumbnailFile, setSelectedThumbnailFile] = useState(null);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedThumbnailPreview, setSelectedThumbnailPreview] = useState(null);
  const [selectedImagePreviews, setSelectedImagePreviews] = useState([]);

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

  const addCustomField = () => {
    setFormData(prev => ({
      ...prev,
      customFields: [...prev.customFields, { key: '', value: '' }]
    }));
  };

  const updateCustomField = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeCustomField = (index) => {
    setFormData(prev => ({
      ...prev,
      customFields: prev.customFields.filter((_, i) => i !== index)
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
    if (file) {
      try {
        const url = URL.createObjectURL(file);
        setSelectedThumbnailPreview(url);
      } catch (err) {
        setSelectedThumbnailPreview(null);
      }
    }
  };

  const handleImageFileSelect = (files) => {
    setSelectedImageFiles(files);
    if (files && files.length > 0) {
      try {
        const previews = files.map(f => URL.createObjectURL(f));
        setSelectedImagePreviews(previews);
      } catch (err) {
        setSelectedImagePreviews([]);
      }
    } else {
      setSelectedImagePreviews([]);
    }
  };

  // Drag and drop handlers
  const handleThumbnailDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleThumbnailDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadingImages) return;

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      handleThumbnailFileSelect(files[0]);
    }
  };

  const handleImagesDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleImagesDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadingImages) return;

    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      handleImageFileSelect(files);
    }
  };

  // Upload image to S3
  const uploadImage = async (file, folder) => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    formDataUpload.append('folder', folder);

    const response = await fetch(`${import.meta.env.VITE_SERVER}/image/upload/s3`, {
      method: 'POST',
      credentials: 'include',
      body: formDataUpload,
    });

    const data = await response.json();

    if (response.ok) {
      return data.url;
    } else {
      throw new Error(data.error || 'Upload failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setUploadingImages(true);

    try {
      // Filter valid variants
      const validVariants = formData.variants.filter(variant => 
        variant.name.trim() && 
        variant.pricing?.mrp && 
        variant.pricing.mrp > 0
      ).map(variant => ({
        ...variant,
        weightDimension: variant.weightDimension?.value && variant.weightDimension?.unit ? {
          value: parseFloat(variant.weightDimension.value),
          unit: variant.weightDimension.unit
        } : undefined,
        pricing: {
          mrp: parseFloat(variant.pricing.mrp)
        }
      })).filter(variant => variant.weightDimension); // Only include variants with weightDimension

      // Prepare base product data without images
      const baseProductData = {
        ...formData,
        thumbnail: '',
        pricing: {
          ...formData.pricing,
          mrp: parseFloat(formData.pricing.mrp),
        },
        tags: formData.tags,
        images: [],
        customFields: formData.customFields.filter(field => field.key.trim() && field.value.trim()),
        variants: [] // Remove variants from base product
      };

      // Only include weightDimension if both value and unit are provided
      if (formData.weightDimension?.value && formData.weightDimension?.unit) {
        baseProductData.weightDimension = {
          value: parseFloat(formData.weightDimension.value),
          unit: formData.weightDimension.unit
        };
      }

      let successMessage = '';
      let createdCount = 0;
      let finalThumbnail = '';
      let finalImages = [];

      // If there are variants, create base product first, upload images, update
      if (validVariants.length > 0) {
        // Create base product without images
        if (formData.name.trim() && formData.pricing?.mrp > 0) {
          const baseWithoutImages = { ...baseProductData };
          const baseResponse = await fetch(`${import.meta.env.VITE_SERVER}/admin/products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(baseWithoutImages)
          });

          if (baseResponse.status === 401) {
            toast.error('Authentication error. Please login again.');
            navigate('/login');
            return;
          }

          if (baseResponse.ok) {
            const baseData = await baseResponse.json();
            const baseProduct = baseData.product;

            // Upload images to 'products/' + baseProduct._id
            if (selectedThumbnailFile) {
              finalThumbnail = await uploadImage(selectedThumbnailFile, 'products/' + baseProduct._id);
            }

            if (selectedImageFiles && selectedImageFiles.length > 0) {
              finalImages = await Promise.all(
                selectedImageFiles.map(file => uploadImage(file, 'products/' + baseProduct._id))
              );
            }

            // Update base product with images
            const updateResponse = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/${baseProduct._id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ thumbnail: finalThumbnail, images: finalImages })
            });

            if (updateResponse.ok) {
              createdCount++;
            } else {
              throw new Error('Failed to update base product with images');
            }
          } else {
            const errorData = await baseResponse.json();
            throw new Error(`Failed to create base product: ${errorData.message}`);
          }
        }

        // Create variants with the same images
        for (const variant of validVariants) {
          const variantProductData = {
            name: variant.name, // Use only the variant name
            description: formData.description,
            brand: formData.brand,
            category: formData.category,
            hsnCode: formData.hsnCode,
            thumbnail: finalThumbnail,
            images: finalImages,
            tags: formData.tags,
            customFields: formData.customFields.filter(field => field.key.trim() && field.value.trim()),
            weightDimension: variant.weightDimension,
            pricing: variant.pricing,
            isActive: variant.isActive !== false,
            variants: [] // No sub-variants
          };

          const variantResponse = await fetch(`${import.meta.env.VITE_SERVER}/admin/products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(variantProductData)
          });

          if (variantResponse.status === 401) {
            toast.error('Authentication error. Please login again.');
            navigate('/login');
            return;
          }

          if (variantResponse.ok) {
            createdCount++;
          } else {
            const errorData = await variantResponse.json();
            console.warn(`Failed to create variant product "${variant.name}":`, errorData.message);
            // Continue with other variants
          }
        }

        successMessage = `${createdCount} product${createdCount > 1 ? 's' : ''} created successfully!`;
      } else {
        // No variants - create single product
        const productWithoutImages = { ...baseProductData };
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(productWithoutImages)
        });

        if (response.status === 401) {
          toast.error('Authentication error. Please login again.');
          navigate('/login');
          return;
        }

        if (response.ok) {
          const data = await response.json();
          const product = data.product;

          // Upload images to 'products/' + product._id
          if (selectedThumbnailFile) {
            finalThumbnail = await uploadImage(selectedThumbnailFile, 'products/' + product._id);
          }

          if (selectedImageFiles && selectedImageFiles.length > 0) {
            finalImages = await Promise.all(
              selectedImageFiles.map(file => uploadImage(file, 'products/' + product._id))
            );
          }

          // Update product with images
          const updateResponse = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/${product._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ thumbnail: finalThumbnail, images: finalImages })
          });

          if (updateResponse.ok) {
            successMessage = `"${formData.name}" added successfully!`;
            createdCount = 1;
          } else {
            throw new Error('Failed to update product with images');
          }
        } else {
          const errorData = await response.json();
          throw new Error(data.message || 'Failed to add product');
        }
      }

      if (createdCount > 0) {
        toast.success(successMessage);
        // Reset form
        setFormData({
          name: '',
          description: '',
          images: [],
          thumbnail: '',
          brand: '',
          category: '',
          hsnCode: '',
          weightDimension: {
            value: '',
            unit: ''
          },
          pricing: {
            mrp: "",
          },
          variants: [],
          isActive: true,
          tags: [],
          customFields: []
        });
      }
    } catch (error) {
      toast.error(error.message);
      console.error('Error:', error);
    } finally {
      setLoading(false);
      setUploadingImages(false);
      setSelectedThumbnailFile(null);
      setSelectedImageFiles([]);
      setSelectedThumbnailPreview(null);
      setSelectedImagePreviews([]);
    }
  };

  // Loading state
  if (checkingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-green-200 border-t-green-600 rounded-full"></div>
      </div>
    );
  }

  // Authorization check
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
                    maxLength={100}
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
                  maxLength={3000}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Product description..."
                />
              </div>

              {/* Highlights removed from product form */}
            </div>

            {/* Images and Brand */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Media</h3>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Thumbnail Image *
                </label>

                {/* Modern File Upload Option */}
                <div className="space-y-2">
                  <div
                    className={`relative border-2 border-dashed p-6 text-center transition-colors ${
                      selectedThumbnailFile
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    } ${uploadingImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !uploadingImages && document.getElementById('thumbnail-file-input').click()}
                    onDragOver={handleThumbnailDragOver}
                    onDrop={handleThumbnailDrop}
                  >
                    <input
                      id="thumbnail-file-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleThumbnailFileSelect(e.target.files[0])}
                      className="hidden"
                      disabled={uploadingImages}
                    />

                    <div className="flex flex-col items-center">
                      {selectedThumbnailFile ? (
                        <>
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                            <Image className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-sm font-medium text-green-700 mb-1">File Selected</p>
                          <p className="text-xs text-green-600">{selectedThumbnailFile.name}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {(selectedThumbnailFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Image className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Click to upload thumbnail</p>
                          <p className="text-xs text-gray-500">or drag and drop • PNG, JPG, JPEG up to 5MB</p>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedThumbnailFile && (
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                          <CircleCheck className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{selectedThumbnailFile.name}</p>
                          <p className="text-xs text-gray-500">
                            {(selectedThumbnailFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedThumbnailFile(null);
                          setSelectedThumbnailPreview(null);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        disabled={uploadingImages}
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                </div>

                {/* Preview */}
                <div className="mt-3">
                  {selectedThumbnailPreview && (
                    <div className="flex items-start gap-3">
                      <img src={selectedThumbnailPreview} alt="thumbnail-preview" className="w-24 h-24 object-cover rounded border" />
                      <div>
                        <p className="text-sm text-gray-700">Preview of selected file</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Additional Images
                </label>

                {/* Modern File Upload Option */}
                <div className="space-y-2">
                  <div
                    className={`relative border-2 border-dashed p-6 text-center transition-colors ${
                      selectedImageFiles && selectedImageFiles.length > 0
                        ? 'border-green-300 bg-green-50'
                        : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                    } ${uploadingImages ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={() => !uploadingImages && document.getElementById('images-file-input').click()}
                    onDragOver={handleImagesDragOver}
                    onDrop={handleImagesDrop}
                  >
                    <input
                      id="images-file-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => handleImageFileSelect(Array.from(e.target.files))}
                      className="hidden"
                      disabled={uploadingImages}
                    />

                    <div className="flex flex-col items-center">
                      {selectedImageFiles && selectedImageFiles.length > 0 ? (
                        <>
                          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                            <Image className="w-6 h-6 text-green-600" />
                          </div>
                          <p className="text-sm font-medium text-green-700 mb-1">
                            {selectedImageFiles.length} file{selectedImageFiles.length > 1 ? 's' : ''} selected
                          </p>
                          <p className="text-xs text-green-600">
                            {(selectedImageFiles.reduce((total, file) => total + file.size, 0) / 1024 / 1024).toFixed(2)} MB total
                          </p>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                            <Image className="w-6 h-6 text-gray-400" />
                          </div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Click to upload additional images</p>
                          <p className="text-xs text-gray-500">or drag and drop • PNG, JPG, JPEG up to 5MB each</p>
                        </>
                      )}
                    </div>
                  </div>

                  {selectedImageFiles && selectedImageFiles.length > 0 && (
                    <div className="space-y-2">
                      {selectedImageFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                              <CircleCheck className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to upload
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const newFiles = selectedImageFiles.filter((_, i) => i !== index);
                              const newPreviews = selectedImagePreviews.filter((_, i) => i !== index);
                              setSelectedImageFiles(newFiles);
                              setSelectedImagePreviews(newPreviews);
                              if (newFiles.length === 0) {
                                // Clear URL inputs if no files left
                                setFormData(prev => ({ ...prev, images: [] }));
                              }
                            }}
                            className="text-red-500 hover:text-red-700 p-1"
                            disabled={uploadingImages}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                </div>

                {/* Previews for selected image files */}
                {selectedImagePreviews && selectedImagePreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {selectedImagePreviews.map((p, i) => (
                      <div key={i} className="w-20 h-20 rounded overflow-hidden border">
                        <img src={p} alt={`preview-${i}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Brand
                </label>
                <input
                  type="text"
                  maxLength={50}
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
                    onKeyDown={(e) => {
                      if (['e', 'E', '+', '-'].includes(e.key)) {
                        e.preventDefault();
                         }
                     }}
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
                maxLength={20}
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
                  onKeyDown={(e) => {
    if (['e', 'E', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  }}
                  value={formData.pricing.mrp}
                  onChange={(e) => handleNestedChange('pricing', 'mrp', e.target.value)}
                  onWheel={(e) => e.target.blur()} // Prevent scroll from changing value
                  placeholder="e.g. 299"
                  required
                  step="0.01"
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Product Variants</h3>
            <div className="space-y-4">
              {formData.variants.map((variant, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-md font-medium text-gray-700">Variant {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newVariants = formData.variants.filter((_, i) => i !== index);
                        setFormData(prev => ({ ...prev, variants: newVariants }));
                      }}
                      className="text-red-500 hover:text-red-700 p-1"
                      disabled={loading}
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Variant Name*</label>
                      <input
                        type="text"
                        value={variant.name || ''}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index] = { ...newVariants[index], name: e.target.value };
                          setFormData(prev => ({ ...prev, variants: newVariants }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={loading}
                        placeholder="e.g., 500ml, 1kg, Small"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">Weight/Dimension</label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          value={variant.weightDimension?.value || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const newVariants = [...formData.variants];
                            newVariants[index] = {
                              ...newVariants[index],
                              weightDimension: {
                                ...newVariants[index].weightDimension,
                                value: value
                              }
                            };
                            setFormData(prev => ({ ...prev, variants: newVariants }));
                          }}
                          className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                          disabled={loading}
                          placeholder="e.g. 500"
                          min="0"
                          step="0.01"
                          onWheel={(e) => e.target.blur()}
                          onKeyDown={(e) => {
                            if (['e', 'E', '+', '-'].includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                        />
                        <select
                          value={variant.weightDimension?.unit || ''}
                          onChange={(e) => {
                            const unit = e.target.value;
                            const newVariants = [...formData.variants];
                            newVariants[index] = {
                              ...newVariants[index],
                              weightDimension: {
                                ...newVariants[index].weightDimension,
                                unit: unit
                              }
                            };
                            setFormData(prev => ({ ...prev, variants: newVariants }));
                          }}
                          className="px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                          disabled={loading}
                        >
                          <option value="">Unit</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="ml">ml</option>
                          <option value="l">l</option>
                          <option value="pack">pack</option>
                          <option value="piece">piece</option>
                          <option value="unit">unit</option>
                          <option value="dozen">dozen</option>
                          <option value="cm">cm</option>
                          <option value="mm">mm</option>
                          <option value="inch">inch</option>
                          <option value="feet">feet</option>
                          <option value="meter">meter</option>
                          <option value="other">other</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-medium mb-1">MRP (₹)*</label>
                      <input
                        type="number"
                        value={variant.pricing?.mrp || ''}
                        onChange={(e) => {
                          const mrp = e.target.value;
                          const newVariants = [...formData.variants];
                          newVariants[index] = {
                            ...newVariants[index],
                            pricing: {
                              ...newVariants[index].pricing,
                              mrp: parseFloat(mrp) || 0
                            }
                          };
                          setFormData(prev => ({ ...prev, variants: newVariants }));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                        disabled={loading}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        onWheel={(e) => e.target.blur()}
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-'].includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        required
                      />
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`variant-active-${index}`}
                        checked={variant.isActive !== false}
                        onChange={(e) => {
                          const newVariants = [...formData.variants];
                          newVariants[index] = { ...newVariants[index], isActive: e.target.checked };
                          setFormData(prev => ({ ...prev, variants: newVariants }));
                        }}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <label htmlFor={`variant-active-${index}`} className="ml-2 text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newVariants = [...formData.variants, {
                    name: '',
                    weightDimension: { value: '', unit: '' },
                    pricing: { mrp: 0 },
                    isActive: true
                  }];
                  setFormData(prev => ({ ...prev, variants: newVariants }));
                }}
                className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
                disabled={loading}
              >
                <Plus size={16} />
                Add Variant
              </button>
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
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Custom Attributes</h3>

              <div className="space-y-3">
                {formData.customFields.map((field, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Key (e.g., Type)"
                      value={field.key}
                      onChange={(e) => updateCustomField(index, 'key', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      disabled={loading}
                    />
                    <input
                      type="text"
                      placeholder="Value (e.g., Veg)"
                      value={field.value}
                      onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => removeCustomField(index)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                      disabled={loading}
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addCustomField}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium"
                  disabled={loading}
                >
                  <Plus size={16} />
                  Add Custom Attribute
                </button>
              </div>
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