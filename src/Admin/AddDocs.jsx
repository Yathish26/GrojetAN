import React, { useState } from 'react';
import Layout from '../Components/Layout';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function AddDocs() {
    const navigate = useNavigate();
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isValidHttpUrl = (value) => {
        try {
            const parsed = new URL(value);
            return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
            return false;
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const trimmedTitle = title.trim();
        const trimmedLink = link.trim();

        if (!trimmedTitle) { toast.error('Please enter a title'); return; }
        if (!trimmedLink) { toast.error('Please enter a link'); return; }
        if (!isValidHttpUrl(trimmedLink)) { toast.error('Please enter a valid URL (http or https)'); return; }

        try {
            setSubmitting(true);
            const res = await fetch(`${import.meta.env.VITE_SERVER}/admin/docs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title: trimmedTitle, link: trimmedLink }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || 'Failed to save doc');
                return;
            }
            toast.success('Documentation link saved');
            setTitle('');
            setLink('');
            navigate('/documentation');
        } catch (err) {
            console.error('Submit error:', err);
            toast.error('Failed to save documentation link');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout title="Add Docs">
            <div className="max-w-2xl mx-auto p-4 sm:p-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 sm:p-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Add Documentation Link</h1>
                    <p className="text-sm text-gray-600 mb-6">Enter a title and the related link, then submit.</p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="doc-title" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Title
                            </label>
                            <input
                                id="doc-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Delivery Operations Guide"
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                maxLength={120}
                                disabled={submitting}
                            />
                        </div>

                        <div>
                            <label htmlFor="doc-link" className="block text-sm font-medium text-gray-700 mb-1.5">
                                Link
                            </label>
                            <input
                                id="doc-link"
                                type="url"
                                value={link}
                                onChange={(e) => setLink(e.target.value)}
                                placeholder="https://example.com/documentation"
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                disabled={submitting}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Submitting...' : 'Submit'}
                        </button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}

export default AddDocs;