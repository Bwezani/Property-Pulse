import { Building2 } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2">
      <Building2 className="h-6 w-6 text-primary" />
      <h1 className="text-xl font-bold font-headline text-primary">IGM Trust Properties</h1>
    </Link>
  );
}
