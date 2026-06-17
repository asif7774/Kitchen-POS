import React from 'react';
import { Link } from 'react-router-dom';
// Removed Heroicons - using SVG sprite instead
import { SvgIcon } from 'components/atoms/svg-sprite-loader';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'Contact Us', href: '/contact' },
      { name: 'Privacy Policy', href: '/privacy' },
      { name: 'Terms of Service', href: '/terms' },
    ],
    resources: [
      { name: 'Documentation', href: 'https://github.com/asif7774/vital#readme' },
      { name: 'GitHub', href: 'https://github.com/asif7774/vital' },
      { name: 'Issues', href: 'https://github.com/asif7774/vital/issues' },
      { name: 'License', href: 'https://github.com/asif7774/vital/blob/main/LICENSE' },
    ],
    support: [
      { name: 'Help Center', href: '/help' },
      { name: 'FAQ', href: '/faq' },
      { name: 'Contributing', href: 'https://github.com/asif7774/vital' },
      { name: 'Support', href: 'https://github.com/asif7774/vital/issues' },
    ],
  };

  return (
    <footer className="bg-gray-900 text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="ml-2 text-xl font-bold">Vital</span>
            </div>
            <p className="text-gray-300 text-sm">
              A modern React boilerplate template with React 19, TypeScript, Tailwind CSS 4,
              and all the tools you need to build amazing applications.
            </p>
            <div className="space-y-2">
              <div className="flex items-center text-sm text-gray-300">
                <SvgIcon name="mail" width="16" height="16" className="mr-2" />
                <a href="mailto:asif.ansari7774@gmail.com" className="hover:text-white">asif.ansari7774@gmail.com</a>
              </div>
              <div className="flex items-center text-sm text-gray-300">
                <SvgIcon name="external-link" width="16" height="16" className="mr-2" />
                <a href="https://github.com/asif7774/vital" target="_blank" rel="noopener noreferrer" className="hover:text-white">GitHub Repository</a>
              </div>
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-gray-300 hover:text-white transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Resources</h3>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('http') ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  {link.href.startsWith('http') ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-gray-300 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center">
          <p className="text-sm text-gray-400">
            © {currentYear} Vital. All rights reserved. Made with ❤️ by Asif Ansari.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
