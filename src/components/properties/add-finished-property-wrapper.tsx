'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export function AddFinishedPropertyWrapper() {
  return (
    <Button size="sm" className="h-8" asChild>
      <Link href="/dashboard/properties/add-finished">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Finished Property
      </Link>
    </Button>
  );
}
