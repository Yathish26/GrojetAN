import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';
import { FolderInput, FolderOpen } from 'lucide-react';

const S3store = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [error, setError] = useState(null);
  const [redirecting, setRedirecting] = useState(false);
  const allowedRoles = ['super_admin'];

  // All state declarations must be at the top, before any early returns
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [images, setImages] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [search, setSearch] = useState('');
  const [folder, setFolder] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPath, setCurrentPath] = useState([]); // Array of folder names representing current path
  const [viewMode, setViewMode] = useState('folders'); // 'folders' or 'files'

  const fetchImages = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 50,
        ...(search && { search }),
      });

      // If we're at root level, fetch both folders and root-level files
      if (currentPath.length === 0) {
        // First, fetch folders (search doesn't apply to folder names in this simple implementation)
        const folderParams = new URLSearchParams({ listFolders: 'true' });
        const folderResponse = await fetch(`${import.meta.env.VITE_SERVER}/image/s3/images?${folderParams}`, {
          credentials: 'include'
        });
        const folderData = await folderResponse.json();

        // Then, fetch files that don't belong to any folder
        const rootFileParams = new URLSearchParams({
          page: 1,
          limit: 50,
          folder: '', // Empty folder means root level files
          ...(search && { search })
        });
        const rootFileResponse = await fetch(`${import.meta.env.VITE_SERVER}/image/s3/images?${rootFileParams}`, {
          credentials: 'include'
        });
        const rootFileData = await rootFileResponse.json();

        if (folderData.success && rootFileData.success) {
          setFolders(folderData.folders);
          setImages(rootFileData.images);
          setPagination(rootFileData.pagination);
          setViewMode('root');
        } else {
          toast.error('Failed to fetch content');
        }
      } else {
        // If we're in a folder, build the full path and fetch subfolders and files
        const currentFolderPath = currentPath.join('/');

        // First, fetch subfolders of the current path
        const folderParams = new URLSearchParams({
          listFolders: 'true',
          folder: currentFolderPath
        });
        const folderResponse = await fetch(`${import.meta.env.VITE_SERVER}/image/s3/images?${folderParams}`, {
          credentials: 'include'
        });
        const folderData = await folderResponse.json();

        // Then, fetch files in the current folder
        params.append('folder', currentFolderPath);

        const fileResponse = await fetch(`${import.meta.env.VITE_SERVER}/image/s3/images?${params}`, {
          credentials: 'include'
        });

        const fileData = await fileResponse.json();

        if (folderData.success && fileData.success) {
          setFolders(folderData.folders);
          setImages(fileData.images);
          setPagination(fileData.pagination);
          setViewMode('folder');
        } else {
          toast.error('Failed to fetch folder content');
        }
      }
    } catch (error) {
      console.error('Fetch images error:', error);
      toast.error('Failed to fetch images');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setSearch(searchTerm);
    setPage(1); // Reset to first page when searching
  };

  const handleFolderClick = (folderName) => {
    setCurrentPath([...currentPath, folderName]);
    setPage(1);
    setSearch('');
    setSearchTerm('');
  };

  const handleNavigateBack = () => {
    if (currentPath.length > 0) {
      setCurrentPath(currentPath.slice(0, -1));
      setPage(1);
      setSearch('');
      setSearchTerm('');
    }
  };

  const handleNavigateToPath = (index) => {
    setCurrentPath(currentPath.slice(0, index + 1));
    setPage(1);
    setSearch('');
    setSearchTerm('');
  };

  const handleGoToRoot = () => {
    setCurrentPath([]);
    setPage(1);
    setSearch('');
    setSearchTerm('');
  };

  useEffect(() => {
    const fetchCurrentUser = async () => {
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
        setError('Failed to authenticate. Please try again.');
        setRedirecting(true);
        navigate('/login', { replace: true });
      } finally {
        setCheckingUser(false);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  // Prevent blink: show nothing if redirecting
  if (redirecting) return null;

  // Check if user has permission
  useEffect(() => {
    if (!checkingUser && currentUser && !allowedRoles.includes(currentUser.role)) {
      toast.error('Access denied. Super admin privileges required.');
      navigate('/', { replace: true });
    }
  }, [currentUser, checkingUser, navigate]);

  // Fetch images on component mount and when filters change
  useEffect(() => {
    if (currentUser && allowedRoles.includes(currentUser.role)) {
      fetchImages();
    }
  }, [page, search, currentPath, currentUser]);

  if (checkingUser) {
    return (
      <Layout title="S3 Media Manager">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return null;
  }

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const uploadToS3 = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      // Use current path as folder, or manual folder input if at root
      let uploadFolder = '';
      if (currentPath.length > 0) {
        // If we're inside folders, upload to the current path
        uploadFolder = currentPath.join('/');
      } else if (folder.trim()) {
        // If at root and manual folder specified, use it
        uploadFolder = folder.trim();
      }

      if (uploadFolder) {
        formData.append('folder', uploadFolder);
      }

      const response = await fetch(`${import.meta.env.VITE_SERVER}/image/upload/s3`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        toast.success('File uploaded successfully!');
        console.log('File uploaded to:', data.url);
        setUploadProgress(100);

        // Reset form
        setSelectedFile(null);
        setFolder('');

        // Refresh images list
        fetchImages();
      } else {
        toast.error(data.error || 'Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId, imageUrl) => {
    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/image/s3/image/${imageId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Image deleted successfully');
        fetchImages(); // Refresh the list
      } else {
        toast.error(data.error || 'Failed to delete image');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete image');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileTypeIcon = (mimeType, filename) => {
    const extension = filename.split('.').pop().toLowerCase();

    // Images
    if (mimeType?.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension)) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }

    // Videos
    if (mimeType?.startsWith('video/') || ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(extension)) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      );
    }

    // Audio
    if (mimeType?.startsWith('audio/') || ['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
      return (
        <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      );
    }

    // Documents
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension) ||
        mimeType === 'application/pdf' ||
        mimeType === 'application/msword' ||
        mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        mimeType === 'text/plain') {
      return (
        <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    }

    // Archives
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension) ||
        mimeType === 'application/zip' ||
        mimeType === 'application/x-rar-compressed') {
      return (
        <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
        </svg>
      );
    }

    // Default file icon
    return (
      <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <Layout title="S3 Media Manager">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            S3 File Manager
          </h1>
          <p className="text-gray-600">Upload and manage your files (images, videos, documents, etc.)</p>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center mb-6">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900">Upload New Media</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* File Upload Area */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    disabled={uploading}
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <p className="text-gray-600">
                      {selectedFile ? selectedFile.name : 'Click to select or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Any file type supported (images, videos, documents, etc.)</p>
                  </label>
                </div>
              </div>

              {currentPath.length === 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Folder (Optional)
                  </label>
                  <input
                    type="text"
                    value={folder}
                    onChange={(e) => setFolder(e.target.value)}
                    placeholder="e.g., products, banners, logos"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    disabled={uploading}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Details
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      {currentPath.length > 0 ? (
                        <>
                          <p className="text-sm font-medium text-blue-900">Upload to Current Folder</p>
                          <p className="text-xs text-blue-700">Files will be uploaded to: <strong>{currentPath.join('/')}/</strong></p>
                        </>
                      ) : (
                        <>
                          <p className="text-sm font-medium text-blue-900">Upload Details</p>
                          <p className="text-xs text-blue-700">Specify a folder name or leave empty for root level</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={uploadToS3}
                disabled={!selectedFile || uploading}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 transform ${
                  !selectedFile || uploading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-105 focus:ring-4 focus:ring-blue-300 shadow-lg'
                }`}
              >
                {uploading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </div>
                ) : (
                  'Upload to S3'
                )}
              </button>
            </div>

            {/* File Details & Progress */}
            <div className="space-y-6">
              {selectedFile && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                    </svg>
                    File Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span className="font-medium text-gray-900 truncate ml-2">{selectedFile.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size:</span>
                      <span className="font-medium text-gray-900">{formatFileSize(selectedFile.size)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium text-gray-900">{selectedFile.type}</span>
                    </div>
                  </div>
                </div>
              )}

              {uploading && (
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-green-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Upload Progress
                  </h3>
                  <div className="space-y-3">
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-center text-sm text-gray-600">{uploadProgress}% complete</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Images Gallery Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">File Gallery</h2>
                <p className="text-gray-600">Manage your uploaded files</p>
              </div>
            </div>
            <button
              onClick={fetchImages}
              className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {/* Navigation Breadcrumbs */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <button
                onClick={handleGoToRoot}
                className="flex items-center hover:text-blue-600 transition-colors"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
                Root
              </button>
              {currentPath.map((folder, index) => (
                <div key={index} className="flex items-center">
                  <svg className="w-4 h-4 text-gray-400 mx-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <button
                    onClick={() => handleNavigateToPath(index)}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {folder}
                  </button>
                </div>
              ))}
            </nav>
            {currentPath.length > 0 && (
              <button
                onClick={handleNavigateBack}
                className="mt-3 flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to {currentPath.length === 1 ? 'Root' : currentPath[currentPath.length - 2]}
              </button>
            )}
          </div>

          {/* Filters */}
          {viewMode === 'files' || (viewMode === 'root' && images.length > 0) ? (
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search files..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                >
                  Search
                </button>
              </div>
            </div>
          ) : null}

          {/* Content Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-600 text-lg">Loading your media files...</p>
            </div>
          ) : viewMode === 'folders' && folders.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No folders found</h3>
              <p className="text-gray-600">Upload files with folder names to create folders</p>
            </div>
          ) : viewMode === 'files' && images.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
              <p className="text-gray-600">This folder is empty</p>
            </div>
          ) : viewMode === 'folder' && folders.length === 0 && images.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-24 w-24 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Folder is empty</h3>
              <p className="text-gray-600">No subfolders or files found in this folder</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {/* Render folders first */}
                {folders.map((folder) => (
                  <div
                    key={`folder-${folder.name}`}
                    onClick={() => handleFolderClick(folder.name)}
                    className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
                  >
                    <div className="relative overflow-hidden bg-gray-100" style={{ paddingBottom: '100%' }}>
                      <div className="absolute inset-0">
                        {folder.previewImages && folder.previewImages.length > 0 ? (
                          <div className="relative w-full h-full">
                            {folder.totalImages === 1 ? (
                              // Single image - full cover
                              <img
                                src={folder.previewImages[0].url}
                                alt={folder.previewImages[0].originalName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : folder.totalImages === 2 ? (
                              // Two images - show first image with +1 overlay
                              <>
                                <img
                                  src={folder.previewImages[0].url}
                                  alt={folder.previewImages[0].originalName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-md font-semibold">
                                  +1
                                </div>
                              </>
                            ) : folder.totalImages === 3 ? (
                              // Three images - show first image with +2 overlay
                              <>
                                <img
                                  src={folder.previewImages[0].url}
                                  alt={folder.previewImages[0].originalName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.nextSibling.style.display = 'flex';
                                  }}
                                />
                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-md font-semibold">
                                  +2
                                </div>
                              </>
                            ) : (
                              // Four or more images - show 2x2 grid with +X overlay
                              <>
                                <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
                                  {folder.previewImages.slice(0, 4).map((image, index) => (
                                    <div key={index} className="relative overflow-hidden">
                                      <img
                                        src={image.url}
                                        alt={image.originalName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                          e.target.nextSibling.style.display = 'flex';
                                        }}
                                      />
                                    </div>
                                  ))}
                                </div>
                                {/* Show +X indicator if there are more images */}
                                {folder.additionalCount > 0 && (
                                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded-md font-semibold">
                                    +{folder.additionalCount}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            <FolderInput className='w-12 h-12 text-blue-500'/>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 truncate mb-2" title={folder.name}>
                        {folder.name}
                      </h3>
                      <div className="text-xs text-gray-600 mb-3">
                        {folder.totalImages} {folder.totalImages === 1 ? 'image' : 'images'}
                      </div>
                      <button className="w-full px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors">
                        Open Folder
                      </button>
                    </div>
                  </div>
                ))}

                {/* Render root-level files */}
                {images.map((image) => (
                  <div key={image._id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
                    <div className="relative overflow-hidden bg-gray-100 flex items-center justify-center" style={{ paddingBottom: '100%' }}>
                      <div className="absolute inset-0 flex items-center justify-center">
                        {image.mimeType?.startsWith('image/') ? (
                          <img
                            src={image.url}
                            alt={image.originalName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`${image.mimeType?.startsWith('image/') ? 'hidden' : 'flex'}`}>
                          {getFileTypeIcon(image.mimeType, image.originalName)}
                        </div>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-gray-900 truncate mb-2" title={image.originalName}>
                        {image.originalName}
                      </h3>
                      <div className="space-y-1 text-xs text-gray-600">
                        <p>Size: {formatFileSize(image.size)}</p>
                        <p>{formatDate(image.uploadedAt)}</p>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => window.open(image.url, '_blank')}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View
                        </button>
                        <button
                          onClick={() => deleteImage(image._id, image.url)}
                          className="px-3 py-2 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination - only show for files in folder view */}
              {viewMode === 'files' && pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                      const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, page - 2)) + i;
                      if (pageNum > pagination.totalPages) return null;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            page === pageNum
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                    disabled={page === pagination.totalPages}
                    className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default S3store;
