import React, { useEffect, useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Phone, Mail, MapPin, Briefcase, Trash2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';

export default function MerchantEnq() {
    const [merchants, setMerchants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
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
    const [currentUser, setCurrentUser] = useState(null);
    const [checkingUser, setCheckingUser] = useState(true);
    const [redirecting, setRedirecting] = useState(false);

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
            if (data.tokenValid === false) {
                navigate('/login', { replace: true });
                return;
            }

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
        if (currentUser) {
            fetchMerchants(pagination.page);
        }
        // eslint-disable-next-line
    }, [currentUser, pagination.page]);

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

        const matchesStatus = filters.status === 'all' ||
            (filters.status === 'pending' && !merchant.approved) ||
            (filters.status === 'approved' && merchant.approved);

        return matchesSearch && matchesStatus;
    });

    const toggleExpandCard = (id) => {
        setExpandedCard(expandedCard === id ? null : id);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            setPagination(prev => ({ ...prev, page: newPage }));
        }
    };

    if (checkingUser) {
        return (
            <Layout title="Merchant Enquiries">
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
                </div>
            </Layout>
        );
    }

    if (!currentUser) {
        return (
            <Layout title="Merchant Enquiries">
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
                        <p className="text-gray-600">You don't have permission to access this page.</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Merchant Enquiries">
            <div className="p-3 sm:p-4 lg:p-6 space-y-3 sm:space-y-4 lg:space-y-6">

            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col gap-4 mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        <div className="relative flex-1 sm:flex-initial sm:w-64">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search merchants..."
                                className="w-full pl-9 pr-4 py-2 sm:py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="relative flex-1 sm:flex-initial sm:w-64">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <select
                                className="w-full pl-9 pr-4 py-2 sm:py-3 bg-white border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base appearance-none"
                                value={filters.status}
                                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            >
                                <option value="all">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-48 sm:h-64">
                        <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : filteredMerchants.length === 0 ? (
                    <div className="bg-white p-6 sm:p-8 text-center border border-gray-300">
                        <p className="text-gray-500 text-sm sm:text-base">No merchant applications found matching your criteria</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-3 sm:gap-4 mb-4 sm:mb-6">
                            {filteredMerchants.map((merchant) => (
                                <div
                                    key={merchant._id}
                                    className={`bg-white border border-gray-300 ${expandedCard === merchant._id ? 'shadow-md' : ''}`}
                                >
                                    <div
                                        className="p-3 sm:p-4 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                                        onClick={() => toggleExpandCard(merchant._id)}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 text-sm sm:text-base truncate">{merchant.businessName}</h3>
                                            <p className="text-xs sm:text-sm text-gray-500 mt-1">{merchant.contactPerson}</p>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-4 ml-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (window.confirm('Are you sure you want to delete this merchant application?')) {
                                                        handleDelete(merchant._id);
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 p-1 flex-shrink-0"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                            {expandedCard === merchant._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </div>

                                    {expandedCard === merchant._id && (
                                        <div className="p-3 sm:p-4 border-t border-gray-200">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-3">
                                                        <Briefcase className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm font-medium text-gray-500">Business</p>
                                                            <p className="text-gray-900 text-sm sm:text-base break-words">{merchant.businessName}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <Mail className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm font-medium text-gray-500">Contact</p>
                                                            <p className="text-gray-900 text-sm sm:text-base break-words">{merchant.contactPerson}</p>
                                                            <p className="text-gray-600 text-xs sm:text-sm break-words">{merchant.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-3">
                                                        <Phone className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm font-medium text-gray-500">Phone</p>
                                                            <p className="text-gray-900 text-sm sm:text-base break-words">{merchant.phone}</p>
                                                        </div>
                                                    </div>
                                                    {merchant.alternatePhone && (
                                                        <div className="flex items-start gap-3">
                                                            <Phone className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs sm:text-sm font-medium text-gray-500">Alternate Phone</p>
                                                                <p className="text-gray-900 text-sm sm:text-base break-words">{merchant.alternatePhone}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    <div className="flex items-start gap-3">
                                                        <MapPin className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm font-medium text-gray-500">Region</p>
                                                            <p className="text-gray-900 text-sm sm:text-base break-words">{merchant.region}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-3">
                                                        <Clock className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                                                        <div className="min-w-0 flex-1">
                                                            <p className="text-xs sm:text-sm font-medium text-gray-500">Submitted</p>
                                                            <p className="text-gray-900 text-sm sm:text-base break-words">{new Date(merchant.registrationDate).toLocaleDateString('en-IN')}</p>
                                                            <p className="text-gray-600 text-xs sm:text-sm break-words">{new Date(merchant.registrationDate).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                {merchant.message && (
                                                    <div className="sm:col-span-2 bg-gray-50 p-3 rounded border">
                                                        <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">Message</p>
                                                        <p className="text-gray-700 italic text-sm sm:text-base break-words">"{merchant.message}"</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 mt-4 sm:mt-6 px-2 sm:px-0">
                            <button
                                onClick={() => handlePageChange(pagination.page - 1)}
                                disabled={!pagination.hasPrevPage}
                                className={`px-3 py-2 sm:px-4 sm:py-2 border text-xs sm:text-sm font-medium w-full sm:w-auto ${pagination.hasPrevPage ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300' : 'bg-gray-100 cursor-not-allowed text-gray-400 border-gray-200'}`}
                            >
                                Previous
                            </button>
                            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                                Page {pagination.page} of {pagination.totalPages}
                            </div>
                            <button
                                onClick={() => handlePageChange(pagination.page + 1)}
                                disabled={!pagination.hasNextPage}
                                className={`px-3 py-2 sm:px-4 sm:py-2 border text-xs sm:text-sm font-medium w-full sm:w-auto ${pagination.hasNextPage ? 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300' : 'bg-gray-100 cursor-not-allowed text-gray-400 border-gray-200'}`}
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </div>
            </div>
        </Layout>
    );
}