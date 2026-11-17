import type { PropertyPurpose } from '../types';

export function formatAed(amount: number, purpose?: PropertyPurpose): string {
  const formatted = new Intl.NumberFormat('en-AE', {
    maximumFractionDigits: 0,
  }).format(amount);
  if (purpose === 'Rent') {
    return `AED ${formatted} / yr`;
  }
  return `AED ${formatted}`;
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('en-AE', {
    maximumFractionDigits: 0,
  }).format(val);
}

export function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function buildWhatsAppUrl(
  phoneOrWhatsapp: string,
  message: string
): string {
  const digits = phoneOrWhatsapp.replace(/\D/g, '') || '971504827710';
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export const UAE_COMMUNITIES = [
  'Palm Jumeirah',
  'Downtown Dubai',
  'Dubai Marina',
  'Dubai Hills Estate',
  'DIFC',
  'Business Bay',
  'Dubai Creek Harbour',
  'Jumeirah Golf Estates',
  'Emirates Hills',
  'Saadiyat Island',
  'Al Maryah Island',
  'Yas Island',
];

export const UAE_EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ras Al Khaimah',
  'Ajman',
];

export const LOCATION_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Palm Jumeirah': { lat: 25.1124, lng: 55.1390 },
  'Downtown Dubai': { lat: 25.1972, lng: 55.2744 },
  'Dubai Marina': { lat: 25.0805, lng: 55.1403 },
  'Dubai Hills Estate': { lat: 25.1066, lng: 55.2452 },
  DIFC: { lat: 25.2116, lng: 55.2815 },
  'Business Bay': { lat: 25.1862, lng: 55.2747 },
  'Dubai Creek Harbour': { lat: 25.2051, lng: 55.3446 },
  'Jumeirah Golf Estates': { lat: 25.0195, lng: 55.2028 },
  'Emirates Hills': { lat: 25.0695, lng: 55.1636 },
  'Saadiyat Island': { lat: 24.5393, lng: 54.4264 },
  'Al Maryah Island': { lat: 24.5003, lng: 54.3897 },
  'Yas Island': { lat: 24.4979, lng: 54.6074 },
};
