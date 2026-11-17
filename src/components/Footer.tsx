import { Mail, MapPin, MessageCircle, Phone } from 'lucide-react';
import { buildWhatsAppUrl } from '../lib/format';
import type { SiteContent } from '../types';

interface FooterProps {
  siteContent: SiteContent;
  onNavigateBuy: () => void;
  onNavigateRent: () => void;
  onOpenSell: () => void;
  onFilterLocation: (location: string) => void;
  onOpenAuth: () => void;
}

export function Footer({
  siteContent,
  onNavigateBuy,
  onNavigateRent,
  onOpenSell,
  onFilterLocation,
  onOpenAuth,
}: FooterProps) {
  return (
    <footer className="bg-[#0B1528] text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="space-y-4">
            <div className="text-2xl font-semibold text-white font-editorial">
              Prime Estate
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
              RERA-licensed private brokerage specializing in Dubai and Abu Dhabi residential, waterfront, and Grade-A commercial real estate.
            </p>
            <div className="text-xs font-mono text-[#C9A254]">
              RERA Brokerage {siteContent.reraBrokerageId}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Brokerage Services</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  type="button"
                  onClick={onNavigateBuy}
                  className="hover:text-white transition-colors"
                >
                  Buy Residential & Commercial
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onNavigateRent}
                  className="hover:text-white transition-colors"
                >
                  Luxury & Corporate Leasing
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSell}
                  className="hover:text-white transition-colors"
                >
                  Sell or Value a Property
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenAuth}
                  className="hover:text-white transition-colors"
                >
                  Client & Agent Portal
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Key Emirates & Districts</h3>
            <ul className="space-y-2.5 text-sm">
              {['Palm Jumeirah', 'Downtown Dubai', 'Dubai Marina', 'DIFC', 'Saadiyat Island'].map(
                (loc) => (
                  <li key={loc}>
                    <button
                      type="button"
                      onClick={() => onFilterLocation(loc)}
                      className="hover:text-white transition-colors"
                    >
                      {loc}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white mb-4">Dubai Head Office</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C9A254] shrink-0 mt-0.5" />
                <span>{siteContent.officeAddress}</span>
              </li>
              <li>
                <a
                  href={`tel:${siteContent.companyPhone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-2.5 hover:text-white transition-colors tabular-nums"
                >
                  <Phone className="w-4 h-4 text-[#C9A254] shrink-0" />
                  <span>{siteContent.companyPhone}</span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteContent.companyEmail}`}
                  className="flex items-center gap-2.5 hover:text-white transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#C9A254] shrink-0" />
                  <span>{siteContent.companyEmail}</span>
                </a>
              </li>
              <li>
                <a
                  href={buildWhatsAppUrl(
                    siteContent.companyWhatsapp,
                    'Hello Prime Estate Advisory, I would like to inquire about UAE properties.'
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-1 px-4 py-2 bg-[#B68D40] hover:bg-[#99732C] text-white text-xs font-medium rounded-md transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Advisory Desk
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Prime Estate Real Estate LLC. All rights reserved.</p>
          <p>Dubai Land Department & Abu Dhabi DMT Compliant Advisory</p>
        </div>
      </div>
    </footer>
  );
}
