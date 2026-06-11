import React, { useState, useEffect } from 'react';
import Layout from '../Components/Layout';
import { useNavigate } from 'react-router-dom';
import { FiExternalLink } from 'react-icons/fi';

const Documentation = () => {
    const navigate = useNavigate();
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const filteredDocs = docs.filter((doc) => {
        const query = searchTerm.trim().toLowerCase();
        if (!query) return true;
        return (
            doc.title?.toLowerCase().includes(query) ||
            doc.link?.toLowerCase().includes(query)
        );
    });

    useEffect(() => {
        const fetchDocs = async () => {
            try {
                const docsRes = await fetch(`${import.meta.env.VITE_SERVER}/admin/docs`, {
                    credentials: 'include',
                });

                if (docsRes.status === 401) {
                    navigate('/login');
                    return;
                }

                if (!docsRes.ok) throw new Error('Failed to load documentation');

                const docsData = await docsRes.json();
                setDocs(docsData.docs || []);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDocs();
    }, [navigate]);

    return (
        <Layout title="Documentation">
            <div className="max-w-4xl mx-auto p-4 sm:p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Documentation</h1>
                        <p className="text-sm text-gray-500 mt-0.5">All saved documentation links</p>
                    </div>
                </div>

                <div className="mb-5">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search by title or link"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    />
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="animate-spin h-10 w-10 rounded-full border-b-2 border-green-600" />
                    </div>
                ) : error ? (
                    <div className="text-center py-16 text-red-500">{error}</div>
                ) : docs.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-lg font-medium">No documentation links yet</p>
                        <p className="text-sm mt-1">No links have been added yet.</p>
                    </div>
                ) : filteredDocs.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <p className="text-lg font-medium">No matching documentation found</p>
                        <p className="text-sm mt-1">Try a different keyword.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredDocs.map((doc) => (
                            <div
                                key={doc._id}
                                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900 mb-1">{doc.title}</h2>
                                    <p className="text-xs text-gray-400 break-all line-clamp-2">{doc.link}</p>
                                    {doc.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {doc.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="text-xs text-blue-800 bg-blue-200 px-2 py-1 rounded"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}                                </div>
                                <a
                                    href={doc.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-green-600 hover:text-green-800 transition-colors"
                                >
                                    <FiExternalLink className="w-4 h-4" />
                                    View Article
                                </a>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default Documentation;