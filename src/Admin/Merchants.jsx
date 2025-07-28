import React, { useEffect, useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Phone, Mail, MapPin, Briefcase, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

export default function Merchants() {
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        businessType: '',
        status: 'all'
    });
    const [expandedCard, setExpandedCard] = useState(null);
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false
    });

    const navigate = useNavigate();

    // Remove localStorage token check (now handled by cookie on backend)
    useEffect(() => {
        // No need to check localStorage for token
        // Backend will check cookie; if not authenticated, protected route returns 401
    }, [navigate]);

    const fetchMerchants = async (page = 1) => {
        try {
            setLoading(true);
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchants/enquiries?page=${page}&limit=${pagination.limit}`, {
                credentials: 'include', // <-- send cookie for auth
            });

            if (response.status === 401) {
                navigate('/login');
                return;
            }

            const data = await response.json();

            if (response.ok) {
                setMerchants(data.merchants || []);
                setPagination({
                    page: data.pagination.page,
                    limit: data.pagination.limit,
                    total: data.pagination.total,
                    totalPages: data.pagination.totalPages,
                    hasNextPage: data.pagination.hasNextPage,
                    hasPrevPage: data.pagination.hasPrevPage
                });
            } else {
                throw new Error(data.error || 'Failed to fetch merchants');
            }
        } catch (err) {
            console.error('Failed to fetch merchants:', err);
            toast.error(err.message || 'Failed to load merchant data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMerchants(pagination.page);
        // eslint-disable-next-line
    }, [pagination.page]);

    const handleDelete = async (id) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/merchants/enquiries/${id}`, {
                method: 'DELETE',
                credentials: 'include', // <-- send cookie for auth
            });

            if (response.status === 401) {
                toast.error('Authentication error. Please login again.');
                navigate('/login');
                return;
            }

            if (response.ok) {
                toast.success('Merchant application deleted successfully');
                fetchMerchants(pagination.page); // Refresh the list
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete merchant');
            }
        } catch (err) {
            console.error('Delete merchant error:', err);
            toast.error(err.message || 'Failed to delete merchant');
        }
    };

    const filteredMerchants = merchants.filter(merchant => {
        const matchesSearch = merchant.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            merchant.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()) ||
            merchant.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesBusinessType = filters.businessType === '' ||
            merchant.businessType === filters.businessType;

        const matchesStatus = filters.status === 'all' ||
            (filters.status === 'pending' && !merchant.approved) ||
            (filters.status === 'approved' && merchant.approved);

        return matchesSearch && matchesBusinessType && matchesStatus;
    });

    const businessTypes = [...new Set(merchants.map(m => m.businessType))];

    const toggleExpandCard = (id) => {
        setExpandedCard(expandedCard === id ? null : id);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <Toaster 
                position="top-center"
                toastOptions={{
                    duration: 2000,
                    style: {
                        background: '#fff',
                        color: '#333',
                        border: '1px solid #e5e7eb',
                        padding: '16px',
                    },
                }}
            />
            
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h1 className="text-2xl font-bold text-gray-900">Merchant Applications</h1>
                    <div className="flex items-center gap-3">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search merchants..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative group">
                            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300  hover:bg-gray-50">
                                <Filter size={16} />
                                <span>Filters</span>
                            </button>
                            <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-300  shadow-lg z-10 hidden group-hover:block">
                                <div className="p-3 border-b border-gray-200">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 "
                                        value={filters.businessType}
                                        onChange={(e) => setFilters({ ...filters, businessType: e.target.value })}
                                    >
                                        <option value="">All Types</option>
                                        {businessTypes.map((type, i) => (
                                            <option key={i} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="p-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 "
                                        value={filters.status}
                                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredMerchants.length === 0 ? (
                    <div className="bg-white p-8 text-center border border-gray-300 ">
                        <p className="text-gray-500">No merchant applications found matching your criteria</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 mb-6">
                            {filteredMerchants.map((merchant) => (
                                <div
                                    key={merchant._id}
                                    className={`bg-white border border-gray-300  ${expandedCard === merchant._id ? 'shadow-md' : ''}`}
                                >
                                    <div
                                        className="p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                                        onClick={() => toggleExpandCard(merchant._id)}
                                    >
                                        <div>
                                            <h3 className="font-medium text-gray-900">{merchant.businessName}</h3>
                                            <p className="text-sm text-gray-500">{merchant.businessType}</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Are you sure you want to delete this merchant application?')) {
                                                        handleDelete(merchant._id);
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Delete"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            {expandedCard === merchant._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                        </div>
                                    </div>

                                    {expandedCard === merchant._id && (
                                        <div className="p-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <Briefcase className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Business</p>
                                                        <p className="text-gray-900">{merchant.businessName}</p>
                                                        <p className="text-gray-600 text-sm">{merchant.businessType}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start gap-3">
                                                    <Mail className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Name</p>
                                                        <p className="text-gray-900">{merchant.contactPerson}</p>
                                                        <p className="text-gray-600 text-sm">{merchant.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-start gap-3">
                                                    <Phone className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Phone</p>
                                                        <p className="text-gray-900">{merchant.phone}</p>
                                                    </div>
                                                </div>
                                                {merchant.alternatePhone && <div className="flex items-start gap-3">
                                                    <Phone className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Alternate Phone</p>
                                                        <p className="text-gray-900">{merchant.alternatePhone}</p>
                                                    </div>
                                                </div>}
                                                <div className="flex items-start gap-3">
                                                    <MapPin className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-500">Region</p>
                                                        <p className="text-gray-900">{merchant.region}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {merchant.message && (
                                                <div className="md:col-span-2 bg-gray-50 p-3 rounded">
                                                    <p className="text-sm font-medium text-gray-500 mb-1">Message</p>
                                                    <p className="text-gray-700 italic">"{merchant.message}"</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-between items-center mt-4">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={!pagination.hasPrevPage}
                                className={`px-4 py-2 border  ${pagination.hasPrevPage ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 cursor-not-allowed'}`}
                            >
                                Previous
                            </button>
                            <div className="text-sm text-gray-600">
                                Page {pagination.page} of {pagination.totalPages}
                            </div>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={!pagination.hasNextPage}
                                className={`px-4 py-2 border  ${pagination.hasNextPage ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 cursor-not-allowed'}`}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}