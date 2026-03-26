import React, { useState, useEffect } from 'react'
import Layout from '../Components/Layout'

export default function Brands() {
    const [brands, setBrands] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const fetchBrands = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/products/brands`, {
                credentials: 'include'
            })

            if (response.status === 401) {
                setError('Unauthorized. Please login again.')
                setBrands([])
                return
            }

            if (!response.ok) {
                const err = await response.json().catch(() => null)
                throw new Error(err?.message || 'Failed to fetch brands')
            }

            const data = await response.json()
            setBrands(data.brands || [])
        } catch (err) {
            console.error('Error loading brands', err)
            setError(err.message || 'Failed to load brands')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchBrands()
    }, [])

    const filteredBrands = brands.filter((brandItem) =>
        brandItem.brand.toLowerCase().includes(search.toLowerCase())
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
        const payload = filteredBrands.map(({ brand, count }) => ({ brand, count }))
        const jsonContent = JSON.stringify(payload, null, 2)
        downloadFile(jsonContent, `product-brands-${Date.now()}.json`, 'application/json')
    }

    const handleExportExcel = () => {
        const csvHeader = 'Brand,Product Count\n'
        const csvRows = filteredBrands.map((item) => `${JSON.stringify(item.brand)},${item.count}`).join('\n')
        const csvContent = csvHeader + csvRows
        downloadFile(csvContent, `product-brands-${Date.now()}.csv`, 'text/csv')
    }

    return (
        <Layout title="Brands Management">
            <div className="p-6">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-semibold">Brands</h1>
                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-sm">
                        {brands.length} Total
                    </span>
                </div>

                {/* Top Controls */}
                <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-col md:flex-row items-center gap-3">
                    <input
                        type="text"
                        placeholder="Search brands..."
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
                    <div className="p-6 text-center text-gray-500">Loading brands...</div>
                ) : (
                    <div className="bg-white rounded-xl shadow overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">#</th>
                                    <th className="px-6 py-3">Brand</th>
                                    <th className="px-6 py-3 text-right">Product Count</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredBrands.map((brand, index) => (
                                    <tr key={brand.brand} className="border-b hover:bg-gray-50">
                                        <td className="px-6 py-4">{index + 1}</td>
                                        <td className="px-6 py-4">{brand.brand}</td>
                                        <td className="px-6 py-4 text-right font-semibold">{brand.count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredBrands.length === 0 && (
                            <div className="p-6 text-center text-gray-500">No brands found</div>
                        )}
                    </div>
                )}

            </div>
        </Layout>
    )
}
