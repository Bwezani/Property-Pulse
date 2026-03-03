'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { calculatePropertyFinancials } from '@/lib/financials';
import { columns } from '@/components/properties/columns';
import { DataTable } from '@/components/properties/data-table';
import { Card, CardContent } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Loader2, Landmark, TrendingUp, LayoutGrid, BadgePercent } from 'lucide-react';
import type { Property, ConstructionExpense, RentalIncome, MaintenanceExpense } from '@/lib/types';
import { PropertyListItem } from '@/components/properties/property-list-item';
import { AddFinishedPropertyWrapper } from '@/components/properties/add-finished-property-wrapper';
import { AddConstructionPropertyWrapper } from '@/components/properties/add-construction-property-wrapper';
import { formatCurrency, formatFullCurrency } from '@/lib/utils';

export default function AllPropertiesPage() {
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  // Fetch Finished Properties for current user
  const finishedPropsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'finished_properties'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: finishedProps, isLoading: isFinishedLoading } = useCollection<Property>(finishedPropsQuery);

  // Fetch Construction Properties for current user
  const constructionPropsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'construction_properties'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: constructionProps, isLoading: isConstructionLoading } = useCollection<Property>(constructionPropsQuery);

  // Fetch related data for financials calculation
  const expensesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'construction_expenses'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: allExpenses, isLoading: isExpensesLoading } = useCollection<ConstructionExpense>(expensesQuery);

  const incomesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'rental_incomes'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: allIncomes, isLoading: isIncomesLoading } = useCollection<RentalIncome>(incomesQuery);

  const maintenanceQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'maintenance_expenses'), where('userId', '==', user.uid));
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-foreground">Portfolio Overview</h1>
            <p className="text-muted-foreground text-sm">Managing assets for {user?.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddFinishedPropertyWrapper />
            <AddConstructionPropertyWrapper />
          </div>
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
              value={formatCurrency(portfolioNetProfit)}
              tooltipValue={formatFullCurrency(portfolioNetProfit)}
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

        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-headline text-2xl font-bold text-foreground">Property Inventory</h2>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block">
                <Card className="border-border/50 shadow-sm">
                    <CardContent className="pt-6">
                        <DataTable columns={columns} data={calculatedProperties} />
                    </CardContent>
                </Card>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden grid gap-6">
                {calculatedProperties.map((property) => (
                    <PropertyListItem key={property.id} property={property} />
                ))}
                {calculatedProperties.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
                        <p className="text-muted-foreground font-medium">No properties found in your portfolio.</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}
