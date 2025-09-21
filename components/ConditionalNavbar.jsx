// components/ConditionalNavbar.tsx
'use client';
import { usePathname } from 'next/navigation';
import ModernNavbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Don't show navbar on admin pages
  if (pathname.includes('/admin')) {
    return null;
  }
  
  return <ModernNavbar />;
}