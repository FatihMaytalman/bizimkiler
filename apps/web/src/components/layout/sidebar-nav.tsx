'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
}

interface SidebarNavProps {
  familyId: string;
}

const navItems = (familyId: string): NavItem[] => [
  { href: `/family/${familyId}`, label: 'Dashboard' },
  { href: `/family/${familyId}/timeline`, label: 'Timeline' },
  { href: `/family/${familyId}/echo-tap`, label: 'EchoTap' },
  { href: `/family/${familyId}/upload`, label: 'Upload' },
  { href: `/family/${familyId}/people`, label: 'People' },
  { href: `/family/${familyId}/tree`, label: 'Family Tree' },
  { href: `/family/${familyId}/media`, label: 'Media' },
  { href: `/family/${familyId}/review`, label: 'Review Queue' },
  { href: `/family/${familyId}/settings`, label: 'Settings' },
];

export function SidebarNav({ familyId }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav aria-label="Family navigation" className="space-y-1">
      {navItems(familyId).map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== `/family/${familyId}` && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'block rounded-xl px-3 py-2 text-sm transition',
              isActive
                ? 'bg-turquoise-500/15 text-turquoise-500'
                : 'text-warm-white/70 hover:bg-white/5 hover:text-warm-white',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
