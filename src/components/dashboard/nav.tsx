'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building,
  Construction,
  Landmark,
  LineChart,
} from 'lucide-react';

const navItems = [
  {
    href: '/dashboard/finished-properties',
    label: 'Finished Properties',
    icon: Building,
  },
  {
    href: '/dashboard/construction',
    label: 'Under Construction',
    icon: Construction,
  },
  { href: '/dashboard/all-properties', label: 'All Properties', icon: Landmark },
  { href: '/dashboard/reports', label: 'Financial Reports', icon: LineChart },
];

export function DashboardNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            {
              'bg-muted text-primary': pathname.startsWith(href),
              'flex-col h-auto justify-center gap-1': isMobile && false, // placeholder for a different mobile view if needed
            }
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </Link>
      ))}
    </>
  );
}
