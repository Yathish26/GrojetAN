import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import Layout from '../Components/Layout'
import { VERSION } from '../../version'

export default function Tickets() {
  const [formData, setFormData] = useState({
    department: '',
    title: '',
    description: ''
  })
  const [imageFiles, setImageFiles] = useState([])
  const [previewUrls, setPreviewUrls] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAllTickets, setShowAllTickets] = useState(true)
  const [tickets, setTickets] = useState([])
  const [isLoadingTickets, setIsLoadingTickets] = useState(false)
  const [resolvingTicketId, setResolvingTicketId] = useState('')
  const [deletingTicketId, setDeletingTicketId] = useState('')
  const [expandedTicketId, setExpandedTicketId] = useState('')
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState('all')
  const [selectedTicketImage, setSelectedTicketImage] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [resolveImageFiles, setResolveImageFiles] = useState([])
  const [resolvePreviewUrls, setResolvePreviewUrls] = useState([])
  const [departments, setDepartments] = useState([])
  const [currentAdminRole] = useState(() => {
    try {
      const cachedAdmin = localStorage.getItem('adminUser')
      return cachedAdmin ? JSON.parse(cachedAdmin)?.role || '' : ''
    } catch {
      return ''
    }
  })

  // Fetch departments on mount
  useEffect(() => {
    fetchDepartments()
    if (showAllTickets) {
      fetchTickets()
    }
  }, [])

  const fetchDepartments = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/tickets/groups/list`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch departments')
      }

      const uniqueDepartments = [...new Set(
        (Array.isArray(data.groups) ? data.groups : [])
          .map(group => (group?.department || group?.name || '').trim())
          .filter(Boolean)
      )]

      setDepartments(uniqueDepartments)

      setFormData(prev => {
        if (prev.department || uniqueDepartments.length === 0) {
          return prev
        }

        return {
          ...prev,
          department: uniqueDepartments[0]
        }
      })
    } catch (error) {
      console.error('Failed to fetch departments:', error)
      toast.error(error.message || 'Failed to fetch departments')
    }
  }

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

  const formatStatusLabel = (status) => {
    if (!status) return 'Open'

    return status
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const getStatusClasses = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200'
      case 'in_progress':
        return 'bg-amber-100 text-amber-700 border border-amber-200'
      case 'closed':
        return 'bg-slate-200 text-slate-700 border border-slate-300'
      default:
        return 'bg-blue-100 text-blue-700 border border-blue-200'
    }
  }

  const fetchTickets = async (departmentFilter = selectedDepartmentFilter) => {
    try {
      setIsLoadingTickets(true)
      const query = new URLSearchParams()

      if (departmentFilter && departmentFilter !== 'all') {
        query.set('department', departmentFilter)
      }

      const requestUrl = query.toString()
        ? `${import.meta.env.VITE_SERVER}/admin/tickets?${query.toString()}`
        : `${import.meta.env.VITE_SERVER}/admin/tickets`

      const response = await fetch(requestUrl, {
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

  const handleDepartmentFilterChange = async (e) => {
    const nextDepartment = e.target.value
    setSelectedDepartmentFilter(nextDepartment)

    if (showAllTickets) {
      await fetchTickets(nextDepartment)
    }
  }

  const handleResolveTicket = async (ticketId) => {
    if (!window.confirm('Mark this ticket as resolved?')) {
      return
    }

    try {
      setResolvingTicketId(ticketId)
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'resolved' }),
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to resolve ticket')
      }

      setTickets(prev => prev.map(ticket => (
        ticket._id === ticketId ? data.ticket : ticket
      )))
      toast.success('Ticket resolved successfully')
    } catch (error) {
      console.error('Failed to resolve ticket:', error)
      toast.error(error.message || 'Failed to resolve ticket')
    } finally {
      setResolvingTicketId('')
    }
  }

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Delete this ticket permanently?')) {
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
      if (expandedTicketId === ticketId) {
        setExpandedTicketId('')
        setReplyText('')
      }
      toast.success('Ticket deleted successfully')
    } catch (error) {
      console.error('Failed to delete ticket:', error)
      toast.error(error.message || 'Failed to delete ticket')
    } finally {
      setDeletingTicketId('')
    }
  }

  const clearResolveImages = () => {
    resolvePreviewUrls.forEach(url => URL.revokeObjectURL(url))
    setResolveImageFiles([])
    setResolvePreviewUrls([])
  }

  const handleResolveImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const validFiles = []
    const nextPreviews = []
    files.forEach(file => {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) return
      validFiles.push(file)
      nextPreviews.push(URL.createObjectURL(file))
    })
    if (!validFiles.length) {
      toast.error('Please select valid image files under 5MB')
      e.target.value = ''
      return
    }
    setResolveImageFiles(prev => [...prev, ...validFiles])
    setResolvePreviewUrls(prev => [...prev, ...nextPreviews])
    e.target.value = ''
  }

  const removeResolveImage = (index) => {
    const url = resolvePreviewUrls[index]
    if (url) URL.revokeObjectURL(url)
    setResolveImageFiles(prev => prev.filter((_, i) => i !== index))
    setResolvePreviewUrls(prev => prev.filter((_, i) => i !== index))
  }

  const toggleTicketDetails = (ticketId) => {
    if (ticketId === expandedTicketId) {
      setExpandedTicketId('')
      setReplyText('')
      clearResolveImages()
      return
    }

    const ticket = tickets.find(item => item._id === ticketId)
    setExpandedTicketId(ticketId)
    setReplyText(ticket?.adminNote || '')
  }

  const handleReplySubmit = async (ticketId, resolve = false) => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply before submitting')
      return
    }

    try {
      setResolvingTicketId(ticketId)
      const payload = new FormData()
      payload.append('adminNote', replyText.trim())
      if (resolve) payload.append('status', 'resolved')
      resolveImageFiles.forEach(file => payload.append('images', file))

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'x-admin-version': VERSION },
        credentials: 'include',
        body: payload
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update ticket')
      }

      setTickets(prev => prev.map(ticket => ticket._id === ticketId ? data.ticket : ticket))
      setReplyText('')
      clearResolveImages()

      if (resolve) {
        toast.success('Ticket resolved with reply')
      } else {
        toast.success('Reply added to ticket')
      }
    } catch (error) {
      console.error('Failed to update ticket:', error)
      toast.error(error.message || 'Failed to update ticket')
    } finally {
      setResolvingTicketId('')
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

    setImageFiles(prev => [...prev, ...validFiles])
    setPreviewUrls(prev => [...prev, ...nextPreviewUrls])
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

  const openTicketImageViewer = (ticket, startIndex = 0) => {
    const images = getTicketImages(ticket)

    if (!images.length) {
      return
    }

    setSelectedTicketImage({
      images,
      index: startIndex,
      title: ticket.title
    })
  }

  const changeSelectedTicketImage = (direction) => {
    setSelectedTicketImage(prev => {
      if (!prev || !Array.isArray(prev.images) || prev.images.length <= 1) {
        return prev
      }

      const nextIndex = (prev.index + direction + prev.images.length) % prev.images.length

      return {
        ...prev,
        index: nextIndex
      }
    })
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

    try {
      setIsSubmitting(true)

      const payload = new FormData()
      payload.append('department', formData.department)
      payload.append('title', formData.title.trim())
      if (formData.description.trim()) {
        payload.append('description', formData.description.trim())
      }
      imageFiles.forEach((file) => {
        payload.append('images', file)
      })

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/tickets`, {
        method: 'POST',
        headers: { 'x-admin-version': VERSION },
        body: payload,
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to raise ticket')
      }

      toast.success('Ticket raised successfully')
      setFormData({
        department: departments[0] || '',
        title: '',
        description: ''
      })
      clearImages()
      setShowAllTickets(true)
      await fetchTickets()
    } catch (error) {
      console.error('Failed to raise ticket:', error)
      toast.error(error.message || 'Failed to raise ticket. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentTicketImage = selectedTicketImage?.images?.[selectedTicketImage.index] || null
  const activeTicket = tickets.find(ticket => ticket._id === expandedTicketId) || null

  return (
    <Layout title={"Tickets"}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Raise a Ticket</h1>
              <p className="text-sm text-gray-600 mt-1">
                Share your issue details below. You can optionally attach the images.
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
              <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-semibold text-gray-900">All Tickets</h2>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <select
                    value={selectedDepartmentFilter}
                    onChange={handleDepartmentFilterChange}
                    className="min-w-[180px] rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => fetchTickets()}
                    disabled={isLoadingTickets}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {isLoadingTickets ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
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
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-semibold text-gray-900">{ticket.title}</h3>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(ticket.status)}`}>
                              {formatStatusLabel(ticket.status)}
                            </span>
                            {getTicketImages(ticket).length > 0 && (
                              <span
                                className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-600"
                                title="Attachment available"
                                aria-label="Attachment available"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  className="h-3.5 w-3.5"
                                  aria-hidden="true"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.44 11.05 12.25 20.24a6 6 0 0 1-8.49-8.49l9.2-9.19a4 4 0 0 1 5.65 5.66l-9.2 9.19a2 2 0 0 1-2.82-2.83l8.48-8.48" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            {ticket.department} • Raised {formatDateTime(ticket.createdAt)}
                          </p>
                          {ticket.resolvedAt && (
                            <p className="mt-1 text-xs font-medium text-emerald-700">
                              Resolved on {formatDateTime(ticket.resolvedAt)}
                              {ticket.resolvedBy?.name ? ` by ${ticket.resolvedBy.name}` : ''}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleTicketDetails(ticket._id)}
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
                          >
                            View Ticket
                          </button>
                          {currentAdminRole === 'super_admin' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTicket(ticket._id)}
                              disabled={deletingTicketId === ticket._id}
                              className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {deletingTicketId === ticket._id ? 'Deleting...' : 'Delete'}
                            </button>
                          )}
                        </div>
                      </div>

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
                  disabled={departments.length === 0}
                >
                  {departments.length === 0 && (
                    <option value="">No departments available</option>
                  )}
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
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
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your issue in detail"
                  rows={6}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none resize-y focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
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
                <p className="mt-2 text-xs text-gray-500">You can upload multiple images. Each image must be under 5MB.</p>

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

      {activeTicket && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4 py-6"
          onClick={() => {
            setExpandedTicketId('')
            setReplyText('')
            clearResolveImages()
          }}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setExpandedTicketId('')
                setReplyText('')
                clearResolveImages()
              }}
              className="absolute right-4 top-4 rounded-lg bg-black/70 px-3 py-1 text-sm font-semibold text-white"
            >
              Close
            </button>

            <div className="pr-20">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900">{activeTicket.title || '-'}</h2>
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(activeTicket.status)}`}>
                  {formatStatusLabel(activeTicket.status)}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {activeTicket.department} • Raised {formatDateTime(activeTicket.createdAt)}
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Title</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{activeTicket.title || '-'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Department</p>
                <p className="mt-2 text-sm font-semibold text-gray-900">{activeTicket.department || '-'}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Status</p>
                <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatusClasses(activeTicket.status)}`}>
                  {formatStatusLabel(activeTicket.status)}
                </span>
              </div>
            </div>

            <div className="mt-4 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Raised By</p>
                <p className="mt-1 text-sm text-gray-900">{activeTicket.raisedBy?.name || '-'}</p>
                <p className="text-xs text-gray-500">{activeTicket.raisedBy?.email || '-'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Timeline</p>
                <p className="mt-1 text-sm text-gray-900">Created: {formatDateTime(activeTicket.createdAt)}</p>
                <p className="mt-1 text-sm text-gray-900">Resolved: {formatDateTime(activeTicket.resolvedAt)}</p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {activeTicket.description || 'No description provided.'}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">Solutions Note</p>
              <p className="mt-2 text-sm text-gray-700">
                {activeTicket.adminNote || 'No reply yet.'}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Attachments</p>
              {getTicketImages(activeTicket).length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {getTicketImages(activeTicket).map((image, index) => (
                    <button
                      key={image.key || `${activeTicket._id}-${index}`}
                      type="button"
                      onClick={() => openTicketImageViewer(activeTicket, index)}
                      className="block"
                    >
                      <img
                        src={image.url}
                        alt={`${activeTicket.title} ${index + 1}`}
                        className="h-20 w-20 rounded-lg border border-gray-200 object-cover"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-gray-500">No attachments provided.</p>
              )}
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Resolve Issue</p>
              <p className="text-xs text-gray-500">Add a note and mark the ticket resolved.</p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                placeholder="Enter resolution comment"
                className="mt-2 w-full rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
              />
              <div className="mt-3">
                <p className="text-xs font-medium text-gray-600 mb-1">Attach Images <span className="text-gray-400">(optional)</span></p>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleResolveImageChange}
                  className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
                />
                <p className="mt-1 text-xs text-gray-400">Each image must be under 5MB.</p>
                {resolvePreviewUrls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {resolvePreviewUrls.map((url, index) => (
                      <div key={`${url}-${index}`} className="relative">
                        <img src={url} alt={`Resolution attachment ${index + 1}`} className="h-16 w-16 rounded-lg border border-gray-200 object-cover" />
                        <button
                          type="button"
                          onClick={() => removeResolveImage(index)}
                          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {activeTicket.status !== 'resolved' && activeTicket.status !== 'closed' && (
                  <button
                    type="button"
                    onClick={() => handleReplySubmit(activeTicket._id, true)}
                    disabled={resolvingTicketId === activeTicket._id || !replyText.trim()}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Resolve Ticket
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTicketImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setSelectedTicketImage(null)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-white p-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedTicketImage(null)}
              className="absolute right-3 top-3 rounded-lg bg-black/70 px-3 py-1 text-sm font-semibold text-white"
            >
              Close
            </button>
            {currentTicketImage && (
              <>
                <div className="flex items-center justify-between gap-3 pb-3 pr-20">
                  <p className="text-sm font-semibold text-gray-900">{selectedTicketImage.title}</p>
                  {selectedTicketImage.images.length > 1 && (
                    <p className="text-xs font-medium text-gray-500">
                      {selectedTicketImage.index + 1} / {selectedTicketImage.images.length}
                    </p>
                  )}
                </div>

                <div className="relative flex items-center justify-center">
                  {selectedTicketImage.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => changeSelectedTicketImage(-1)}
                      className="absolute left-2 z-10 rounded-full bg-black/70 p-2 text-white hover:bg-black/80"
                      aria-label="Previous image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m15 18-6-6 6-6" />
                      </svg>
                    </button>
                  )}

                  <img
                    src={currentTicketImage.url}
                    alt={`${selectedTicketImage.title} ${selectedTicketImage.index + 1}`}
                    className="max-h-[80vh] w-full rounded-xl object-contain"
                  />

                  {selectedTicketImage.images.length > 1 && (
                    <button
                      type="button"
                      onClick={() => changeSelectedTicketImage(1)}
                      className="absolute right-2 z-10 rounded-full bg-black/70 p-2 text-white hover:bg-black/80"
                      aria-label="Next image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 6 6-6 6" />
                      </svg>
                    </button>
                  )}
                </div>

                {selectedTicketImage.images.length > 1 && (
                  <div className="mt-4 flex justify-center gap-2">
                    {selectedTicketImage.images.map((image, index) => (
                      <button
                        key={image.key || `${image.url}-${index}`}
                        type="button"
                        onClick={() => setSelectedTicketImage(prev => prev ? { ...prev, index } : prev)}
                        className={`h-2.5 w-2.5 rounded-full ${index === selectedTicketImage.index ? 'bg-emerald-600' : 'bg-gray-300'}`}
                        aria-label={`View image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  )
}
