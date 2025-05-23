import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Button } from '../ui/button';
import { useSafeTranslation } from '../../utils/translation';

const Navigation = ({ isAuthenticated, username, onLogout }) => {
  console.log('[Navigation] props:', { isAuthenticated, username });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const { t } = useTranslation('common');
  const { safeTranslate } = useSafeTranslation(['dashboard']);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    if (onLogout) {
      await onLogout();
    }
    router.push('/');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <img
                className="h-8 w-auto"
                src="/logo.png"
                alt={safeTranslate('navigation.logoAlt', 'common')}
              />
              <span className="ml-2 text-xl font-bold text-gray-900">
                {safeTranslate('navigation.brand', 'common')}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex sm:items-center sm:space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                    {safeTranslate('navigation.dashboard', 'common')}
                  </Button>
                </Link>
                <Link href="/profile/update">
                  <Button variant="ghost" className="text-gray-700 hover:text-gray-900">
                    {safeTranslate('updateProfile', 'dashboard')}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="text-gray-700 hover:text-gray-900"
                >
                  {safeTranslate('navigation.logout', 'common')}
                </Button>
              </>
            ) : null}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            {isAuthenticated && (
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gray-500"
              >
                <span className="sr-only">{safeTranslate('navigation.openMenu', 'common')}</span>
                {/* Hamburger icon */}
                <svg
                  className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
                {/* Close icon */}
                <svg
                  className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isAuthenticated && (
        <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start px-4 py-2 text-gray-700 hover:text-gray-900">
                {safeTranslate('navigation.dashboard', 'common')}
              </Button>
            </Link>
            <Link href="/profile/update">
              <Button variant="ghost" className="w-full justify-start px-4 py-2 text-gray-700 hover:text-gray-900">
                {safeTranslate('updateProfile', 'dashboard')}
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full justify-start px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              {safeTranslate('navigation.logout', 'common')}
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
