import React from 'react';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-ink bg-panel mt-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-10">
        <div className="eyebrow mono mb-3">Contact info</div>
        <h3 className="text-lg font-semibold text-ink display mb-4">Elsewedy Electric HQ</h3>

        <div className="grid sm:grid-cols-3 gap-6 text-sm text-ink-soft">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-red mt-0.5 shrink-0" />
            <div>
              <p>Plot No. 13co3, Cairo Festival City, 5th Settlement, Cairo, Egypt</p>
              <p>P.O. Box 310, New Cairo 11835</p>
              <a
                href="https://maps.app.goo.gl/frPcaihvFGSUsGTo8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 text-red font-semibold mono text-xs tracking-wide hover:text-red-dim"
              >
                VIEW DIRECTIONS →
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Mail className="h-4 w-4 text-red mt-0.5 shrink-0" />
            <a href="mailto:info@elsewedy.com" className="hover:text-ink">info@elsewedy.com</a>
          </div>

          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-red mt-0.5 shrink-0" />
            <a href="tel:19159" className="hover:text-ink">19159</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
