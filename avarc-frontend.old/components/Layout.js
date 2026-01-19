import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from './ui/button';
import LanguageSelector from './ui/LanguageSelector';
import TranslationDebugClient from './ui/TranslationDebugClient';
import Navigation from './Navigation/Navigation';
import { useNavigation } from '../hooks/useNavigation';

export default function Layout({ children }) {
  // For testing, always show the language selector
  const isDev = true; // process.env.NODE_ENV === 'development';
  const { isAuthenticated, username, handleLogout } = useNavigation();

  return (
    <div className="min-h-screen bg-gray-50" data-filename="Layout.js">
      <Navigation
        isAuthenticated={isAuthenticated}
        username={username}
        onLogout={handleLogout}
      />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      {isDev && <LanguageSelector />}
      {isDev && <TranslationDebugClient />}
    </div>
  );
}
