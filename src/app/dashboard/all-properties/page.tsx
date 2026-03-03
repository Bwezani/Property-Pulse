'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import { calculatePropertyFinancials } from '@/lib/financials';
import { columns } from '@/components/properties/columns';
import { DataTable } from '@/components/properties/data-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Loader2, Landmark, TrendingUp, LayoutGrid, BadgePercent } from 'lucide-react';
import type { Property, ConstructionExpense, RentalIncome, MaintenanceExpense } from '@/lib/types';

export default function AllPropertiesPage() {
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  // Fetch Finished Properties
  const finishedPropsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'finished_properties'));
  }, [db, user]);
  const { data: finishedProps, isLoading: isFinishedLoading } = useCollection<Property>(finishedPropsQuery);

  // Fetch Construction Properties
  const constructionPropsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'construction_properties'));
  }, [db, user]);
  const { data: constructionProps, isLoading: isConstructionLoading } = useCollection<Property>(constructionPropsQuery);

  // Fetch all related data for financials calculation
  const expensesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'construction_expenses'));
  }, [db, user]);
  const { data: allExpenses, isLoading: isExpensesLoading } = useCollection<ConstructionExpense>(expensesQuery);

  const incomesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'rental_incomes'));
  }, [db, user]);
  const { data: allIncomes, isLoading: isIncomesLoading } = useCollection<RentalIncome>(incomesQuery);

  const maintenanceQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'maintenance_expenses'));
  }, [db, user]);
  const { data: allMaintenance, isLoading: isMaintenanceLoading } = useCollection<MaintenanceExpense>(maintenanceQuery);

  if (isAuthLoading || isFinishedLoading || isConstructionLoading || isExpensesLoading || isIncomesLoading || isMaintenanceLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Combine properties from both collections
  const combinedProperties = [
    ...(finishedProps || []),
    ...(constructionProps || [])
  ];

  // Map and calculate financials for each
  const calculatedProperties = combinedProperties.map(p => 
    calculatePropertyFinancials(
      p, 
      (allExpenses || []).filter(e => e.propertyId === p.id), 
      (allIncomes || []).filter(i => i.propertyId === p.id), 
      (allMaintenance || []).filter(m => m.propertyId === p.id)
    )
  );

  // Aggregate Portfolio Stats
  const totalAssets = calculatedProperties.length;
  const portfolioNetProfit = calculatedProperties.reduce((acc, p) => acc + (p.netProfit || 0), 0);
  const totalUnits = calculatedProperties.reduce((acc, p) => acc + (p.units || (p.unitsList?.length || 1)), 0);
  
  const totalInvestment = calculatedProperties.reduce((acc, p) => acc + (p.totalInvestment || 0), 0);
  const totalRent = calculatedProperties.reduce((acc, p) => acc + (p.totalRentReceived || 0), 0);
  const portfolioRoi = totalInvestment > 0 ? (totalRent / totalInvestment) * 100 : 0;

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">Portfolio Overview</h1>
          <p className="text-muted-foreground text-sm">Aggregated financial performance and asset tracking across all stages.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              title="Total Assets"
              value={totalAssets.toString()}
              helperText="Active & finished properties"
              Icon={Landmark}
            />
            <KpiCard
              title="Portfolio Net Profit"
              value={new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'ZMW',
                maximumFractionDigits: 0,
              }).format(portfolioNetProfit)}
              helperText="Lifetime net earnings"
              Icon={TrendingUp}
            />
            <KpiCard
              title="Total Managed Units"
              value={totalUnits.toString()}
              helperText="Across all dwellings"
              Icon={LayoutGrid}
            />
            <KpiCard
              title="Overall Recovery"
              value={`${portfolioRoi.toFixed(1)}%`}
              helperText="Portfolio-wide ROI"
              Icon={BadgePercent}
            />
        </div>

        <Card className="border-border/50 shadow-sm">
            <CardHeader>
                <CardTitle className="font-headline text-2xl text-foreground">Property Inventory</CardTitle>
                <CardDescription>Detailed breakdown of individual property performance.</CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={calculatedProperties} />
            </CardContent>
        </Card>
    </div>
  );
}
