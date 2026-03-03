'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export function AddConstructionPropertyWrapper() {
  return (
    <Button size="sm" className="h-8" asChild>
      <Link href="/dashboard/properties/add-construction">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Construction Property
      </Link>
    </Button>
  );
}
