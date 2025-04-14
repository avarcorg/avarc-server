import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from './ui/button';
import LanguageSelector from './ui/LanguageSelector';

export default function Layout({ children }) {
  // For testing, always show the language selector
  const isDev = true; // process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      {isDev && <LanguageSelector />}
    </div>
  );
}
