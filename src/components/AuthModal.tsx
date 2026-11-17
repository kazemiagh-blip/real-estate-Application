import { X } from 'lucide-react';
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../lib/api';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (role: 'customer' | 'agent' | 'admin') => void;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<'customer' | 'agent'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+971 50 ');
  const [password, setPassword] = useState('');
  const [agencyTitle, setAgencyTitle] = useState('');
  const [reraId, setReraId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const fillDemo = (demoEmail: string, demoPassword: string) => {
    setMode('login');
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const u = await login(email, password);
        onClose();
        onSuccess?.(u.role);
      } else {
        const u = await register({
          name,
          email,
          phone,
          password,
          role,
          agencyTitle,
          reraId,
          specialty,
        });
        onClose();
        onSuccess?.(u.role);
      }
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Unable to complete authentication. Please try again.'
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
      aria-labelledby="auth-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-md overflow-hidden shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 id="auth-modal-title" className="text-xl font-semibold text-[#0B1528] font-editorial">
              {mode === 'login' ? 'Sign In to Prime Estate' : 'Create Prime Estate Account'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Access saved properties, viewing schedules, or brokerage tools
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-9 h-9 flex items-center justify-center rounded-md text-slate-500 hover:text-[#0B1528] hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-medium rounded-md transition-colors ${
                mode === 'login'
                  ? 'bg-white text-[#0B1528] shadow-sm'
                  : 'text-slate-600 hover:text-[#0B1528]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2 text-xs font-medium rounded-md transition-colors ${
                mode === 'register'
                  ? 'bg-white text-[#0B1528] shadow-sm'
                  : 'text-slate-600 hover:text-[#0B1528]'
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Account Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRole('customer')}
                      className={`py-2.5 px-3 text-xs font-medium rounded-md border transition-colors ${
                        role === 'customer'
                          ? 'border-[#0B1528] bg-[#0B1528] text-white'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Buyer / Tenant
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole('agent')}
                      className={`py-2.5 px-3 text-xs font-medium rounded-md border transition-colors ${
                        role === 'agent'
                          ? 'border-[#0B1528] bg-[#0B1528] text-white'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      Real Estate Agent
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Tariq Al Mansoori"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#0B1528]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    UAE / International Phone
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+971 50 123 4567"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#0B1528]"
                  />
                </div>

                {role === 'agent' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Title / Designation
                      </label>
                      <input
                        type="text"
                        value={agencyTitle}
                        onChange={(e) => setAgencyTitle(e.target.value)}
                        placeholder="Senior Property Advisor"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#0B1528]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        RERA BRN ID
                      </label>
                      <input
                        type="text"
                        value={reraId}
                        onChange={(e) => setReraId(e.target.value)}
                        placeholder="BRN-48210"
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#0B1528]"
                      />
                    </div>
                  </div>
                )}

                {role === 'agent' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Community Specialty
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="Palm Jumeirah & Dubai Marina"
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#0B1528]"
                    />
                  </div>
                )}
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.ae"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#0B1528]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:border-[#0B1528]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 bg-[#0B1528] hover:bg-[#13223D] disabled:opacity-60 text-white text-sm font-medium rounded-md transition-colors"
            >
              {submitting
                ? 'Please wait...'
                : mode === 'login'
                ? 'Sign In'
                : 'Create Account'}
            </button>
          </form>

          {/* Quick Demo Access for Testing All 3 Roles */}
          <div className="pt-4 border-t border-slate-200">
            <div className="text-xs font-medium text-slate-600 mb-2">
              Quick Demo Credentials (One-Click Fill)
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('nadia.mansoor@example.ae', 'Prime2026!')}
                className="px-2.5 py-2 text-xs font-medium border border-slate-200 rounded-md text-slate-700 hover:border-[#B68D40] hover:text-[#0B1528] transition-colors"
              >
                Customer
              </button>
              <button
                type="button"
                onClick={() => fillDemo('layla.alkhouri@primeestate.ae', 'Prime2026!')}
                className="px-2.5 py-2 text-xs font-medium border border-slate-200 rounded-md text-slate-700 hover:border-[#B68D40] hover:text-[#0B1528] transition-colors"
              >
                Agent
              </button>
              <button
                type="button"
                onClick={() => fillDemo('admin@primeestate.ae', 'AdminPrime2026!')}
                className="px-2.5 py-2 text-xs font-medium border border-slate-200 rounded-md text-slate-700 hover:border-[#B68D40] hover:text-[#0B1528] transition-colors"
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
