import React, { useState, useEffect } from 'react'
import Layout from '../Components/Layout'

export default function Tags() {
    const [tags, setTags] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchTags = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/tags`, {
                credentials: 'include'
            })

            if (response.status === 401) {
                setError('Unauthorized. Please login again.')
                setTags([])
                return
            }

            if (!response.ok) {
                const err = await response.json().catch(() => null)
                throw new Error(err?.message || 'Failed to fetch tags')
            }

            const data = await response.json()
            setTags(data.tags || [])
        } catch (err) {
            console.error('Error loading tags', err)
            setError(err.message || 'Failed to load tags')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchTags()
    }, [])

    const filteredTags = tags.filter((tagItem) =>
        tagItem.tag.toLowerCase().includes(search.toLowerCase())
    )

    const downloadFile = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const handleExportJSON = () => {
        const payload = filteredTags.map(({ tag, count }) => ({ tag, count }))
        const jsonContent = JSON.stringify(payload, null, 2)
        downloadFile(jsonContent, `product-tags-${Date.now()}.json`, 'application/json')
    }

    const handleExportExcel = () => {
        const csvHeader = 'Tag,Product Count\n'
        const csvRows = filteredTags.map((item) => `${JSON.stringify(item.tag)},${item.count}`).join('\n')
        const csvContent = csvHeader + csvRows
        downloadFile(csvContent, `product-tags-${Date.now()}.csv`, 'text/csv')
    }

    return (
        <Layout title="Tags Management">
            <div className="p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Tags</h1>
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                        {tags.length} Total
                    </span>
                </div>

                {/* Top Controls */}
                <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-col md:flex-row items-center gap-3">
                    <input
                        type="text"
                        placeholder="Search tags..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border px-3 py-2 rounded-lg flex-1 focus:ring-2 focus:ring-gray-400"
                    />

                    <button
                        onClick={handleExportJSON}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                    >
                        Export JSON
                    </button>

                    <button
                        onClick={handleExportExcel}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
                    >
                        Export CSV (Excel)
                    </button>
                </div>

                {/* Error / Loading */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="p-6 text-center text-gray-500">Loading tags...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">#</th>
                                    <th className="px-6 py-3">Tag</th>
                                    <th className="px-6 py-3 text-right">Product Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTags.map((tag, index) => (
                                    <tr key={tag.tag} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">{index + 1}</td>
                                        <td className="px-6 py-4">{tag.tag}</td>
                                        <td className="px-6 py-4 text-right font-semibold">{tag.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTags.length === 0 && (
                            <div className="p-6 text-center text-gray-500">No tags found</div>
                        )}
                    </div>
                )}

            </div>
        </Layout>
    )
}