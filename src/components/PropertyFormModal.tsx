import { ImagePlus, Star, Trash2, X } from 'lucide-react';
import React, { useState } from 'react';
import { ApiError, apiFetch, uploadPropertyImages } from '../lib/api';
import { LOCATION_COORDINATES, UAE_COMMUNITIES, UAE_EMIRATES } from '../lib/format';
import type { CompletionStatus, FurnishedStatus, Property, PropertyPurpose, PropertyType } from '../types';
import { PropertyImage } from './PropertyImage';

interface PropertyFormModalProps {
  open: boolean;
  editingProperty?: Property | null;
  onClose: () => void;
  onSaved: (property: Property) => void;
}

const PROPERTY_TYPES: PropertyType[] = [
  'Apartment',
  'Villa',
  'Townhouse',
  'Penthouse',
  'Commercial',
  'Office',
  'Land',
];

export function PropertyFormModal({
  open,
  editingProperty,
  onClose,
  onSaved,
}: PropertyFormModalProps) {
  const [title, setTitle] = useState(editingProperty?.title || '');
  const [purpose, setPurpose] = useState<PropertyPurpose>(editingProperty?.purpose || 'Buy');
  const [type, setType] = useState<PropertyType>(editingProperty?.type || 'Apartment');
  const [location, setLocation] = useState(editingProperty?.location || 'Downtown Dubai');
  const [community, setCommunity] = useState(editingProperty?.community || '');
  const [emirate, setEmirate] = useState(editingProperty?.emirate || 'Dubai');
  const [address, setAddress] = useState(editingProperty?.address || '');
  const [priceAed, setPriceAed] = useState(editingProperty ? String(editingProperty.priceAed) : '');
  const [bedrooms, setBedrooms] = useState(editingProperty ? String(editingProperty.bedrooms) : '2');
  const [bathrooms, setBathrooms] = useState(editingProperty ? String(editingProperty.bathrooms) : '3');
  const [sizeSqFt, setSizeSqFt] = useState(editingProperty ? String(editingProperty.sizeSqFt) : '');
  const [furnished, setFurnished] = useState<FurnishedStatus>(
    editingProperty?.furnished || 'Furnished'
  );
  const [completion, setCompletion] = useState<CompletionStatus>(
    editingProperty?.completion || 'Ready'
  );
  const [reraPermit, setReraPermit] = useState(editingProperty?.reraPermit || '');
  const [description, setDescription] = useState(editingProperty?.description || '');
  const [featuresText, setFeaturesText] = useState(
    editingProperty?.features.join(', ') ||
      'Private Balcony, Concierge, Covered Parking, Infinity Pool, Smart Home'
  );
  const [images, setImages] = useState<string[]>(editingProperty?.images || []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const urls = await uploadPropertyImages(e.target.files);
      setImages((prev) => [...prev, ...urls].slice(0, 10));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Image upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const makeCover = (idx: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const [item] = copy.splice(idx, 1);
      return [item, ...copy];
    });
  };

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const coords = LOCATION_COORDINATES[location] || { lat: 25.1972, lng: 55.2744 };
      const payload = {
        title,
        purpose,
        type,
        location,
        community: community || location,
        emirate,
        address: address || `${location}, ${emirate}, UAE`,
        coordinates: coords,
        priceAed: Number(priceAed),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        sizeSqFt: Number(sizeSqFt),
        furnished,
        completion,
        reraPermit,
        description,
        features: featuresText
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        images:
          images.length > 0
            ? images
            : ['/src/assets/images/prop_downtown_penthouse_1794929837008.jpg'],
      };

      const res = editingProperty
        ? await apiFetch<{ property: Property }>(`/api/properties/${editingProperty.id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          })
        : await apiFetch<{ property: Property }>('/api/properties', {
            method: 'POST',
            body: JSON.stringify(payload),
          });

      onSaved(res.property);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to save property.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1528]/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="prop-form-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 id="prop-form-title" className="text-xl font-semibold text-[#0B1528] font-editorial">
              {editingProperty ? 'Edit Property Listing' : 'Add New UAE Property'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {editingProperty
                ? `Reference ${editingProperty.referenceNumber}`
                : 'New agent submissions are queued for administrator approval'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 flex items-center justify-center rounded-md text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Property Headline
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Marina View 3-Bedroom Residence with Private Terrace"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Purpose</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as PropertyPurpose)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
              >
                <option value="Buy">Buy (Sale)</option>
                <option value="Rent">Rent (Annual)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PropertyType)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
              >
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Furnishing</label>
              <select
                value={furnished}
                onChange={(e) => setFurnished(e.target.value as FurnishedStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
              >
                <option value="Furnished">Furnished</option>
                <option value="Unfurnished">Unfurnished</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Completion</label>
              <select
                value={completion}
                onChange={(e) => setCompletion(e.target.value as CompletionStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
              >
                <option value="Ready">Ready</option>
                <option value="Off-Plan">Off-Plan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Location / District
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
              >
                {UAE_COMMUNITIES.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Emirate</label>
              <select
                value={emirate}
                onChange={(e) => setEmirate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
              >
                {UAE_EMIRATES.map((em) => (
                  <option key={em} value={em}>
                    {em}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sub-Community / Tower
              </label>
              <input
                type="text"
                value={community}
                onChange={(e) => setCommunity(e.target.value)}
                placeholder="e.g. Boulevard Crescent"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Price (AED)
              </label>
              <input
                type="number"
                required
                min="1000"
                value={priceAed}
                onChange={(e) => setPriceAed(e.target.value)}
                placeholder="4500000"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Area (sq.ft)
              </label>
              <input
                type="number"
                required
                min="100"
                value={sizeSqFt}
                onChange={(e) => setSizeSqFt(e.target.value)}
                placeholder="2250"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bedrooms</label>
              <input
                type="number"
                min="0"
                max="20"
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Bathrooms</label>
              <input
                type="number"
                min="0"
                max="25"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Street / Full Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Sheikh Mohammed Bin Rashid Blvd, Dubai"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                RERA Trakheesi Permit #
              </label>
              <input
                type="text"
                value={reraPermit}
                onChange={(e) => setReraPermit(e.target.value)}
                placeholder="7129485102"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Property Description
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe architecture, views, finishes, and investment highlights..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Amenities & Features (comma-separated)
            </label>
            <input
              type="text"
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md"
            />
          </div>

          {/* Multi-Image Upload */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-medium text-slate-700">
                Property Gallery Images (JPEG, PNG, WebP)
              </label>
              <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#0B1528] text-xs font-medium rounded-md cursor-pointer transition-colors">
                <ImagePlus className="w-4 h-4 text-[#99732C]" />
                {uploading ? 'Uploading...' : 'Upload Photos'}
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div
                    key={`${img}-${idx}`}
                    className="relative group aspect-[4/3] rounded-md overflow-hidden border border-slate-200 bg-slate-100"
                  >
                    <PropertyImage
                      src={img}
                      alt={`Property photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-1.5 bg-[#0B1528]/80 flex items-center justify-between text-[11px] text-white">
                      <button
                        type="button"
                        onClick={() => makeCover(idx)}
                        className="inline-flex items-center gap-1 hover:text-[#C9A254]"
                      >
                        <Star className={`w-3 h-3 ${idx === 0 ? 'fill-[#C9A254] text-[#C9A254]' : ''}`} />
                        {idx === 0 ? 'Cover' : 'Set Cover'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        aria-label="Remove image"
                        className="text-red-300 hover:text-red-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-[#0B1528]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2.5 bg-[#0B1528] hover:bg-[#13223D] disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
            >
              {submitting
                ? 'Saving...'
                : editingProperty
                ? 'Save Changes'
                : 'Submit Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
