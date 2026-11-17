import { CheckCircle2, X } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError, apiFetch } from '../lib/api';
import { UAE_COMMUNITIES } from '../lib/format';
import type { PropertyPurpose, PropertyType } from '../types';

interface SellPropertyModalProps {
  open: boolean;
  onClose: () => void;
}

export function SellPropertyModal({ open, onClose }: SellPropertyModalProps) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+971 50 ');
  const [propertyType, setPropertyType] = useState<PropertyType>('Villa');
  const [purpose, setPurpose] = useState<PropertyPurpose>('Buy');
  const [location, setLocation] = useState('Palm Jumeirah');
  const [expectedPriceAed, setExpectedPriceAed] = useState('');
  const [sizeSqFt, setSizeSqFt] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/api/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          type: 'sell_valuation',
          name,
          email,
          phone,
          message:
            message ||
            `Requesting private valuation for ${propertyType} in ${location}.`,
          sellDetails: {
            propertyType,
            location,
            purpose,
            expectedPriceAed: expectedPriceAed ? Number(expectedPriceAed) : undefined,
            sizeSqFt: sizeSqFt ? Number(sizeSqFt) : undefined,
          },
        }),
      });
      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to submit valuation request.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1528]/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sell-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 id="sell-modal-title" className="text-xl font-semibold text-[#0B1528] font-editorial">
              List or Value Your UAE Property
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Connect with a RERA-certified Prime Estate specialist
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              onClose();
            }}
            aria-label="Close modal"
            className="w-9 h-9 flex items-center justify-center rounded-md text-slate-500 hover:text-[#0B1528] hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-lg font-semibold text-[#0B1528]">
                Valuation Request Received
              </h3>
              <p className="text-sm text-slate-600 max-w-sm mx-auto">
                A senior advisor for {location} will review recent DLD comparable transactions and contact you shortly.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  onClose();
                }}
                className="px-6 py-2.5 bg-[#0B1528] text-white text-sm font-medium rounded-md hover:bg-[#13223D]"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Listing Goal
                  </label>
                  <select
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value as PropertyPurpose)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
                  >
                    <option value="Buy">Sell Property</option>
                    <option value="Rent">Lease / Rent Out</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Property Type
                  </label>
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white"
                  >
                    {['Apartment', 'Villa', 'Townhouse', 'Penthouse', 'Commercial', 'Office', 'Land'].map(
                      (t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Community / District
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

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Expected Value (AED)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={expectedPriceAed}
                    onChange={(e) => setExpectedPriceAed(e.target.value)}
                    placeholder="e.g. 12500000"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Built-up / Plot Area (sq.ft)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={sizeSqFt}
                    onChange={(e) => setSizeSqFt(e.target.value)}
                    placeholder="e.g. 4200"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Property Notes (Unit, View, Upgrades)
                </label>
                <textarea
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Share unit type, sea/skyline view, tenancy status, or handover timeline..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-[#0B1528] hover:bg-[#13223D] disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
              >
                {submitting ? 'Submitting Request...' : 'Request Private Valuation'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
