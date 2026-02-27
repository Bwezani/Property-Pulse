
'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { PropertyListItem } from '@/components/properties/property-list-item';
import { AddFinishedPropertyWrapper } from '@/components/properties/add-finished-property-wrapper';
import { Home, PiggyBank, BadgePercent, TrendingUp, Loader2 } from 'lucide-react';
import type { Property } from '@/lib/types';
import { ImportFinishedProperties } from '@/components/properties/import-finished-properties';

export default function FinishedPropertiesDashboardPage() {
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  const finishedPropertiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'finished_properties'),
      where('isDeleted', '==', false),
      orderBy('createdAt', 'desc')
    );
  }, [db, user]);

  const { data: properties, isLoading: isDataLoading } = useCollection<Property>(finishedPropertiesQuery);

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const finishedProperties = properties || [];

  const totalFinishedProperties = finishedProperties.length;
  const occupiedCount = finishedProperties.filter(
    (p) => p.status === 'Occupied'
  ).length;
  const totalProfit = finishedProperties.reduce(
    (acc, p) => acc + (p.totalProfit || 0),
    0
  );
  const totalRemainingInvestment = finishedProperties.reduce(
    (acc, p) => acc + (p.remainingInvestment || 0),
    0
  );
  const monthlyRentalIncome = finishedProperties
    .filter((p) => p.status === 'Occupied')
    .reduce((acc, p) => acc + (p.monthlyRent || 0), 0);

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl font-headline font-bold">
          Finished Properties Dashboard
        </h1>

        <div className="flex gap-2">
          <ImportFinishedProperties />
          <AddFinishedPropertyWrapper />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Properties"
          value={totalFinishedProperties.toString()}
          helperText={`${occupiedCount} occupied, ${
            totalFinishedProperties - occupiedCount
          } vacant`}
          Icon={Home}
        />
        <KpiCard
          title="Total Profit Earned"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ZMW',
            maximumFractionDigits: 0,
          }).format(totalProfit)}
          helperText="Across all properties"
          Icon={PiggyBank}
        />
        <KpiCard
          title="Remaining Investment"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ZMW',
            maximumFractionDigits: 0,
          }).format(totalRemainingInvestment)}
          helperText="To break even on all properties"
          Icon={BadgePercent}
        />
        <KpiCard
          title="Monthly Rental Income"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ZMW',
            maximumFractionDigits: 0,
          }).format(monthlyRentalIncome)}
          helperText="From occupied properties"
          Icon={TrendingUp}
        />
      </div>

      <div>
        <h2 className="text-2xl font-headline font-semibold my-4">
          Property Overview
        </h2>

        {finishedProperties.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {finishedProperties.map((property) => (
              <PropertyListItem key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border rounded-lg">
            <p className="text-muted-foreground">
              No finished properties found. Start by adding one!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
