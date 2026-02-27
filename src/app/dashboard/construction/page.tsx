
import { KpiCard } from '@/components/dashboard/kpi-card';
import { PropertyListItem } from '@/components/properties/property-list-item';
import {
  getProperties,
  getAllConstructionExpenses,
} from '@/lib/data';
import { calculatePropertyFinancials } from '@/lib/financials';
import { Construction, Banknote, GanttChartSquare, Landmark } from 'lucide-react';
import type { Property } from '@/lib/types';
import { ImportUnderConstructionProperties } from '@/components/properties/import-under-construction-properties';
import { AddConstructionPropertyWrapper } from '@/components/properties/add-construction-property-wrapper';
import { ConstructionExpenseBarChart } from '../reports/construction-expense-bar-chart';

export default async function ConstructionDashboardPage() {
  const propertiesData = await getProperties();
  const constructionExpenses = await getAllConstructionExpenses();

  const constructionProperties: Property[] = propertiesData
    .filter((p) => p.type === 'Under Construction')
    .map((p) =>
      calculatePropertyFinancials(
        p,
        constructionExpenses,
        [],
        []
      )
    );

  const totalActiveProjects = constructionProperties.length;
  const totalConstructionCost = constructionProperties.reduce(
    (acc, p) => acc + p.totalConstructionCost,
    0
  );
  
  const projectsByStage = constructionProperties.reduce((acc, p) => {
    acc[p.constructionStage] = (acc[p.constructionStage] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Aggregate expenses for the chart
  // Since individual expenses don't have categories yet, we'll mock some categories based on item names for the visual
  const expenseCategories = constructionExpenses.reduce((acc, exp) => {
    // Basic heuristic for demo purposes
    let cat = 'Other';
    const name = exp.itemName.toLowerCase();
    if (name.includes('cement') || name.includes('brick') || name.includes('sand')) cat = 'Materials';
    if (name.includes('labour') || name.includes('work') || name.includes('payment')) cat = 'Labour';
    if (name.includes('permit') || name.includes('fee')) cat = 'Permits';
    if (name.includes('transport') || name.includes('fuel')) cat = 'Transport';
    
    acc[cat] = (acc[cat] || 0) + exp.totalPrice;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(expenseCategories).map(([category, amount]) => ({
    category,
    amount,
  }));

  return (
    <div className="flex-1 space-y-6">
  
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold">
            Construction Dashboard
          </h1>
          <p className="text-muted-foreground">Monitor your active development projects and spending.</p>
        </div>
  
        <div className="flex gap-2">
          <ImportUnderConstructionProperties />
          <AddConstructionPropertyWrapper />
        </div>
      </div>
  
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Active Projects"
          value={totalActiveProjects.toString()}
          helperText="Under construction properties"
          Icon={Construction}
        />
        <KpiCard
          title="Total Spent to Date"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ZMW',
            maximumFractionDigits: 0,
          }).format(totalConstructionCost)}
          helperText="Aggregated construction costs"
          Icon={Banknote}
        />
        <KpiCard
          title="Top Construction Stage"
          value={
            Object.keys(projectsByStage).length > 0
              ? Object.entries(projectsByStage).sort((a, b) => b[1] - a[1])[0][0]
              : 'N/A'
          }
          helperText="Most frequent project status"
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
            <h3 className="text-lg font-headline font-semibold mb-2">Project Efficiency</h3>
            <p className="text-sm text-muted-foreground mb-4">You are currently managing {totalActiveProjects} project(s). Keep track of material deliveries and labour hours to avoid budget overruns.</p>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Materials</span>
                <span className="font-bold">65%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[65%]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-headline font-semibold mb-4 flex items-center gap-2">
          <Landmark className="h-6 w-6 text-primary" />
          Active Developments
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
