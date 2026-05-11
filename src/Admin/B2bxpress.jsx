import React, { useState, useEffect, useRef } from 'react'
import Layout from '../Components/Layout'
import { GoogleMap, AddressSearch } from '../Components/GoogleMapComponents'

const PACKAGE_TYPE_OPTIONS = ['Documents', 'Food', 'Clothes', 'Electronics', 'Others']
const PACKAGE_TYPE_VALUE_MAP = {
  Documents: 'documents',
  Food: 'food',
  Clothes: 'clothes',
  Electronics: 'electronics',
  Others: 'others'
}
const PACKAGE_SIZE_OPTIONS = ['upto 1kg', '1-3 Kg', '3-5 Kg', '5-10 Kg']
const PACKAGE_SIZE_VALUE_MAP = {
  'upto 1kg': 'Upto 1 kg',
  '1-3 Kg': '1 - 3 kg',
  '3-5 Kg': '3 - 5 kg',
  '5-10 Kg': '5 - 10 kg'
}

export default function B2bxpress() {
  const [businessUsers, setBusinessUsers] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [dropLatitude, setDropLatitude] = useState('')
  const [dropLongitude, setDropLongitude] = useState('')
  const [pickupAddress, setPickupAddress] = useState('')
  const [dropAddress, setDropAddress] = useState('')
  const [senderName, setSenderName] = useState('')
  const [phoneNo, setPhoneNo] = useState('')
  const [landmark, setLandmark] = useState('')
  const [dropSenderName, setDropSenderName] = useState('')
  const [dropPhoneNo, setDropPhoneNo] = useState('')
  const [dropLandmark, setDropLandmark] = useState('')
  const [packageType, setPackageType] = useState('')
  const [packageSize, setPackageSize] = useState('')
  const [isFragile, setIsFragile] = useState(false)
  const [pickupNotes, setPickupNotes] = useState('')
  const [dropNotes, setDropNotes] = useState('')
  const [pickupMarker, setPickupMarker] = useState(null)
  const [dropMarker, setDropMarker] = useState(null)
  const [pickupMap, setPickupMap] = useState(null)
  const [dropMap, setDropMap] = useState(null)
  const [estimation, setEstimation] = useState(null)
  const [isEstimating, setIsEstimating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [savePickupAddress, setSavePickupAddress] = useState(false)
  const [isSavingPickupAddress, setIsSavingPickupAddress] = useState(false)
  const [pickupAddressSaveMessage, setPickupAddressSaveMessage] = useState('')
  const [saveDropAddress, setSaveDropAddress] = useState(false)
  const [isSavingDropAddress, setIsSavingDropAddress] = useState(false)
  const [dropAddressSaveMessage, setDropAddressSaveMessage] = useState('')
  const [savedAddresses, setSavedAddresses] = useState([])
  const [isLoadingSavedAddresses, setIsLoadingSavedAddresses] = useState(false)
  const [deletingAddressId, setDeletingAddressId] = useState('')
  const pickupSectionRef = useRef(null)
  const dropSectionRef = useRef(null)

  const sanitizePhoneNumber = (value) => value.replace(/\D/g, '').slice(0, 10)
  const sanitizeSenderName = (value) => value.replace(/[^A-Za-z.\s]/g, '')

  const selectedBusinessUser = businessUsers.find((user) => user._id === selectedId)

  const loadSavedAddresses = async (userId) => {
    if (!userId) {
      setSavedAddresses([])
      return
    }

    setIsLoadingSavedAddresses(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/users/${userId}`, {
        credentials: 'include'
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        setSavedAddresses([])
        return
      }

      setSavedAddresses(data.user?.addresses || [])
    } catch (error) {
      console.error('Load saved addresses error:', error)
      setSavedAddresses([])
    } finally {
      setIsLoadingSavedAddresses(false)
    }
  }

  const buildPayload = () => ({
    userId: selectedId,
    pickup: {
      coordinates: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      address: pickupAddress.trim(),
      name: senderName.trim(),
      phone: phoneNo,
      landmark: landmark.trim()
    },
    drop: {
      coordinates: {
        latitude: parseFloat(dropLatitude),
        longitude: parseFloat(dropLongitude)
      },
      address: dropAddress.trim(),
      name: dropSenderName.trim(),
      phone: dropPhoneNo,
      landmark: dropLandmark.trim()
    },
    packageDetails: {
      category: PACKAGE_TYPE_VALUE_MAP[packageType] || '',
      size: PACKAGE_SIZE_VALUE_MAP[packageSize] || '',
      fragile: isFragile,
      instructions: isFragile ? 'Handle with care' : '',
      pickupNotes: pickupNotes.trim(),
      dropNotes: dropNotes.trim()
    },
    schedule: {
      scheduledAt: 'now'
    },
    pricing: {
      finalCost: estimation?.finalCost ?? 0,
      estimatedCost: estimation?.estimatedCost ?? 0,
      eta: estimation?.eta ?? 0,
      distance: estimation?.distance ?? 0,
      paymentMethod: 'cod'
    }
  })

  const validateEstimationInputs = () => {
    if (!selectedId) return 'Please select a business user'
    if (!latitude || !longitude || !dropLatitude || !dropLongitude) return 'Please select both pickup and drop locations'
    if (!pickupAddress.trim() || !dropAddress.trim()) return 'Please enter both pickup and drop addresses'
    if (!packageType || !packageSize) return 'Please select package type and size'
    return ''
  }

  const validateOrderInputs = () => {
    const estimationError = validateEstimationInputs()
    if (estimationError) return estimationError
    if (!senderName.trim() || !dropSenderName.trim()) return 'Please enter sender names for pickup and drop'
    if (phoneNo.length !== 10 || dropPhoneNo.length !== 10) return 'Please enter valid 10-digit phone numbers'
    if (!estimation) return 'Please get estimation before creating the order'
    return ''
  }

  const validatePickupSaveInputs = () => {
    if (!selectedId) return 'Please select a business user before saving the pickup address'
    if (!latitude || !longitude) return 'Please select a pickup location on the map before saving the address'
    if (!pickupAddress.trim()) return 'Please enter the pickup address before saving'
    return ''
  }

  const validateDropSaveInputs = () => {
    if (!selectedId) return 'Please select a business user before saving the drop address'
    if (!dropLatitude || !dropLongitude) return 'Please select a drop location on the map before saving the address'
    if (!dropAddress.trim()) return 'Please enter the drop address before saving'
    return ''
  }

  const handleSavePickupAddressChange = async (event) => {
    if (!event.target.checked) {
      setSavePickupAddress(false)
      setPickupAddressSaveMessage('')
      return
    }

    const validationMessage = validatePickupSaveInputs()
    if (validationMessage) {
      alert(validationMessage)
      return
    }

    setIsSavingPickupAddress(true)
    setPickupAddressSaveMessage('')

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/xpress/users/${selectedId}/pickup-address`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pickup: {
            address: pickupAddress.trim(),
            landmark: landmark.trim(),
            phone: phoneNo,
            coordinates: {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude)
            }
          }
        })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        alert(data.message || 'Failed to save pickup address')
        setSavePickupAddress(false)
        return
      }

      setSavePickupAddress(true)
      setPickupAddressSaveMessage('Pickup address saved to this business user')
      loadSavedAddresses(selectedId)
    } catch (error) {
      console.error('Save pickup address error:', error)
      alert('Failed to save pickup address. Please try again.')
      setSavePickupAddress(false)
    } finally {
      setIsSavingPickupAddress(false)
    }
  }

  const handleSaveDropAddressChange = async (event) => {
    if (!event.target.checked) {
      setSaveDropAddress(false)
      setDropAddressSaveMessage('')
      return
    }

    const validationMessage = validateDropSaveInputs()
    if (validationMessage) {
      alert(validationMessage)
      return
    }

    setIsSavingDropAddress(true)
    setDropAddressSaveMessage('')

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/xpress/users/${selectedId}/drop-address`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          drop: {
            address: dropAddress.trim(),
            landmark: dropLandmark.trim(),
            phone: dropPhoneNo,
            coordinates: {
              latitude: parseFloat(dropLatitude),
              longitude: parseFloat(dropLongitude)
            }
          }
        })
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        alert(data.message || 'Failed to save drop address')
        setSaveDropAddress(false)
        return
      }

      setSaveDropAddress(true)
      setDropAddressSaveMessage('Drop address saved to this business user')
      loadSavedAddresses(selectedId)
    } catch (error) {
      console.error('Save drop address error:', error)
      alert('Failed to save drop address. Please try again.')
      setSaveDropAddress(false)
    } finally {
      setIsSavingDropAddress(false)
    }
  }

  const handleDeleteSavedAddress = async (addressId) => {
    if (!selectedId || !addressId) {
      return
    }

    const shouldDelete = window.confirm('Delete this saved address?')
    if (!shouldDelete) {
      return
    }

    setDeletingAddressId(addressId)
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/xpress/users/${selectedId}/addresses/${addressId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        alert(data.message || 'Failed to delete saved address')
        return
      }

      setSavedAddresses((currentAddresses) =>
        currentAddresses.filter((address) => address._id !== addressId)
      )
    } catch (error) {
      console.error('Delete saved address error:', error)
      alert('Failed to delete saved address. Please try again.')
    } finally {
      setDeletingAddressId('')
    }
  }

  const applySavedAddressToForm = (address, target = 'pickup') => {
    if (!address) {
      return
    }

    const nextLatitude = address.coordinates?.latitude != null ? Number(address.coordinates.latitude).toFixed(6) : ''
    const nextLongitude = address.coordinates?.longitude != null ? Number(address.coordinates.longitude).toFixed(6) : ''

    if (target === 'pickup') {
      setPickupAddress(address.street || '')
      setLandmark(address.landmark || '')
      setPhoneNo(address.alternateNumber || '')
      setLatitude(nextLatitude)
      setLongitude(nextLongitude)
      pickupSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

      if (pickupMap && nextLatitude && nextLongitude) {
        replaceMarker(
          pickupMarker,
          setPickupMarker,
          { lat: Number(nextLatitude), lng: Number(nextLongitude) },
          pickupMap,
          'Pickup Location'
        )
      }

      return
    }

    setDropAddress(address.street || '')
    setDropLandmark(address.landmark || '')
    setDropPhoneNo(address.alternateNumber || '')
    setDropLatitude(nextLatitude)
    setDropLongitude(nextLongitude)
    dropSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

    if (dropMap && nextLatitude && nextLongitude) {
      replaceMarker(
        dropMarker,
        setDropMarker,
        { lat: Number(nextLatitude), lng: Number(nextLongitude) },
        dropMap,
        'Drop Location'
      )
    }
  }

  const resetForm = () => {
    setSelectedId('')
    setLatitude('')
    setLongitude('')
    setDropLatitude('')
    setDropLongitude('')
    setPickupAddress('')
    setDropAddress('')
    setSenderName('')
    setPhoneNo('')
    setLandmark('')
    setDropSenderName('')
    setDropPhoneNo('')
    setDropLandmark('')
    setPackageType('')
    setPackageSize('')
    setIsFragile(false)
    setPickupNotes('')
    setDropNotes('')
    setEstimation(null)
    setSavePickupAddress(false)
    setPickupAddressSaveMessage('')
    setSaveDropAddress(false)
    setDropAddressSaveMessage('')
    setSavedAddresses([])
  }

  const getEstimation = async () => {
    const validationMessage = validateEstimationInputs()
    if (validationMessage) {
      alert(validationMessage)
      return
    }

    setIsEstimating(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/xpress/admin-estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildPayload())
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        alert(data.message || 'Failed to calculate estimate')
        return
      }

      setEstimation(data.data)
    } catch (error) {
      console.error('Estimation error:', error)
      alert('Failed to calculate estimate. Please try again.')
    } finally {
      setIsEstimating(false)
    }
  }

  const createOrder = async () => {
    const validationMessage = validateOrderInputs()
    if (validationMessage) {
      alert(validationMessage)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/xpress/orders`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildPayload())
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        alert(data.message || 'Failed to create order')
        return
      }

      alert(`Order ${data.order?.orderNumber || ''} created successfully`)
      resetForm()
    } catch (error) {
      console.error('Create order error:', error)
      alert('Failed to create order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    const fetchBusinessUsers = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/users/business`, { credentials: 'include' })
        if (response.ok) {
          const data = await response.json()
          setBusinessUsers(data.users || [])
        }
      } catch (error) {
        console.error('Error fetching business users:', error)
      }
    }
    fetchBusinessUsers()
  }, [])

  useEffect(() => {
    loadSavedAddresses(selectedId)
  }, [selectedId])

  useEffect(() => {
    setEstimation(null)
  }, [
    selectedId,
    latitude,
    longitude,
    dropLatitude,
    dropLongitude,
    pickupAddress,
    dropAddress,
    senderName,
    phoneNo,
    landmark,
    dropSenderName,
    dropPhoneNo,
    dropLandmark,
    packageType,
    packageSize,
    isFragile,
    pickupNotes,
    dropNotes
  ])

  useEffect(() => {
    setSavePickupAddress(false)
    setPickupAddressSaveMessage('')
  }, [selectedId, latitude, longitude, pickupAddress, landmark])

  useEffect(() => {
    setSaveDropAddress(false)
    setDropAddressSaveMessage('')
  }, [selectedId, dropLatitude, dropLongitude, dropAddress, dropLandmark])

  const replaceMarker = (existingMarker, setMarker, position, map, title) => {
    if (!window.google || !window.google.maps || !map) {
      return
    }

    if (existingMarker) {
      existingMarker.setMap(null)
    }

    const marker = new window.google.maps.Marker({
      position,
      map,
      title
    })

    setMarker(marker)
  }

  useEffect(() => {
    return () => {
      if (pickupMarker) {
        pickupMarker.setMap(null)
      }

      if (dropMarker) {
        dropMarker.setMap(null)
      }
    }
  }, [pickupMarker, dropMarker])

  return (
    <Layout title="B2B Xpress" description="Manage your B2B Xpress orders and settings here.">
      <div className="min-h-full bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">B2B Xpress</h1>
            <p className="mt-2 text-sm text-gray-600">
              Choose the ID you want to work with from the dropdown below.
            </p>
          </div>

          <div className="grid gap-6">
            <div>
              <label htmlFor="b2b-select-id" className="mb-2 block text-sm font-medium text-gray-700">
                Select Business User
              </label>
              <select
                id="b2b-select-id"
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
              >
                <option value="">Choose a Business User</option>
                {businessUsers.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Selected User: <span className="font-semibold text-gray-900">{selectedBusinessUser?.name || 'None'}</span>
            </div>

            {selectedId && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-5 py-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Saved Addresses</h3>
                    <p className="text-sm text-gray-600">
                      Saved for {selectedBusinessUser?.name || 'selected business user'}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
                    {savedAddresses.length} saved
                  </span>
                </div>

                {isLoadingSavedAddresses ? (
                  <p className="text-sm text-gray-500">Loading saved addresses...</p>
                ) : savedAddresses.length === 0 ? (
                  <p className="text-sm text-gray-500">No saved addresses yet for this business user.</p>
                ) : (
                  <div className="grid gap-3">
                    {savedAddresses.map((address, index) => (
                      <div
                        key={`${address.street}-${address.coordinates?.latitude || index}-${address.coordinates?.longitude || index}`}
                        onClick={() => applySavedAddressToForm(address, 'pickup')}
                        className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm transition hover:border-green-300 hover:shadow-md cursor-pointer"
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                              {address.type || 'address'}
                            </span>
                            {address.isDefault && (
                              <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                                Default
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              handleDeleteSavedAddress(address._id)
                            }}
                            disabled={deletingAddressId === address._id}
                            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingAddressId === address._id ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                        <p className="text-sm font-medium text-gray-900">{address.street}</p>
                        {address.landmark && (
                          <p className="mt-1 text-sm text-gray-600">Landmark: {address.landmark}</p>
                        )}
                        <p className="mt-1 text-sm text-gray-600">
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                        {address.alternateNumber && (
                          <p className="mt-1 text-sm text-gray-600">Phone: {address.alternateNumber}</p>
                        )}
                        {address.coordinates && (
                          <p className="mt-2 text-xs text-gray-500">
                            {Number(address.coordinates.latitude).toFixed(6)}, {Number(address.coordinates.longitude).toFixed(6)}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              applySavedAddressToForm(address, 'pickup')
                            }}
                            className="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-green-600"
                          >
                            Use for Pickup
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              applySavedAddressToForm(address, 'drop')
                            }}
                            className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-600"
                          >
                            Use for Drop
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div ref={pickupSectionRef}>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Pickup Location
              </label>
              <div className="mb-4">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                  </div>
                  <AddressSearch
                    onPlaceSelect={(place) => {
                      setLatitude(place.lat.toFixed(6))
                      setLongitude(place.lng.toFixed(6))
                      setPickupAddress(place.address || '')

                      if (pickupMap) {
                        replaceMarker(
                          pickupMarker,
                          setPickupMarker,
                          { lat: place.lat, lng: place.lng },
                          pickupMap,
                          'Pickup Location'
                        )
                      }
                    }}
                    placeholder="Search pickup location"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
              <div className="mb-4">
                <div className="h-64 rounded-xl border border-gray-300 overflow-hidden">
                  <GoogleMap
                    center={latitude && longitude ? { lat: parseFloat(latitude), lng: parseFloat(longitude) } : { lat: 12.9141, lng: 74.8560 }}
                    zoom={8}
                    onMapClick={(event, map) => {
                      if (event.latLng) {
                        const lat = event.latLng.lat()
                        const lng = event.latLng.lng()
                        setLatitude(lat.toFixed(6))
                        setLongitude(lng.toFixed(6))

                        replaceMarker(
                          pickupMarker,
                          setPickupMarker,
                          { lat, lng },
                          map,
                          'Pickup Location'
                        )
                      }
                    }}
                    onLoad={(map) => {
                      setPickupMap(map)

                      if (latitude && longitude && !pickupMarker) {
                        replaceMarker(
                          pickupMarker,
                          setPickupMarker,
                          { lat: parseFloat(latitude), lng: parseFloat(longitude) },
                          map,
                          'Pickup Location'
                        )
                      }
                    }}
                    style={{ height: '256px', width: '100%' }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Click on the map to select pickup location</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="Enter latitude"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="Enter longitude"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Enter pickup address"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div className="mt-4 grid gap-4">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 whitespace-nowrap">
                    Sender name :
                  </label>
                  <input
                    type="text"
                    pattern="[A-Za-z.\s]+"
                    value={senderName}
                    onChange={(e) => setSenderName(sanitizeSenderName(e.target.value))}
                    placeholder="Enter sender name"
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 whitespace-nowrap">
                    Phone no :
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={phoneNo}
                    onChange={(e) => setPhoneNo(sanitizePhoneNumber(e.target.value))}
                    placeholder="Enter 10-digit phone number"
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 whitespace-nowrap">
                    Landmark :
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="save-pickup-address"
                    checked={savePickupAddress}
                    onChange={handleSavePickupAddressChange}
                    disabled={isSavingPickupAddress}
                    className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500 disabled:cursor-not-allowed"
                  />
                  <span>{isSavingPickupAddress ? 'Saving address...' : 'Save this address'}</span>
                </label>
                {pickupAddressSaveMessage && (
                  <p className="text-sm text-green-600">{pickupAddressSaveMessage}</p>
                )}
              </div>
            </div>

            <div ref={dropSectionRef}>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Drop Location
              </label>
              <div className="mb-4">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <circle cx="11" cy="11" r="7" />
                      <path d="m20 20-3.5-3.5" />
                    </svg>
                  </div>
                  <AddressSearch
                    onPlaceSelect={(place) => {
                      setDropLatitude(place.lat.toFixed(6))
                      setDropLongitude(place.lng.toFixed(6))
                      setDropAddress(place.address || '')

                      if (dropMap) {
                        replaceMarker(
                          dropMarker,
                          setDropMarker,
                          { lat: place.lat, lng: place.lng },
                          dropMap,
                          'Drop Location'
                        )
                      }
                    }}
                    placeholder="Search drop location"
                    className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
              <div className="mb-4">
                <div className="h-64 rounded-xl border border-gray-300 overflow-hidden">
                  <GoogleMap
                    center={dropLatitude && dropLongitude ? { lat: parseFloat(dropLatitude), lng: parseFloat(dropLongitude) } : { lat: 12.9141, lng: 74.8560 }}
                    zoom={8}
                    onMapClick={(event, map) => {
                      if (event.latLng) {
                        const lat = event.latLng.lat()
                        const lng = event.latLng.lng()
                        setDropLatitude(lat.toFixed(6))
                        setDropLongitude(lng.toFixed(6))

                        replaceMarker(
                          dropMarker,
                          setDropMarker,
                          { lat, lng },
                          map,
                          'Drop Location'
                        )
                      }
                    }}
                    onLoad={(map) => {
                      setDropMap(map)

                      if (dropLatitude && dropLongitude && !dropMarker) {
                        replaceMarker(
                          dropMarker,
                          setDropMarker,
                          { lat: parseFloat(dropLatitude), lng: parseFloat(dropLongitude) },
                          map,
                          'Drop Location'
                        )
                      }
                    }}
                    style={{ height: '256px', width: '100%' }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Click on the map to select drop location</p>
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="Enter latitude"
                    value={dropLatitude}
                    onChange={(e) => setDropLatitude(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    step="any"
                    placeholder="Enter longitude"
                    value={dropLongitude}
                    onChange={(e) => setDropLongitude(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <input
                  type="text"
                  placeholder="Enter drop address"
                  value={dropAddress}
                  onChange={(e) => setDropAddress(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                />
              </div>
              <div className="mt-4 grid gap-4">
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 whitespace-nowrap">
                    Receiver name :
                  </label>
                  <input
                    type="text"
                    pattern="[A-Za-z.\s]+"
                    value={dropSenderName}
                    onChange={(e) => setDropSenderName(sanitizeSenderName(e.target.value))}
                    placeholder="Enter Receiver name"
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 whitespace-nowrap">
                    Phone no :
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength={10}
                    value={dropPhoneNo}
                    onChange={(e) => setDropPhoneNo(sanitizePhoneNumber(e.target.value))}
                    placeholder="Enter 10-digit phone number"
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="w-32 text-sm font-medium text-gray-700 whitespace-nowrap">
                    Landmark :
                  </label>
                  <input
                    type="text"
                    value={dropLandmark}
                    onChange={(e) => setDropLandmark(e.target.value)}
                    className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                  />
                </div>
                <label className="flex items-center gap-3 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="save-drop-address"
                    checked={saveDropAddress}
                    onChange={handleSaveDropAddressChange}
                    disabled={isSavingDropAddress}
                    className="h-4 w-4 border-gray-300 text-green-600 focus:ring-green-500 disabled:cursor-not-allowed"
                  />
                  <span>{isSavingDropAddress ? 'Saving address...' : 'Save this address'}</span>
                </label>
                {dropAddressSaveMessage && (
                  <p className="text-sm text-green-600">{dropAddressSaveMessage}</p>
                )}
              </div>
            </div>

            <div>
              <label className="mb-4 block text-sm font-medium text-gray-700">
                Package type
              </label>
              <div className="flex flex-wrap gap-3">
                {PACKAGE_TYPE_OPTIONS.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPackageType(type)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      packageType === type
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-4 block text-sm font-medium text-gray-700">
                Package Size/Approx weight
              </label>
              <div className="flex flex-wrap gap-3">
                {PACKAGE_SIZE_OPTIONS.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setPackageSize(size)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      packageSize === size
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <span className="text-yellow-500 text-lg mt-1">⚠️</span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-700">Fragile item</span>
                    <span className="text-sm text-gray-600">handle with care</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFragile}
                    onChange={(e) => setIsFragile(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                </label>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Pickup Notes <span className="text-gray-500">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">✏️</span>
                <textarea
                  value={pickupNotes}
                  onChange={(e) => setPickupNotes(e.target.value)}
                  placeholder="Add any special pickup instructions..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Drop Notes <span className="text-gray-500">(optional)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">✏️</span>
                <textarea
                  value={dropNotes}
                  onChange={(e) => setDropNotes(e.target.value)}
                  placeholder="Add any special drop-off instructions..."
                  rows={3}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 bg-white text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-start pt-0">
              <button
                type="button"
                onClick={getEstimation}
                disabled={isEstimating}
                className="w-fit px-8 py-3 bg-red-500 text-white font-semibold rounded-xl hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isEstimating ? 'Calculating...' : 'Get Estimation'}
              </button>
            </div>

            {estimation && (
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-4">
                <h3 className="text-lg font-semibold text-green-800 mb-3">Estimation Result</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Distance:</span>
                    <span className="ml-2 text-gray-900">{estimation.distance} km</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">ETA:</span>
                    <span className="ml-2 text-gray-900">{estimation.eta} mins</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Estimated Cost:</span>
                    <span className="ml-2 text-gray-900">₹{estimation.estimatedCost}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Final Cost:</span>
                    <span className="ml-2 text-gray-900">₹{estimation.finalCost}</span>
                  </div>
                  {estimation.discount?.amount > 0 && (
                    <div className="col-span-2">
                      <span className="font-medium text-green-700">Discount:</span>
                      <span className="ml-2 text-green-700">₹{estimation.discount.amount} ({estimation.discount.percentage}% {estimation.discount.type === 'first_order' ? 'First Order' : ''})</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={createOrder}
                disabled={!estimation || isSubmitting}
                className="px-8 py-3 bg-green-500 text-white font-semibold rounded-xl hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-500"
              >
                {isSubmitting ? 'Creating...' : 'Create Order'}
              </button>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  )
}
