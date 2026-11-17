import { Bath, BedDouble, Heart, Maximize2 } from 'lucide-react';
import type { AgentPublic, Property } from '../types';
import { formatAed, formatNumber } from '../lib/format';
import { PropertyImage } from './PropertyImage';

export interface PropertyWithAgent extends Property {
  agent?: AgentPublic | null;
}

interface PropertyCardProps {
  property: PropertyWithAgent;
  isFavorite: boolean;
  onToggleFavorite: (propertyId: string) => void;
  onOpen: (propertyId: string) => void;
}

export function PropertyCard({
  property,
  isFavorite,
  onToggleFavorite,
  onOpen,
}: PropertyCardProps) {
  return (
    <article className="group bg-white border border-slate-200 rounded-lg overflow-hidden transition-colors duration-200 hover:border-slate-300 flex flex-col">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <button
          type="button"
          onClick={() => onOpen(property.id)}
          className="block w-full h-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
          aria-label={`View ${property.title}`}
        >
          <PropertyImage
            src={property.images[0]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1528]/70 via-[#0B1528]/15 to-transparent" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(property.id);
          }}
          aria-label={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
          className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/95 text-[#0B1528] flex items-center justify-center border border-slate-200/80 hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B68D40]"
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              isFavorite ? 'fill-[#B68D40] text-[#B68D40]' : 'text-[#0B1528]'
            }`}
          />
        </button>

        <div className="absolute bottom-3 left-4 right-4 flex items-baseline justify-between gap-3 pointer-events-none">
          <span className="text-lg font-semibold text-white font-mono tabular-nums tracking-tight">
            {formatAed(property.priceAed, property.purpose)}
          </span>
          <span className="text-xs font-medium text-slate-200 whitespace-nowrap">
            {property.purpose === 'Buy' ? 'For Sale' : 'For Rent'}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 mb-2">
            <span className="font-medium text-[#0B1528]">{property.location}</span>
            <span aria-hidden="true">·</span>
            <span>{property.type}</span>
            <span aria-hidden="true">·</span>
            <span>{property.completion}</span>
            <span aria-hidden="true">·</span>
            <span>{property.furnished}</span>
          </div>

          <button
            type="button"
            onClick={() => onOpen(property.id)}
            className="text-left focus:outline-none focus-visible:underline"
          >
            <h3 className="text-base font-semibold text-[#0B1528] leading-snug line-clamp-2 group-hover:text-[#99732C] transition-colors">
              {property.title}
            </h3>
          </button>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-4 tabular-nums">
            {property.bedrooms > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                {property.bedrooms} Bed
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="inline-flex items-center gap-1.5">
                <Bath className="w-3.5 h-3.5 text-slate-400" />
                {property.bathrooms} Bath
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
              {formatNumber(property.sizeSqFt)} sq.ft
            </span>
          </div>
          <span className="font-mono text-[11px] text-slate-400 whitespace-nowrap">
            {property.referenceNumber}
          </span>
        </div>
      </div>
    </article>
  );
}
