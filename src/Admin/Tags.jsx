import React, { useState } from 'react'
import Layout from '../Components/Layout'

export default function Tags() {
    const [tags, setTags] = useState([
        "Summer",
        "Discount",
        "New Arrival",
        "Popular"
    ])

    const [newTag, setNewTag] = useState("")
    const [search, setSearch] = useState("")
    const [editIndex, setEditIndex] = useState(null)
    const [editValue, setEditValue] = useState("")

    // Add Tag
    const handleAddTag = () => {
        if (!newTag.trim()) return
        setTags([...tags, newTag])
        setNewTag("")
    }

    // Delete Tag
    const handleDeleteTag = (index) => {
        setTags(tags.filter((_, i) => i !== index))
    }

    // Edit Start
    const handleEdit = (index) => {
        setEditIndex(index)
        setEditValue(tags[index])
    }

    // Save Edit
    const handleSaveEdit = () => {
        const updated = [...tags]
        updated[editIndex] = editValue
        setTags(updated)
        setEditIndex(null)
        setEditValue("")
    }

    const filteredTags = tags.filter(tag =>
        tag.toLowerCase().includes(search.toLowerCase())
    )

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
                <div className="bg-white p-4 rounded-xl shadow mb-6 flex flex-col md:flex-row gap-3">

                    <input
                        type="text"
                        placeholder="Add new tag..."
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        className="border px-3 py-2 rounded-lg flex-1 focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                        onClick={handleAddTag}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
                    >
                        Add Tag
                    </button>

                    <input
                        type="text"
                        placeholder="Search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border px-3 py-2 rounded-lg flex-1 focus:ring-2 focus:ring-gray-400"
                    />
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow overflow-hidden">
                    <table className="w-full text-sm text-left">
                        
                        {/* Table Head */}
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3">#</th>
                                <th className="px-6 py-3">Tag Name</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>

                        {/* Table Body */}
                        <tbody>
                            {filteredTags.map((tag, index) => (
                                <tr key={index} className="border-b hover:bg-gray-50">

                                    <td className="px-6 py-4">{index + 1}</td>

                                    <td className="px-6 py-4">
                                        {editIndex === index ? (
                                            <input
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                className="border px-2 py-1 rounded"
                                            />
                                        ) : (
                                            tag
                                        )}
                                    </td>

                                    <td className="px-6 py-4 text-right space-x-3">
                                        {editIndex === index ? (
                                            <button
                                                onClick={handleSaveEdit}
                                                className="text-green-600 hover:underline"
                                            >
                                                Save
                                            </button>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(index)}
                                                    className="text-blue-600 hover:underline"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTag(index)}
                                                    className="text-red-600 hover:underline"
                                                >
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </td>

                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredTags.length === 0 && (
                        <div className="p-6 text-center text-gray-500">
                            No tags found
                        </div>
                    )}
                </div>

            </div>
        </Layout>
    )
}