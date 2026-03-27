'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Users } from 'lucide-react';
import type { Vendor } from '@/lib/types';
import { vendorColumns } from '@/components/vendors/columns';
import { DataTable } from '@/components/properties/data-table';
import { AddVendorForm } from '@/components/vendors/add-vendor-form';

export default function VendorsPage() {
  const db = useFirestore();
  const { user, isUserLoading } = useUser();

  const vendorsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'vendors'), where('userId', '==', user.uid));
  }, [db, user]);
  
  const { data: vendors, isLoading } = useCollection<Vendor>(vendorsQuery);

  if (isUserLoading || isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Vendor Directory
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage your service providers, contractors, and suppliers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddVendorForm />
        </div>
      </header>

      <div className="space-y-4">
        <Card className="border-border/50 shadow-sm">
          <CardContent className="pt-6">
            <DataTable columns={vendorColumns} data={vendors || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
