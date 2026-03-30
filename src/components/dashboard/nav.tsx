'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Building,
  Construction,
  Landmark,
  LineChart,
  Users,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard/all-properties', label: 'All Properties', icon: Landmark },
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
  { href: '/dashboard/reports', label: 'Financial Reports', icon: LineChart },
  { href: '/dashboard/vendors', label: 'Vendors', icon: Users },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function DashboardNav({ isMobile = false }: { isMobile?: boolean }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'sidebar-link',
              isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
            )}
          >
            <Icon className={cn("h-4.5 w-4.5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}