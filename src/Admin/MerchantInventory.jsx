import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Search, AlertTriangle, CheckCircle, XCircle, Edit, Save, X, ChevronLeft, ChevronRight, Filter, SlidersHorizontal, Trash2, Plus, Check, FileSpreadsheet, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';

// Memoized inventory item component to prevent unnecessary re-renders
const InventoryItem = React.memo(({
  item,
  index,
  selectedItems,
  handleSelectItem,
  editingItem,
  editedPrice,
  setEditedPrice,
  updating,
  handleSavePrice,
  handleCancelEdit,
  editingWeight,
  editedWeightValue,
  setEditedWeightValue,
  editedWeightUnit,
  setEditedWeightUnit,
  handleSaveWeight,
  editingMarkupPrice,
  editedMarkupPrice,
  setEditedMarkupPrice,
  handleSaveMarkupPrice,
  handleEditWeight,
  handleEditMarkupPrice,
  handleEditPrice,
  openProductModal,
  getStockStatus,
  handleCancelEditWeight,
  handleCancelEditMarkupPrice,
  handleRemoveItem,
  removing
}) => {
  const stockStatus = getStockStatus(item.quantity, item.minStock);
  const StatusIcon = stockStatus.icon;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <input
          type="checkbox"
          checked={selectedItems.includes(item._id)}
          onChange={() => handleSelectItem(item._id)}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          {item.image && (
            <img
              className="h-12 w-12 rounded-lg object-cover mr-4 border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
              src={item.image}
              alt={item.name}
              onClick={() => openProductModal(item)}
            />
          )}
          <div>
            <div className="flex items-center space-x-2">
              <div className="text-sm font-medium text-gray-900">{item.name}</div>
            </div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {item.category}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {editingWeight === item._id ? (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={editedWeightValue}
              onChange={(e) => setEditedWeightValue(e.target.value)}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              min="0"
              step="0.01"
              placeholder="Value"
              disabled={updating}
            />
            <select
              value={editedWeightUnit}
              onChange={(e) => setEditedWeightUnit(e.target.value)}
              className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              disabled={updating}
            >
              <option value="">Select Unit</option>
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
        ) : (
          <div className="text-sm text-gray-900">
            {item.weightDimension ? `${item.weightDimension.value} ${item.weightDimension.unit}` : 'N/A'}
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 font-medium">
          {item.quantity} / {item.maxStock}
        </div>
        <div className="text-xs text-gray-500">
          Min: {item.minStock}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {editingItem === item._id ? (
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">₹</span>
            <input
              type="number"
              value={editedPrice}
              onChange={(e) => setEditedPrice(e.target.value)}
              className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              min="0"
              step="0.01"
              disabled={updating}
            />
          </div>
        ) : (
          <span className="text-lg">₹{item.price}</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {editingMarkupPrice === item._id ? (
          <div className="flex items-center space-x-2">
            <span className="text-gray-500">₹</span>
            <input
              type="number"
              value={editedMarkupPrice}
              onChange={(e) => setEditedMarkupPrice(e.target.value)}
              className="w-24 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              min="0"
              step="0.01"
              disabled={updating}
            />
          </div>
        ) : (
          <span className="text-lg">₹{item.markupPrice || 0}</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
          <StatusIcon size={14} />
          {stockStatus.status}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        {editingItem === item._id ? (
          <div className="flex items-center space-x-2">
            <button
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              onClick={() => handleSavePrice(item)}
              disabled={updating}
            >
              <Save size={14} className="mr-1" />
              Save
            </button>
            <button
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              onClick={handleCancelEdit}
              disabled={updating}
            >
              <X size={14} className="mr-1" />
              Cancel
            </button>
          </div>
        ) : editingWeight === item._id ? (
          <div className="flex items-center space-x-2">
            <button
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              onClick={() => handleSaveWeight(item)}
              disabled={updating}
            >
              <Save size={14} className="mr-1" />
              Save
            </button>
            <button
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              onClick={() => setEditingWeight(null)}
              disabled={updating}
            >
              <X size={14} className="mr-1" />
              Cancel
            </button>
          </div>
        ) : editingMarkupPrice === item._id ? (
          <div className="flex items-center space-x-2">
            <button
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              onClick={() => handleSaveMarkupPrice(item)}
              disabled={updating}
            >
              <Save size={14} className="mr-1" />
              Save
            </button>
            <button
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
              onClick={() => setEditingMarkupPrice(null)}
              disabled={updating}
            >
              <X size={14} className="mr-1" />
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <button
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              onClick={() => handleEditPrice(item)}
            >
              <Edit size={14} className="mr-1.5" />
              Edit Price
            </button>
            <button
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              onClick={() => handleEditWeight(item)}
            >
              <Edit size={14} className="mr-1.5" />
              Edit Weight
            </button>
            <button
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
              onClick={() => handleEditMarkupPrice(item)}
            >
              <Edit size={14} className="mr-1.5" />
              Edit Markup Price
            </button>
            <button
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50"
              onClick={() => handleRemoveItem(item)}
              disabled={removing === item._id}
            >
              {removing === item._id ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b border-red-700 mr-1.5"></div>
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 size={14} className="mr-1.5" />
                  Remove
                </>
              )}
            </button>
          </div>
        )}
      </td>
    </tr>
  );
});

const MerchantInventory = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editedPrice, setEditedPrice] = useState('');
  const [updating, setUpdating] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [pendingSearch, setPendingSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [allCategories, setAllCategories] = useState([]);
  const [stockCounts, setStockCounts] = useState({ inStock: 0, lowStock: 0, outOfStock: 0 });
  const [editingWeight, setEditingWeight] = useState(null);
  const [editedWeightValue, setEditedWeightValue] = useState('');
  const [editedWeightUnit, setEditedWeightUnit] = useState('');
  const [editingMarkupPrice, setEditingMarkupPrice] = useState(null);
  const [editedMarkupPrice, setEditedMarkupPrice] = useState('');

  // Sorting states
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Product modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Export dropdown state
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef(null);

  // Bulk selection states
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Debounce ref for search
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target)) {
        setShowExportDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch merchant details with inventory
  const fetchMerchantInventory = useCallback(async (params = {}) => {
    try {
      const isSilentRefresh = params.silent === true;
      if (!isSilentRefresh) {
        setLoading(true);
      }
      setError(null);

      const query = new URLSearchParams();
      query.append('page', params.page || page);
      query.append('limit', '20'); // Fixed limit for now
      if (params.search !== undefined) {
        query.append('search', params.search);
      } else if (searchTerm) {
        query.append('search', searchTerm);
      }
      if (params.status !== undefined) {
        query.append('status', params.status);
      } else if (statusFilter !== 'all') {
        query.append('status', statusFilter);
      }
      if (params.category !== undefined && params.category !== 'all') {
        query.append('category', params.category);
      } else if (categoryFilter !== 'all') {
        query.append('category', categoryFilter);
      }
      query.append('sortBy', params.sortBy || sortBy);
      query.append('sortOrder', params.sortOrder || sortOrder);

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}?${query}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          setMerchant(data.merchant);
          setInventory(data.merchant.inventory || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotalItems(data.pagination?.totalItems || 0);
          setStockCounts(data.stockCounts || { inStock: 0, lowStock: 0, outOfStock: 0 });

          // Set categories from response
          if (data.categories) {
            setAllCategories(data.categories);
          }
        } else {
          throw new Error(data.message || 'Failed to fetch merchant inventory');
        }
      } else {
        throw new Error('Failed to fetch merchant inventory');
      }
    } catch (error) {
      console.error('Error fetching merchant inventory:', error);
      setError(error.message);
      toast.error(error.message || 'Failed to load merchant inventory');
    } finally {
      if (params.silent !== true) {
        setLoading(false);
      }
    }
  }, [id, navigate]); // Removed page, searchTerm, statusFilter, categoryFilter, sortBy, sortOrder from dependencies

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
      setRedirecting(true);
      navigate('/login', { replace: true });
      return;
    } finally {
      setCheckingUser(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser && id) {
      fetchMerchantInventory();
    }
  }, [currentUser, id]); // Removed fetchAllCategories, fetchMerchantInventory from dependencies

  // Separate effect for pagination changes
  useEffect(() => {
    if (currentUser && id) {
      fetchMerchantInventory({ page, status: statusFilter, category: categoryFilter, search: searchTerm, sortBy, sortOrder });
    }
  }, [page, currentUser, id]);

  // Separate effect for filter changes
  useEffect(() => {
    if (currentUser && id) {
      fetchMerchantInventory({ status: statusFilter, category: categoryFilter, search: searchTerm, sortBy, sortOrder, page });
    }
  }, [statusFilter, categoryFilter, currentUser, id]);

  // Separate effect for search changes
  useEffect(() => {
    if (currentUser && id) {
      fetchMerchantInventory({ search: searchTerm, status: statusFilter, category: categoryFilter, sortBy, sortOrder, page });
    }
  }, [searchTerm, currentUser, id]);

  // Separate effect for sorting changes
  useEffect(() => {
    if (currentUser && id) {
      fetchMerchantInventory({ sortBy, sortOrder, status: statusFilter, category: categoryFilter, search: searchTerm, page });
    }
  }, [sortBy, sortOrder, currentUser, id]);

  // Update selectAll when inventory changes
  useEffect(() => {
    if (inventory.length > 0) {
      const allSelected = inventory.every(item => selectedItems.includes(item._id));
      setSelectAll(allSelected);
    } else {
      setSelectAll(false);
    }
  }, [inventory, selectedItems]);

  // Filter inventory based on search term (removed - now handled by backend)
  // const filteredInventory = inventory.filter(item =>
  //   item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   item.productId.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  // Use inventory directly since backend handles filtering
  const filteredInventory = inventory;

  // Search handler
  const handleSearch = () => {
    setSearchTerm(pendingSearch);
    setPage(1); // Reset to first page when searching
    setSelectedItems([]);
    setSelectAll(false);
  };

  // Sort handler
  const handleSortPrice = () => {
    setSortBy('price');
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    setPage(1); // Reset to first page when sorting
    setSelectedItems([]);
    setSelectAll(false);
  };

  const handleStatusFilter = (status) => {
    setStatusFilter(status);
    setSearchTerm('');
    setPendingSearch('');
    setPage(1); // Reset to first page when filtering
    setSelectedItems([]);
    setSelectAll(false);
  };

  const handleCategoryFilter = (category) => {
    setCategoryFilter(category);
    setSearchTerm('');
    setPendingSearch('');
    setPage(1); // Reset to first page when filtering
    setSelectedItems([]);
    setSelectAll(false);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setCategoryFilter('all');
    setSearchTerm('');
    setPendingSearch('');
    setPage(1);
    setSelectedItems([]);
    setSelectAll(false);
  };

  // Sort handler
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
    setSelectedItems([]);
    setSelectAll(false);
  };

  // Export to Excel
  const handleExportExcel = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/export-excel`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `merchant_${id}_inventory.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Inventory exported successfully');
      } else {
        toast.error('Failed to export inventory');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export inventory');
    }
  };

  const handleExportJson = () => {
    try {
      const exportData = {
        merchantId: merchant?._id || id,
        merchantName: merchant?.businessInfo?.displayName || 'Merchant',
        exportedAt: new Date().toISOString(),
        filters: {
          search: searchTerm,
          status: statusFilter,
          category: categoryFilter,
          sortBy,
          sortOrder,
          page,
        },
        totalItems,
        items: filteredInventory,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `merchant_${id}_inventory.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowExportDropdown(false);
      toast.success('Inventory exported as JSON successfully');
    } catch (error) {
      console.error('JSON export error:', error);
      toast.error('Failed to export inventory as JSON');
    }
  };

  // Restock out of stock items
  const handleRestock = async () => {
    if (!window.confirm('Are you sure you want to restock all out of stock items? This will add 1 unit to each item that is currently out of stock.')) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/restock`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success(`Successfully restocked ${data.restockedCount} items`);
          // Refetch inventory to show updated stock
          fetchMerchantInventory({ page, search: searchTerm, status: statusFilter, category: categoryFilter, sortBy, sortOrder, silent: true });
        } else {
          throw new Error(data.message || 'Failed to restock items');
        }
      } else {
        throw new Error('Failed to restock items');
      }
    } catch (error) {
      console.error('Error restocking items:', error);
      toast.error(error.message || 'Failed to restock items');
    } finally {
      setUpdating(false);
    }
  };

  // Make all items out of stock
  const handleMakeOutOfStock = async () => {
    if (!window.confirm('Are you sure you want to make all items out of stock? This will set the quantity of all in-stock items to 0.')) {
      return;
    }

    try {
      setUpdating(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/make-out-of-stock`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success(`Successfully made ${data.data.updatedCount} items out of stock`);
          // Refetch inventory to show updated stock
          fetchMerchantInventory({ page, search: searchTerm, status: statusFilter, category: categoryFilter, sortBy, sortOrder, silent: true });
        } else {
          throw new Error(data.message || 'Failed to make items out of stock');
        }
      } else {
        throw new Error('Failed to make items out of stock');
      }
    } catch (error) {
      console.error('Error making items out of stock:', error);
      toast.error(error.message || 'Failed to make items out of stock');
    } finally {
      setUpdating(false);
    }
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      setSelectedItems([]);
      setSelectAll(false);
    }
  };

  const getStockStatus = (quantity, minStock) => {
    if (quantity === 0) return { status: 'Out of Stock', color: 'bg-red-100 text-red-800', icon: XCircle };
    if (quantity <= minStock) return { status: 'Low Stock', color: 'bg-yellow-100 text-yellow-800', icon: AlertTriangle };
    return { status: 'In Stock', color: 'bg-green-100 text-green-800', icon: CheckCircle };
  };

  const handleEditPrice = (item) => {
    setEditingItem(item._id);
    setEditedPrice(item.price.toString());
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditedPrice('');
  };

  const handleSavePrice = async (item) => {
    const newPrice = parseFloat(editedPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${item._id}/price`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price: newPrice }),
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success('Price updated successfully');
          setEditingItem(null);
          setEditedPrice('');
          // Refetch the current page to ensure data consistency
          fetchMerchantInventory({ page, search: searchTerm, status: statusFilter, category: categoryFilter, sortBy, sortOrder, silent: true });
        } else {
          throw new Error(data.message || 'Failed to update price');
        }
      } else {
        throw new Error('Failed to update price');
      }
    } catch (error) {
      console.error('Error updating price:', error);
      toast.error(error.message || 'Failed to update price');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditWeight = (item) => {
    setEditingWeight(item._id);
    setEditedWeightValue(item.weightDimension?.value?.toString() || '');
    setEditedWeightUnit(item.weightDimension?.unit || '');
  };

  const handleCancelEditWeight = () => {
    setEditingWeight(null);
    setEditedWeightValue('');
    setEditedWeightUnit('');
  };

  const handleSaveWeight = async (item) => {
    const value = parseFloat(editedWeightValue);
    const unit = editedWeightUnit.trim();
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid weight value');
      return;
    }
    if (!unit) {
      toast.error('Please enter a valid weight unit');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${item._id}/weight-dimension`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value, unit }),
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success('Weight dimension updated successfully');
          setEditingWeight(null);
          setEditedWeightValue('');
          setEditedWeightUnit('');
          // Refetch the current page to ensure data consistency
          fetchMerchantInventory({ page, search: searchTerm, status: statusFilter, category: categoryFilter, sortBy, sortOrder, silent: true });
        } else {
          throw new Error(data.message || 'Failed to update weight dimension');
        }
      } else {
        throw new Error('Failed to update weight dimension');
      }
    } catch (error) {
      console.error('Error updating weight dimension:', error);
      toast.error(error.message || 'Failed to update weight dimension');
    } finally {
      setUpdating(false);
    }
  };

  const handleEditMarkupPrice = (item) => {
    setEditingMarkupPrice(item._id);
    setEditedMarkupPrice(item.markupPrice?.toString() || '0');
  };

  const handleCancelEditMarkupPrice = () => {
    setEditingMarkupPrice(null);
    setEditedMarkupPrice('');
  };

  const handleSaveMarkupPrice = async (item) => {
    const markupPrice = parseFloat(editedMarkupPrice);
    if (isNaN(markupPrice) || markupPrice < 0) {
      toast.error('Please enter a valid markup price');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${item._id}/markup-price`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markupPrice }),
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success('Markup price updated successfully');
          setEditingMarkupPrice(null);
          setEditedMarkupPrice('');
          // Refetch the current page to ensure data consistency
          fetchMerchantInventory({ page, search: searchTerm, status: statusFilter, category: categoryFilter, sortBy, sortOrder, silent: true });
        } else {
          throw new Error(data.message || 'Failed to update markup price');
        }
      } else {
        throw new Error('Failed to update markup price');
      }
    } catch (error) {
      console.error('Error updating markup price:', error);
      toast.error(error.message || 'Failed to update markup price');
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveItem = async (item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}" from this merchant's inventory? This action cannot be undone.`)) {
      return;
    }

    setRemoving(item._id);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory/${item._id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success('Item removed from inventory successfully');
          // Remove from local state
          setInventory(prev => prev.filter(inv => inv._id !== item._id));
          // Refetch to ensure data consistency
          fetchMerchantInventory({ page, search: searchTerm, status: statusFilter, category: categoryFilter, sortBy, sortOrder, silent: true });
        } else {
          throw new Error(data.message || 'Failed to remove item');
        }
      } else {
        throw new Error('Failed to remove item');
      }
    } catch (error) {
      console.error('Error removing item:', error);
      toast.error(error.message || 'Failed to remove item');
    } finally {
      setRemoving(null);
    }
  };

  // Bulk selection handlers
  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      const newSelected = prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      setSelectAll(newSelected.length === inventory.length && inventory.length > 0);
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
      setSelectAll(false);
    } else {
      setSelectedItems(inventory.map(item => item._id));
      setSelectAll(true);
    }
  };

  const handleBulkRemove = async () => {
    if (selectedItems.length === 0) {
      toast.error('Please select items to remove');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${selectedItems.length} item(s) from this merchant's inventory? This action cannot be undone.`)) {
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchant-stores/${id}/inventory`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ itemIds: selectedItems }),
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.tokenValid === false) {
          navigate('/login', { replace: true });
          return;
        }
        if (data.success) {
          toast.success(data.message || 'Items removed successfully');
          setSelectedItems([]);
          setSelectAll(false);
          fetchMerchantInventory({ page, search: searchTerm, status: statusFilter, category: categoryFilter, sortBy, sortOrder, silent: true });
        } else {
          throw new Error(data.message || 'Failed to remove items');
        }
      } else {
        throw new Error('Failed to remove items');
      }
    } catch (error) {
      console.error('Error removing items:', error);
      toast.error(error.message || 'Failed to remove items');
    } finally {
      setUpdating(false);
    }
  };

  // Handle opening product details modal
  const openProductModal = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  if (checkingUser) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Loading inventory...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Error loading inventory</h3>
            <p className="mt-2 text-sm text-gray-500">{error}</p>
            <button
              onClick={fetchMerchantInventory}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <button
                  onClick={() => navigate(`/merchants/${id}`)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors w-fit"
                >
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Merchant
                </button>
                <div className="sm:border-l sm:border-gray-300 sm:pl-4">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {merchant?.businessInfo?.displayName || 'Merchant'} Inventory
                  </h1>
                  <p className="mt-1 text-sm text-gray-500">
                    Merchant ID: <span className="font-mono text-gray-700">{merchant?.businessInfo?.merchantId || 'N/A'}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search inventory by name, category, or product ID..."
                    value={pendingSearch}
                    onChange={(e) => setPendingSearch(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors w-full sm:w-auto"
                >
                  Search
                </button>
                <button
                  onClick={handleSortPrice}
                  className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors w-full sm:w-auto"
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort by Price {sortOrder === 'asc' ? '↑' : '↓'}
                </button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Filters:</span>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-gray-600 hidden sm:inline">Status:</span>
                <div className="w-full sm:w-auto overflow-x-auto -mx-1 px-1 pb-1">
                  <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden min-w-max">
                  {[
                    { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200' },
                    { key: 'in_stock', label: 'In Stock', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                    { key: 'low_stock', label: 'Low Stock', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                    { key: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-100 text-red-700 hover:bg-red-200' }
                  ].map(({ key, label, color }) => (
                    <button
                      key={key}
                      onClick={() => handleStatusFilter(key)}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        statusFilter === key
                          ? color.replace('hover:', '')
                          : 'bg-white text-gray-600 hover:bg-gray-50'
                      } ${key !== 'all' ? 'border-l border-gray-300' : ''}`}
                    >
                      {label}
                    </button>
                  ))}
                  </div>
                </div>
              </div>

              {/* Category Filter */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <span className="text-sm text-gray-600 hidden sm:inline">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full sm:w-auto"
                >
                  <option value="all">All Categories</option>
                  {allCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              {(statusFilter !== 'all' || categoryFilter !== 'all' || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors w-full sm:w-auto justify-center"
                >
                  <X className="h-4 w-4 mr-1" />
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Restock Button */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
              <button
                onClick={handleRestock}
                disabled={updating}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Restocking...
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4 mr-2" />
                    Restock Out of Stock
                  </>
                )}
              </button>
              <button
                onClick={handleMakeOutOfStock}
                disabled={updating}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <XCircle className="h-4 w-4 mr-2" />
                    Make All Out of Stock
                  </>
                )}
              </button>
              <button
                onClick={() => navigate(`/merchants/${id}/inventory/add`)}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </button>
              <button
                onClick={handleBulkRemove}
                disabled={updating || selectedItems.length === 0}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
              >
                {updating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Removing...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove Selected ({selectedItems.length})
                  </>
                )}
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(prev => !prev)}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors w-full sm:w-auto"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </button>

                {showExportDropdown && (
                  <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                    <button
                      onClick={() => {
                        handleExportExcel();
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Export as Excel
                    </button>
                    <button
                      onClick={handleExportJson}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-100"
                    >
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Restock adds 1 unit to out of stock items • Make out of stock sets all in-stock items to 0
            </p>
          </div>

          {/* Inventory Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Items</dt>
                    <dd className="text-2xl font-semibold text-gray-900">{totalItems}</dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 truncate">In Stock</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stockCounts.inStock}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 truncate">Low Stock</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stockCounts.lowStock}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-medium text-gray-500 truncate">Out of Stock</dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stockCounts.outOfStock}
                    </dd>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Items */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h2 className="text-lg font-semibold text-gray-900">Inventory Items</h2>
                <div className="text-sm text-gray-500">
                  {totalItems} total items
                </div>
              </div>
            </div>

            {filteredInventory.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Package className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-sm font-medium text-gray-900">No inventory items found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  {searchTerm ? 'Try adjusting your search terms.' : 'This merchant has no inventory items yet.'}
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="block md:hidden">
                  <div className="divide-y divide-gray-200">
                    {filteredInventory.map((item, index) => (
                      <div key={item._id || index} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start space-x-4">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item._id)}
                            onChange={() => handleSelectItem(item._id)}
                            className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              {item.image && (
                                <img
                                  className="h-12 w-12 rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                  src={item.image}
                                  alt={item.name}
                                  onClick={() => openProductModal(item)}
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="text-sm font-medium text-gray-900 truncate">{item.name}</h3>
                                <p className="text-sm text-gray-500">{item.category}</p>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Weight:</span>
                                <span className="ml-1 text-gray-900">
                                  {item.weightDimension ? `${item.weightDimension.value} ${item.weightDimension.unit}` : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Stock:</span>
                                <span className="ml-1 text-gray-900">{item.quantity} / {item.maxStock}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Price:</span>
                                <span className="ml-1 text-gray-900">₹{item.price}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Markup:</span>
                                <span className="ml-1 text-gray-900">₹{item.markupPrice || 0}</span>
                              </div>
                            </div>
                            <div className="mt-3 flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${getStockStatus(item.quantity, item.minStock).color}`}>
                                {React.createElement(getStockStatus(item.quantity, item.minStock).icon, { size: 14 })}
                                {getStockStatus(item.quantity, item.minStock).status}
                              </span>
                              </div>
                              <div className="flex flex-wrap gap-2 justify-end">
                                <button
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200"
                                  onClick={() => handleEditPrice(item)}
                                >
                                  <Edit size={12} className="mr-1" />
                                  Price
                                </button>
                                <button
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200"
                                  onClick={() => handleEditWeight(item)}
                                >
                                  <Edit size={12} className="mr-1" />
                                  Weight
                                </button>
                                <button
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200"
                                  onClick={() => handleEditMarkupPrice(item)}
                                >
                                  <Edit size={12} className="mr-1" />
                                  Markup
                                </button>
                                <button
                                  className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200"
                                  onClick={() => handleRemoveItem(item)}
                                  disabled={removing === item._id}
                                >
                                  {removing === item._id ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b border-red-700"></div>
                                  ) : (
                                    <Trash2 size={12} className="mr-1" />
                                  )}
                                </button>
                              </div>
                            </div>
                            {/* Inline editing for mobile */}
                            {editingItem === item._id && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-500">₹</span>
                                  <input
                                    type="number"
                                    value={editedPrice}
                                    onChange={(e) => setEditedPrice(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    min="0"
                                    step="0.01"
                                    disabled={updating}
                                  />
                                </div>
                                <div className="mt-2 flex space-x-2">
                                  <button
                                    className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                    onClick={() => handleSavePrice(item)}
                                    disabled={updating}
                                  >
                                    <Save size={12} className="mr-1" />
                                    Save
                                  </button>
                                  <button
                                    className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                    onClick={handleCancelEdit}
                                    disabled={updating}
                                  >
                                    <X size={12} className="mr-1" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                            {editingWeight === item._id && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex space-x-2">
                                  <input
                                    type="number"
                                    value={editedWeightValue}
                                    onChange={(e) => setEditedWeightValue(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    min="0"
                                    step="0.01"
                                    placeholder="Value"
                                    disabled={updating}
                                  />
                                  <select
                                    value={editedWeightUnit}
                                    onChange={(e) => setEditedWeightUnit(e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    disabled={updating}
                                  >
                                    <option value="">Select Unit</option>
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
                                <div className="mt-2 flex space-x-2">
                                  <button
                                    className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                    onClick={() => handleSaveWeight(item)}
                                    disabled={updating}
                                  >
                                    <Save size={12} className="mr-1" />
                                    Save
                                  </button>
                                  <button
                                    className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                    onClick={() => setEditingWeight(null)}
                                    disabled={updating}
                                  >
                                    <X size={12} className="mr-1" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                            {editingMarkupPrice === item._id && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-2">
                                  <span className="text-gray-500">₹</span>
                                  <input
                                    type="number"
                                    value={editedMarkupPrice}
                                    onChange={(e) => setEditedMarkupPrice(e.target.value)}
                                    className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                    min="0"
                                    step="0.01"
                                    disabled={updating}
                                  />
                                </div>
                                <div className="mt-2 flex space-x-2">
                                  <button
                                    className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700"
                                    onClick={() => handleSaveMarkupPrice(item)}
                                    disabled={updating}
                                  >
                                    <Save size={12} className="mr-1" />
                                    Save
                                  </button>
                                  <button
                                    className="flex-1 inline-flex items-center justify-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                    onClick={() => setEditingMarkupPrice(null)}
                                    disabled={updating}
                                  >
                                    <X size={12} className="mr-1" />
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Desktop Table View */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          <input
                            type="checkbox"
                            checked={selectAll}
                            onChange={handleSelectAll}
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                          />
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Product
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Category
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Weight
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('price')}>
                          <div className="flex items-center gap-1">
                            Price
                            {sortBy === 'price' && (
                              sortOrder === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Markup Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredInventory.map((item, index) => (
                        <InventoryItem
                          key={item._id || index}
                          item={item}
                          index={index}
                          selectedItems={selectedItems}
                          handleSelectItem={handleSelectItem}
                          editingItem={editingItem}
                          editedPrice={editedPrice}
                          setEditedPrice={setEditedPrice}
                          updating={updating}
                          handleSavePrice={handleSavePrice}
                          handleCancelEdit={handleCancelEdit}
                          editingWeight={editingWeight}
                          editedWeightValue={editedWeightValue}
                          setEditedWeightValue={setEditedWeightValue}
                          editedWeightUnit={editedWeightUnit}
                          setEditedWeightUnit={setEditedWeightUnit}
                          handleSaveWeight={handleSaveWeight}
                          editingMarkupPrice={editingMarkupPrice}
                          editedMarkupPrice={editedMarkupPrice}
                          setEditedMarkupPrice={setEditedMarkupPrice}
                          handleSaveMarkupPrice={handleSaveMarkupPrice}
                          handleEditWeight={handleEditWeight}
                          handleEditMarkupPrice={handleEditMarkupPrice}
                          handleEditPrice={handleEditPrice}
                          openProductModal={openProductModal}
                          getStockStatus={getStockStatus}
                          handleCancelEditWeight={() => setEditingWeight(null)}
                          handleCancelEditMarkupPrice={() => setEditingMarkupPrice(null)}
                          handleRemoveItem={handleRemoveItem}
                          removing={removing}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-4 rounded-lg shadow-sm border border-gray-200 mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{inventory.length ? ((page - 1) * 20 + 1) : 0}</span> to{' '}
                  <span className="font-medium">{inventory.length ? ((page - 1) * 20 + inventory.length) : 0}</span> of{' '}
                  <span className="font-medium">{totalItems}</span> results
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => handlePageChange(page - 1)}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <ChevronLeft size={16} className="mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </button>

                <div className="flex items-center space-x-1">
                  <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md">
                    Page {page} of {totalPages}
                  </span>
                </div>

                <button
                  disabled={page === totalPages}
                  onClick={() => handlePageChange(page + 1)}
                  className="relative inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Product Details Modal */}
      {showProductModal && selectedProduct && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 z-40 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-black opacity-50" onClick={() => setShowProductModal(false)}></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all w-full max-w-lg sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-60 mx-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    {selectedProduct.image && (
                      <img
                        className="h-20 w-20 rounded-lg object-cover border border-gray-200"
                        src={selectedProduct.image}
                        alt={selectedProduct.name}
                      />
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                      <p className="text-sm text-gray-500">Category: {selectedProduct.category}</p>
                      {selectedProduct.brand && (
                        <p className="text-sm text-gray-500">Brand: {selectedProduct.brand}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Pricing Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">MRP:</span>
                        <span className="text-sm font-medium">₹{selectedProduct.price}</span>
                      </div>
                      {selectedProduct.markupPrice && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Markup Price:</span>
                          <span className="text-sm font-medium">₹{selectedProduct.markupPrice}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Details</h4>
                    <div className="space-y-2">
                      {selectedProduct.weightDimension && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Weight:</span>
                          <span className="text-sm font-medium">
                            {selectedProduct.weightDimension.value} {selectedProduct.weightDimension.unit}
                          </span>
                        </div>
                      )}
                      {selectedProduct.hsnCode && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">HSN Code:</span>
                          <span className="text-sm font-medium">{selectedProduct.hsnCode}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Stock:</span>
                        <span className="text-sm font-medium">{selectedProduct.quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Min Stock:</span>
                        <span className="text-sm font-medium">{selectedProduct.minStock}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {selectedProduct.description && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Description</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedProduct.description}</p>
                    </div>
                  </div>
                )}

                {/* Tags */}
                {selectedProduct.tags && selectedProduct.tags.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProduct.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowProductModal(false)}
                  className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 sm:ml-3 sm:w-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default MerchantInventory;