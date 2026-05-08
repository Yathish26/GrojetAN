import React, { useState, useEffect } from 'react'
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

  const sanitizePhoneNumber = (value) => value.replace(/\D/g, '').slice(0, 10)
  const sanitizeSenderName = (value) => value.replace(/[^A-Za-z.\s]/g, '')

  const selectedBusinessUser = businessUsers.find((user) => user._id === selectedId)

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

            <div>
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
              </div>
            </div>

            <div>
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
                    Sender name :
                  </label>
                  <input
                    type="text"
                    pattern="[A-Za-z.\s]+"
                    value={dropSenderName}
                    onChange={(e) => setDropSenderName(sanitizeSenderName(e.target.value))}
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
