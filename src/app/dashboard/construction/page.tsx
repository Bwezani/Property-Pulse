'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { PropertyListItem } from '@/components/properties/property-list-item';
import { Construction, Banknote, GanttChartSquare, Landmark, Loader2, TrendingDown } from 'lucide-react';
import type { Property, ConstructionExpense } from '@/lib/types';
import { ImportUnderConstructionProperties } from '@/components/properties/import-under-construction-properties';
import { AddConstructionPropertyWrapper } from '@/components/properties/add-construction-property-wrapper';
import { ConstructionExpenseBarChart } from '../reports/construction-expense-bar-chart';
import { calculatePropertyFinancials } from '@/lib/financials';
import { formatCurrency, formatFullCurrency } from '@/lib/utils';

export default function ConstructionDashboardPage() {
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  // Fetch all construction properties for current user
  const constructionPropsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'construction_properties'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: rawProperties, isLoading: isPropsLoading } = useCollection<Property>(constructionPropsQuery);

  // Fetch all construction expenses for calculation
  const allExpensesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, 'users', user.uid, 'construction_expenses'), where('userId', '==', user.uid));
  }, [db, user]);
  const { data: allExpenses, isLoading: isExpensesLoading } = useCollection<ConstructionExpense>(allExpensesQuery);

  if (isAuthLoading || isPropsLoading || isExpensesLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const constructionProperties: Property[] = (rawProperties || []).map((p) =>
    calculatePropertyFinancials(
      p,
      (allExpenses || []).filter(e => e.propertyId === p.id),
      [],
      []
    )
  );

  const totalActiveProjects = constructionProperties.length;
  const totalConstructionCost = constructionProperties.reduce(
    (acc, p) => acc + (p.totalConstructionCost || 0),
    0
  );
  
  const totalPlannedBudget = constructionProperties.reduce(
    (acc, p) => acc + (p.estimatedBudget || 0),
    0
  );

  const projectsByStage = constructionProperties.reduce((acc, p) => {
    acc[p.constructionStage] = (acc[p.constructionStage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Aggregate expenses for the chart
  const expenseCategories = (allExpenses || []).reduce((acc, exp) => {
    let cat = 'Other';
    const name = exp.itemName.toLowerCase();
    if (name.includes('cement') || name.includes('brick') || name.includes('sand')) cat = 'Materials';
    else if (name.includes('labour') || name.includes('work') || name.includes('payment')) cat = 'Labour';
    else if (name.includes('permit') || name.includes('fee')) cat = 'Permits';
    else if (name.includes('transport') || name.includes('fuel')) cat = 'Transport';
    
    acc[cat] = (acc[cat] || 0) + exp.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(expenseCategories).map(([category, amount]) => ({
    category,
    amount,
  }));

  // Truncate budget utilization without rounding up
  const budgetUtilizationRaw = totalPlannedBudget > 0 ? (totalConstructionCost / totalPlannedBudget) * 100 : 0;
  const budgetUtilization = Math.floor(budgetUtilizationRaw * 10) / 10;

  return (
    <div className="flex-1 space-y-6">
  
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">
            Construction Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">Development oversight for {user?.email}</p>
        </div>
  
        <div className="flex flex-wrap gap-2">
          <ImportUnderConstructionProperties />
          <AddConstructionPropertyWrapper />
        </div>
      </div>
  
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Active Projects"
          value={totalActiveProjects.toString()}
          helperText="Total under development"
          Icon={Construction}
        />
        <KpiCard
          title="Total Spent"
          value={formatCurrency(totalConstructionCost)}
          tooltipValue={formatFullCurrency(totalConstructionCost)}
          helperText="Across all active projects"
          Icon={Banknote}
        />
        <KpiCard
          title="Planned Budget"
          value={formatCurrency(totalPlannedBudget)}
          tooltipValue={formatFullCurrency(totalPlannedBudget)}
          helperText="Target project allocation"
          Icon={Landmark}
        />
        <KpiCard
          title="Primary Phase"
          value={
            Object.keys(projectsByStage).length > 0
              ? Object.entries(projectsByStage).sort((a, b) => b[1] - a[1])[0][0]
              : 'N/A'
          }
          helperText="Most active construction stage"
          Icon={GanttChartSquare}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
           <ConstructionExpenseBarChart data={chartData.length > 0 ? chartData : [
             { category: 'Materials', amount: 0 },
             { category: 'Labour', amount: 0 },
             { category: 'Transport', amount: 0 },
             { category: 'Other', amount: 0 },
           ]} />
        </div>
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <h3 className="text-lg font-headline font-semibold mb-2 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-primary" />
              Efficiency Insight
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              You are currently managing <strong>{totalActiveProjects}</strong> project(s). 
              {totalPlannedBudget > 0 ? ` Budget utilization is currently at ${budgetUtilization.toFixed(1)}%.` : ''}
            </p>
            <div className="space-y-4">
               <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                    <span>Portfolio Utilization</span>
                    <span>{budgetUtilization.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${Math.min(100, budgetUtilization)}%` }} 
                    />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-headline font-semibold flex items-center gap-2">
          <Landmark className="h-6 w-6 text-primary" />
          Project Portfolio
        </h2>
  
        {constructionProperties.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {constructionProperties.map((property) => (
              <PropertyListItem key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
            <p className="text-muted-foreground font-medium">
              No properties are currently under construction.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
