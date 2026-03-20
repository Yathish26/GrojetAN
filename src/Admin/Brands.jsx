import React, { useState } from 'react'
import Layout from '../Components/Layout'

export default function Tags() {
    const [brands, setBrands] = useState([
        "Nike",
        "Adidas",
        "Puma",
        "Zara"
    ])

    const [newBrand, setNewBrand] = useState("")

    const handleAddBrand = () => {
        if (!newBrand.trim()) return
        setBrands([...brands, newBrand])
        setNewBrand("")
    }

    const handleDeleteBrand = (index) => {
        setBrands(brands.filter((_, i) => i !== index))
    }

    return (
        <Layout title="Brands Management">
            <div className="p-6">

                {/* Header */}
                <h1 className="text-2xl font-semibold mb-6">Brands</h1>

                {/* Add Brand */}
                <div className="bg-white p-4 rounded-xl shadow mb-6 flex gap-3">
                    <input
                        type="text"
                        placeholder="Enter brand name"
                        value={newBrand}
                        onChange={(e) => setNewBrand(e.target.value)}
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleAddBrand}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                    >
                        Add
                    </button>
                </div>

                {/* Brands List */}
                <div className="bg-white p-4 rounded-xl shadow">
                    <h2 className="text-lg font-medium mb-4">All Brands</h2>

                    <div className="flex flex-wrap gap-3">
                        {brands.map((brand, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full"
                            >
                                <span className="text-sm">{brand}</span>
                                <button
                                    onClick={() => handleDeleteBrand(index)}
                                    className="text-white bg-red-500 hover:bg-red-600 rounded-full w-5 h-5 flex items-center justify-center text-xs"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>

                    {brands.length === 0 && (
                        <p className="text-gray-500 text-sm">No brands available</p>
                    )}
                </div>

            </div>
        </Layout>
    )
}
