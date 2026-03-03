'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { PropertyListItem } from '@/components/properties/property-list-item';
import { AddFinishedPropertyWrapper } from '@/components/properties/add-finished-property-wrapper';
import { Home, PiggyBank, BadgePercent, TrendingUp, Loader2 } from 'lucide-react';
import type { Property, ConstructionExpense, RentalIncome, MaintenanceExpense } from '@/lib/types';
import { ImportFinishedProperties } from '@/components/properties/import-finished-properties';
import { calculatePropertyFinancials } from '@/lib/financials';
import { formatCurrency } from '@/lib/utils';

export default function FinishedPropertiesDashboardPage() {
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  const finishedPropertiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'finished_properties'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: rawProperties, isLoading: isDataLoading } = useCollection<Property>(finishedPropertiesQuery);

  // Fetch related data for calculation
  const expensesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'construction_expenses'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: allExpenses } = useCollection<ConstructionExpense>(expensesQuery);

  const incomesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'rental_incomes'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: allIncomes } = useCollection<RentalIncome>(incomesQuery);

  const maintenanceQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'maintenance_expenses'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: allMaintenance } = useCollection<MaintenanceExpense>(maintenanceQuery);

  if (isAuthLoading || isDataLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const finishedProperties = (rawProperties || []).map(p => 
    calculatePropertyFinancials(
      p,
      (allExpenses || []).filter(e => e.propertyId === p.id),
      (allIncomes || []).filter(i => i.propertyId === p.id),
      (allMaintenance || []).filter(m => m.propertyId === p.id)
    )
  );

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
        <div className="space-y-1">
          <h1 className="text-3xl font-headline font-bold">
            Finished Properties
          </h1>
          <p className="text-sm text-muted-foreground">Portfolio for {user?.email}</p>
        </div>

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
          value={formatCurrency(totalProfit)}
          helperText="Across all properties"
          Icon={PiggyBank}
        />
        <KpiCard
          title="Remaining Investment"
          value={formatCurrency(totalRemainingInvestment)}
          helperText="To break even on all properties"
          Icon={BadgePercent}
        />
        <KpiCard
          title="Monthly Rental Income"
          value={formatCurrency(monthlyRentalIncome)}
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
          <div className="text-center py-10 border rounded-lg bg-muted/5 border-dashed">
            <p className="text-muted-foreground">
              No finished properties found. Start by adding one!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
