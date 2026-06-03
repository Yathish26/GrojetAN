
import React, { useCallback, useEffect, useState } from 'react';
import { Gift, Pencil, Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Layout from '../Components/Layout';

const discountOptions = [5, 10, 15, 20, 25, 30, 40, 50];

export default function XpressOffers() {
  const [offers, setOffers] = useState([]);
  const [loadingOffers, setLoadingOffers] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: '10',
    validFrom: '',
    validTo: ''
  });

  const resetForm = useCallback(() => {
    setFormData({
      code: '',
      discountPercentage: '10',
      validFrom: '',
      validTo: ''
    });
    setSelectedOffer(null);
  }, []);

  const formatDateDDMMYY = (value) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return 'N/A';
    const dd = String(date.getDate()).padStart(2, '0');
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${dd}/${mm}/${yy}`;
  };


  const fetchXpressOffers = useCallback(async () => {
    try {
      setLoadingOffers(true);
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/xpress-offers`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setOffers(data.offers || []);
      } else {
        toast.error(data.message || 'Failed to load Xpress offers');
      }
    } catch (error) {
      console.error('Error fetching xpress offers:', error);
      toast.error('Failed to load Xpress offers');
    } finally {
      setLoadingOffers(false);
    }
  }, []);

  useEffect(() => {
    fetchXpressOffers();
  }, [fetchXpressOffers]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'code' ? String(value || '').toUpperCase().slice(0, 10) : value
    }));
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (offer) => {
    setSelectedOffer(offer);
    setFormData({
      code: offer.code || '',
      discountPercentage: String(offer.discountPercentage || 10),
      validFrom: offer.validFrom ? new Date(offer.validFrom).toISOString().split('T')[0] : '',
      validTo: offer.validTo ? new Date(offer.validTo).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    resetForm();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setSubmitting(true);
      const isEditing = showEditModal && selectedOffer?._id;
      const response = await fetch(
        isEditing
          ? `${import.meta.env.VITE_SERVER}/admin/xpress-offers/${selectedOffer._id}`
          : `${import.meta.env.VITE_SERVER}/admin/xpress-offers`,
        {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          code: formData.code.trim(),
          discountPercentage: Number(formData.discountPercentage),
          validFrom: formData.validFrom,
          validTo: formData.validTo
        })
      }
      );
      const data = await response.json();
      if (!response.ok || !data.success) {
        toast.error(data.message || `Failed to ${isEditing ? 'update' : 'create'} Xpress offer`);
        return;
      }
      toast.success(`Xpress offer ${isEditing ? 'updated' : 'created'} successfully`);
      closeModal();
      fetchXpressOffers();
    } catch (error) {
      console.error('Error saving xpress offer:', error);
      toast.error('Failed to save Xpress offer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (offerId) => {
    if (!window.confirm('Are you sure you want to delete this Xpress offer?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER}/admin/xpress-offers/${offerId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        toast.error(data.message || 'Failed to delete Xpress offer');
        return;
      }

      toast.success('Xpress offer deleted successfully');
      fetchXpressOffers();
    } catch (error) {
      console.error('Error deleting xpress offer:', error);
      toast.error('Failed to delete Xpress offer');
    }
  };



  return (
    <Layout title="Xpress Offers Management">
      <div className="p-4 sm:p-6">
        <section className="mb-4 flex flex-col gap-4 sm:mb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center bg-green-100 text-green-700">
              <Gift className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
              Xpress Offer Management
            </h1>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 self-start bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 md:self-auto"
          >
            <Plus className="h-4 w-4" />
            Create Offer
          </button>
        </section>

        <section className="border border-gray-200 bg-white shadow-sm">
          {loadingOffers ? (
            <div className="flex min-h-[220px] items-center justify-center p-6 text-sm font-medium text-gray-500">
              Loading Xpress offers...
            </div>
          ) : offers.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center border border-dashed border-gray-200 bg-gray-50 px-6 text-center">
              <Gift className="h-10 w-10 text-green-600" />
              <h2 className="mt-4 text-lg font-semibold text-gray-900">No Xpress offers yet</h2>
              <p className="mt-2 max-w-md text-sm text-gray-600">
                Create your first Xpress offer with a code, discount percentage, and validity dates.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-6">
              {offers.map((offer) => (
                <article
                  key={offer._id}
                  className="border border-gray-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900 uppercase">{offer.code}</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        {formatDateDDMMYY(offer.validFrom)} to {formatDateDDMMYY(offer.validTo)}
                      </p>
                    </div>
                    <span className="bg-green-600 px-3 py-1 text-xs font-semibold text-white">
                      {offer.discountPercentage}% OFF
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span className="border border-green-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                      {offer.code}
                    </span>
                    <span className={`px-3 py-1 text-xs font-semibold ${offer.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-5 flex gap-2 border-t border-gray-100 pt-4">
                    <button
                      type="button"
                      onClick={() => openEditModal(offer)}
                      className="inline-flex items-center gap-2 border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(offer._id)}
                      className="inline-flex items-center gap-2 border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {showCreateModal || showEditModal ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-md border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-green-100 px-6 py-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {showEditModal ? 'Edit Xpress Offer' : 'Create Xpress Offer'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">Add code, discount percentage, and validity dates.</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Code</label>
                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    maxLength={10}
                    required
                    className="w-full border border-gray-300 px-4 py-3 text-sm uppercase text-gray-700 outline-none transition focus:border-green-500"
                    placeholder="Enter offer code"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Discount Percentage</label>
                  <select
                    name="discountPercentage"
                    value={formData.discountPercentage}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-green-500"
                  >
                    {discountOptions.map((value) => (
                      <option key={value} value={value}>
                        {value}%
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Valid From</label>
                  <input
                    type="date"
                    name="validFrom"
                    value={formData.validFrom}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-green-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Valid To</label>
                  <input
                    type="date"
                    name="validTo"
                    value={formData.validTo}
                    onChange={handleInputChange}
                    required
                    className="w-full border border-gray-300 px-4 py-3 text-sm text-gray-700 outline-none transition focus:border-green-500"
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-green-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-green-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {submitting ? (showEditModal ? 'Updating...' : 'Creating...') : (showEditModal ? 'Update Offer' : 'Create Offer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : null}
      </div>
    </Layout>
  );
}
