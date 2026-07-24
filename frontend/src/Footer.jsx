import React from 'react';
import { MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-ink text-paper mt-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-14">
        <div className="border-l-2 border-red/50 pl-6">
          <h3 className="text-sm font-bold uppercase tracking-wide text-paper mb-5">
            Contact info
          </h3>

          <div className="space-y-5 text-[15px] text-paper/70">
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-red mt-1 shrink-0" />
              <div>
                <p className="text-paper">Elsewedy Electric HQ</p>
                <p>
                  Plot No. 13co3, Cairo Festival City, 5th Settlement, Cairo, Egypt
                  P.O.Box 310, New Cairo 11835{' '}
                  <a
                    href="https://maps.app.goo.gl/frPcaihvFGSUsGTo8"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-paper hover:text-red"
                  >
                    VIEW DIRECTION
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-red shrink-0" />
              <p>
                Email: <a href="mailto:info@elsewedy.com" className="hover:text-red">info@elsewedy.com</a>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-red shrink-0" />
              <p>
                Phone: <a href="tel:19159" className="hover:text-red">19159</a>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-paper/10 text-xs text-paper/40">
          &copy; {new Date().getFullYear()} Website is Proudly Powered by Elsewedy Electric
        </div>
      </div>
    </footer>
  );
}