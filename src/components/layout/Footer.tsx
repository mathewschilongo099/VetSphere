'use client';

import { FOOTER_LINKS, SITE_CONFIG } from '@/lib/constants';
import { FiMail, FiPhone, FiFacebook, FiTwitter, FiInstagram, FiLinkedin } from 'react-icons/fi';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-100">
      {/* Main Footer */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* About */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-bold mb-4 text-white">VetSphere Africa</h3>
            <p className="text-sm text-gray-400 mb-4">
              Trusted veterinary knowledge for better animal health and production across Africa.
            </p>
            <div className="flex gap-4">
              <a href={SITE_CONFIG.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                <FiFacebook size={20} />
              </a>
              <a href={SITE_CONFIG.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                <FiTwitter size={20} />
              </a>
              <a href={SITE_CONFIG.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-pink-400 transition-colors">
                <FiInstagram size={20} />
              </a>
              <a href={SITE_CONFIG.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                <FiLinkedin size={20} />
              </a>
            </div>
          </div>

          {/* Links Sections */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold mb-4 text-white">{title}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <FiMail size={16} />
                <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-white transition-colors">
                  {SITE_CONFIG.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <FiPhone size={16} />
                <a href={`tel:${SITE_CONFIG.phone}`} className="hover:text-white transition-colors">
                  {SITE_CONFIG.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>&copy; {currentYear} VetSphere Africa. All rights reserved.</p>
            <p>
              Designed with <span className="text-red-500">❤️</span> for animal health in Africa
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
