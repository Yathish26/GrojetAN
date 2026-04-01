import React, { useState, useEffect } from 'react'
import { FolderKanban, Layers3, Plus, Ticket, X, Loader, Eye, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../Components/Layout'

const initialGroups = []

export default function TicketGroups() {
  const [groups, setGroups] = useState(initialGroups)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingGroups, setIsLoadingGroups] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    emails: []
  })
  const [emailInput, setEmailInput] = useState('')
  const [viewGroup, setViewGroup] = useState(null)
  const [editGroup, setEditGroup] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(null)

  // Fetch ticket groups on mount
  useEffect(() => {
    fetchGroups()
  }, [])

  const fetchGroups = async () => {
    try {
      setIsLoadingGroups(true)
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/tickets/groups/list`, {
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to fetch groups')
      }

      setGroups(Array.isArray(data.groups) ? data.groups : [])
    } catch (error) {
      console.error('Failed to fetch groups:', error)
      toast.error(error.message || 'Failed to fetch groups')
    } finally {
      setIsLoadingGroups(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddEmail = () => {
    if (!emailInput.trim()) {
      toast.error('Please enter an email')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (formData.emails.includes(emailInput.trim())) {
      toast.error('This email is already added')
      return
    }

    setFormData(prev => ({
      ...prev,
      emails: [...prev.emails, emailInput.trim()]
    }))
    setEmailInput('')
  }

  const handleRemoveEmail = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      emails: prev.emails.filter((_, index) => index !== indexToRemove)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast.error('Group name is required')
      return
    }

    if (formData.emails.length === 0) {
      toast.error('Please add at least one email')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/tickets/groups/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          department: formData.name.trim(),
          description: '',
          emails: formData.emails
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to create group')
      }

      toast.success('Ticket group created successfully')
      setFormData({
        name: '',
        emails: []
      })
      setShowModal(false)
      await fetchGroups()
    } catch (error) {
      console.error('Failed to create group:', error)
      toast.error(error.message || 'Failed to create group')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleViewGroup = (group) => {
    setViewGroup(group)
  }

  const handleEditGroup = (group) => {
    setEditGroup(group)
    setIsEditing(true)
  }

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group?')) {
      return
    }

    try {
      setIsDeleting(groupId)
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/tickets/groups/${groupId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete group')
      }

      toast.success('Group deleted successfully')
      await fetchGroups()
    } catch (error) {
      console.error('Failed to delete group:', error)
      toast.error(error.message || 'Failed to delete group')
    } finally {
      setIsDeleting(null)
    }
  }

  const handleUpdateGroup = async (e) => {
    e.preventDefault()

    if (!editGroup.name.trim()) {
      toast.error('Group name is required')
      return
    }

    if (editGroup.emails.length === 0) {
      toast.error('Please add at least one email')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/tickets/groups/${editGroup._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editGroup.name.trim(),
          department: editGroup.name.trim(),
          emails: editGroup.emails
        }),
        credentials: 'include'
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update group')
      }

      toast.success('Group updated successfully')
      setEditGroup(null)
      setIsEditing(false)
      await fetchGroups()
    } catch (error) {
      console.error('Failed to update group:', error)
      toast.error(error.message || 'Failed to update group')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditInputChange = (e) => {
    const { name, value } = e.target
    setEditGroup(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleEditAddEmail = () => {
    if (!emailInput.trim()) {
      toast.error('Please enter an email')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      toast.error('Please enter a valid email address')
      return
    }

    if (editGroup.emails.includes(emailInput.trim())) {
      toast.error('This email is already added')
      return
    }

    setEditGroup(prev => ({
      ...prev,
      emails: [...prev.emails, emailInput.trim()]
    }))
    setEmailInput('')
  }

  const handleEditRemoveEmail = (indexToRemove) => {
    setEditGroup(prev => ({
      ...prev,
      emails: prev.emails.filter((_, index) => index !== indexToRemove)
    }))
  }

  return (
    <Layout title={'Ticket Groups'}>
      <div className="min-h-full bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.12),_transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eefbf5_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur-sm">
            <div className="border-b border-emerald-100 bg-emerald-600 px-6 py-8 text-white sm:px-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-2xl">
                  <h1 className="text-2xl font-semibold">Ticket Groups</h1>
                  <p className="mt-3 text-sm leading-6 text-emerald-50/90 sm:text-base">
                    Organize tickets into clear operational groups so your team can route, monitor, and resolve issues faster.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-900"
                >
                  <Layers3 size={18} />
                  Create Groups
                </button>
              </div>
            </div>

            <div className="grid gap-5 border-b border-slate-100 bg-slate-50/70 px-6 py-5 sm:grid-cols-3 sm:px-8">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Total Groups</p>
                <p className="mt-3 text-3xl font-black text-slate-900">{groups.length}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p>
                <p className="mt-3 text-lg font-bold text-slate-900">
                  {groups.length === 0 ? 'No groups yet' : 'Groups available'}
                </p>
              </div>
            </div>

            <div className="px-6 py-10 sm:px-8 sm:py-12">
              {isLoadingGroups ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader className="mx-auto h-8 w-8 animate-spin text-emerald-600" />
                    <p className="mt-3 text-sm text-gray-600">Loading groups...</p>
                  </div>
                </div>
              ) : groups.length === 0 ? (
                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-8 text-center sm:p-12">
                  <div className="mx-auto flex max-w-xl flex-col items-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
                      <FolderKanban size={34} />
                    </div>

                    <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                      No groups available
                    </h2>
                    <p className="mt-3 max-w-md text-sm leading-7 text-slate-600 sm:text-base">
                      No ticket groups have been created yet.
                    </p>

                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      className="mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                    >
                      <Plus size={18} />
                      Ticket Groups
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {groups.map(group => (
                    <article
                      key={group._id}
                      className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h2 className="text-lg font-bold text-slate-900">{group.name}</h2>
                          <div className="mt-3 flex items-center gap-1">
                            <span className="text-xs font-semibold text-slate-500">{group.emails.length} contacts</span>
                          </div>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewGroup(group)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-100 transition"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          type="button"
                          onClick={() => handleEditGroup(group)}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-600 hover:bg-amber-100 transition"
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGroup(group._id)}
                          disabled={isDeleting === group._id}
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-60"
                        >
                          <Trash2 size={14} />
                          {isDeleting === group._id ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Ticket Group Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Create Ticket Group</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-lg text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900">Group Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., IT Support"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>



              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-900">Add Email Addresses</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                    placeholder="name@example.com"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Email List */}
              {formData.emails.length > 0 && (
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Added Emails ({formData.emails.length})</p>
                  <div className="space-y-2">
                    {formData.emails.map((email, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                        <span className="text-sm text-slate-900">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(index)}
                          className="text-slate-500 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isSubmitting && <Loader size={16} className="animate-spin" />}
                  {isSubmitting ? 'Creating...' : 'Create Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Ticket Group Modal */}
      {viewGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Group Details</h2>
              <button
                type="button"
                onClick={() => setViewGroup(null)}
                className="rounded-lg text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Group Name</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{viewGroup.name}</p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Email Addresses ({viewGroup.emails.length})</p>
                <div className="mt-2 space-y-2">
                  {viewGroup.emails.map((email, index) => (
                    <div key={index} className="rounded-lg bg-slate-50 px-3 py-2">
                      <p className="text-sm text-slate-700">{email}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setViewGroup(null)}
                  className="w-full rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Ticket Group Modal */}
      {isEditing && editGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <h2 className="text-lg font-bold text-slate-900">Edit Group</h2>
              <button
                type="button"
                onClick={() => {
                  setEditGroup(null)
                  setIsEditing(false)
                }}
                className="rounded-lg text-slate-500 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateGroup} className="space-y-4 p-6">
              {/* Group Name */}
              <div>
                <label className="block text-sm font-semibold text-slate-900">Group Name</label>
                <input
                  type="text"
                  name="name"
                  value={editGroup.name}
                  onChange={handleEditInputChange}
                  placeholder="e.g., IT Support"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-slate-900">Add Email Addresses</label>
                <div className="mt-2 flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleEditAddEmail()}
                    placeholder="name@example.com"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleEditAddEmail}
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Email List */}
              {editGroup.emails.length > 0 && (
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">Email Addresses ({editGroup.emails.length})</p>
                  <div className="space-y-2">
                    {editGroup.emails.map((email, index) => (
                      <div key={index} className="flex items-center justify-between rounded-lg bg-white px-3 py-2">
                        <span className="text-sm text-slate-900">{email}</span>
                        <button
                          type="button"
                          onClick={() => handleEditRemoveEmail(index)}
                          className="text-slate-500 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditGroup(null)
                    setIsEditing(false)
                  }}
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isSubmitting && <Loader size={16} className="animate-spin" />}
                  {isSubmitting ? 'Updating...' : 'Update Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  )
}
