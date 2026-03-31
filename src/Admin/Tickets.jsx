import React, { useState } from 'react'
import toast from 'react-hot-toast'
import Layout from '../Components/Layout'

export default function Tickets() {
  const [formData, setFormData] = useState({
    department: '',
    title: '',
    description: ''
  })
  const [imageFiles, setImageFiles] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAllTickets, setShowAllTickets] = useState(false)
  const [tickets, setTickets] = useState([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [deletingTicketId, setDeletingTicketId] = useState('')
  const [selectedTicketImage, setSelectedTicketImage] = useState(null)

  const formatDateTime = (value) => {
    if (!value) return '-'
    return new Date(value).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const fetchTickets = async () => {
    try {
      setIsLoadingTickets(true)
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/tickets`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch tickets')
      }

      setTickets(Array.isArray(data.tickets) ? data.tickets : [])
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
      toast.error(error.message || 'Failed to fetch tickets')
    } finally {
      setIsLoadingTickets(false)
    }
  }

  const handleToggleGetAllTickets = async () => {
    const nextValue = !showAllTickets
    setShowAllTickets(nextValue)
    if (nextValue) {
      await fetchTickets()
    }
  }

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) {
      return
    }

    try {
      setDeletingTicketId(ticketId)
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/tickets/${ticketId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete ticket')
      }

      setTickets(prev => prev.filter(ticket => ticket._id !== ticketId))
      toast.success('Ticket deleted successfully')
    } catch (error) {
      console.error('Failed to delete ticket:', error)
      toast.error(error.message || 'Failed to delete ticket')
    } finally {
      setDeletingTicketId('')
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || [])

    if (!files.length) return

    const validFiles = []
    const nextPreviewUrls = []

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        return
      }

      validFiles.push(file)
      nextPreviewUrls.push(URL.createObjectURL(file))
    })

    if (!validFiles.length) {
      toast.error('Please select valid image files under 5MB')
      e.target.value = ''
      return
    }

    const remainingSlots = Math.max(0, 5 - imageFiles.length)
    const filesToAdd = validFiles.slice(0, remainingSlots)
    const previewsToAdd = nextPreviewUrls.slice(0, remainingSlots)

    nextPreviewUrls.slice(remainingSlots).forEach((url) => URL.revokeObjectURL(url))

    if (!filesToAdd.length) {
      toast.error('You can upload up to 5 images only')
      e.target.value = ''
      return
    }

    if (filesToAdd.length < validFiles.length) {
      toast.error('Only 5 images are allowed per ticket')
    }

    setImageFiles(prev => [...prev, ...filesToAdd])
    setPreviewUrls(prev => [...prev, ...previewsToAdd])
    e.target.value = ''
  }

  const removeImage = (indexToRemove) => {
    const previewUrl = previewUrls[indexToRemove]
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setImageFiles(prev => prev.filter((_, index) => index !== indexToRemove))
    setPreviewUrls(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const clearImages = () => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setImageFiles([])
    setPreviewUrls([])
  }

  const getTicketImages = (ticket) => {
    if (Array.isArray(ticket.images) && ticket.images.length) {
      return ticket.images
    }

    if (ticket.imageUrl) {
      return [{ url: ticket.imageUrl, key: ticket.imageKey || ticket.imageUrl }]
    }

    return []
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!formData.department) {
      toast.error('Department is required')
      return
    }

    if (!formData.description.trim()) {
      toast.error('Description is required')
      return
    }

    try {
      setIsSubmitting(true)

      const payload = new FormData()
      payload.append('department', formData.department)
      payload.append('title', formData.title.trim())
      payload.append('description', formData.description.trim())
      imageFiles.forEach((file) => {
        payload.append('images', file)
      })

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/tickets`, {
        method: 'POST',
        body: payload,
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to raise ticket')
      }

      toast.success('Ticket raised successfully')
      setFormData({ department: '', title: '', description: '' })
      clearImages()
    } catch (error) {
      console.error('Failed to raise ticket:', error)
      toast.error(error.message || 'Failed to raise ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Layout title={"Tickets"}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Raise a Ticket</h1>
              <p className="text-sm text-gray-600 mt-1">
                Share your issue details below. You can optionally attach one image.
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleGetAllTickets}
              className="shrink-0 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              {showAllTickets ? 'Raise Ticket' : 'Get All Tickets'}
            </button>
          </div>

          {showAllTickets ? (
            <div className="mt-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">All Tickets</h2>
                <button
                  type="button"
                  onClick={fetchTickets}
                  disabled={isLoadingTickets}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {isLoadingTickets ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {isLoadingTickets ? (
                <p className="text-sm text-gray-500">Loading tickets...</p>
              ) : tickets.length === 0 ? (
                <p className="text-sm text-gray-500">No tickets found.</p>
              ) : (
                <div className="space-y-3 max-h-[480px] overflow-auto pr-1">
                  {tickets.map(ticket => (
                    <div
                      key={ticket._id}
                      className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold text-gray-900">{ticket.title}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {ticket.department} • {ticket.status} • {formatDateTime(ticket.createdAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteTicket(ticket._id)}
                          disabled={deletingTicketId === ticket._id}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingTicketId === ticket._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>

                      <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>

                      {getTicketImages(ticket).length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {getTicketImages(ticket).map((image, index) => (
                            <button
                              key={image.key || `${ticket._id}-${index}`}
                              type="button"
                              onClick={() => setSelectedTicketImage({
                                url: image.url,
                                title: ticket.title
                              })}
                              className="block"
                            >
                              <img
                                src={image.url}
                                alt={`${ticket.title} ${index + 1}`}
                                className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white"
                  required
                >
                  <option value="">Select department</option>
                  <option value="IT">IT</option>
                  <option value="operations">Operations</option>
                  <option value="finance">Finance</option>
                </select>
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  id="title"
                  name="title"
                  type="text"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter ticket title"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  maxLength={120}
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your issue in detail"
                  rows={6}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none resize-y focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                  Images (optional)
                </label>
                <input
                  id="image"
                  name="images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                />
                <p className="mt-2 text-xs text-gray-500">You can upload up to 5 images.</p>

                {previewUrls.length > 0 && (
                  <div className="mt-4 rounded-xl border border-gray-200 p-3 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {previewUrls.map((previewUrl, index) => (
                        <div key={`${previewUrl}-${index}`} className="rounded-lg border border-gray-200 bg-white p-2">
                          <img
                            src={previewUrl}
                            alt={`Ticket attachment preview ${index + 1}`}
                            className="h-28 w-full rounded-lg object-cover"
                          />
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <p className="truncate text-xs text-gray-500">{imageFiles[index]?.name}</p>
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Raise Ticket'}
              </button>
            </form>
          )}
        </div>
      </div>

      {selectedTicketImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setSelectedTicketImage(null)}
        >
          <div
            className="relative max-w-3xl rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedTicketImage(null)}
              className="absolute right-3 top-3 rounded-lg bg-black/70 px-3 py-1 text-sm font-semibold text-white"
            >
              Close
            </button>
            <img
              src={selectedTicketImage.url}
              alt={selectedTicketImage.title}
              className="max-h-[80vh] w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </Layout>
  )
}
