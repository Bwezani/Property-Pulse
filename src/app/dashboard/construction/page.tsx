import { KpiCard } from '@/components/dashboard/kpi-card';
import { PropertyListItem } from '@/components/properties/property-list-item';
import { AddConstructionPropertyForm } from '@/components/properties/add-construction-property-form';
import {
  getProperties,
  getAllConstructionExpenses,
  getAllRentalIncomes,
  getAllMaintenanceExpenses,
} from '@/lib/data';
import { calculatePropertyFinancials } from '@/lib/financials';
import { Construction, Banknote, GanttChartSquare } from 'lucide-react';
import type { Property } from '@/lib/types';
import { ImportUnderConstructionProperties } from '@/components/properties/import-under-construction-properties';
import { AddConstructionPropertyWrapper } from '@/components/properties/add-construction-property-wrapper';
import { ConstructionExpenseBarChart } from '../reports/construction-expense-bar-chart';
export default async function ConstructionDashboardPage() {
  const propertiesData = await getProperties();
  const constructionExpenses = await getAllConstructionExpenses();
  const rentalIncomes = await getAllRentalIncomes();
  const maintenanceExpenses = await getAllMaintenanceExpenses();

  const allProperties: Property[] = propertiesData.map((p) =>
    calculatePropertyFinancials(
      p,
      constructionExpenses,
      rentalIncomes,
      maintenanceExpenses
    )
  );

  const constructionProperties = allProperties.filter(
    (p) => p.type === 'Under Construction'
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

  const expenseSummary = [
    { category: 'Labour', amount: 120000 },
    { category: 'Materials', amount: 200000 },
    { category: 'Transport', amount: 30000 },
    { category: 'Permits', amount: 15000 },
  ];

  return (
    <div className="flex-1 space-y-4">
  
      {/* HEADER */}
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl font-headline font-bold">
          Construction Dashboard
        </h1>
  
        <div className="flex gap-2">
          <ImportUnderConstructionProperties />
          <AddConstructionPropertyWrapper />
        </div>
      </div>
  
      {/* KPI SECTION */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Active Projects"
          value={totalActiveProjects.toString()}
          helperText="Total properties under construction"
          Icon={Construction}
        />
        <KpiCard
          title="Total Spent"
          value={new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'ZMW',
            maximumFractionDigits: 0,
          }).format(totalConstructionCost)}
          helperText="Sum of all construction expenses"
          Icon={Banknote}
        />
        <KpiCard
          title="Most Common Stage"
          value={
            Object.keys(projectsByStage).length > 0
              ? Object.entries(projectsByStage).sort((a, b) => b[1] - a[1])[0][0]
              : 'N/A'
          }
          helperText="Most frequent construction stage"
          Icon={GanttChartSquare}
        />
      </div>

      {/* EXPENSE CHART */}

  
      {/* PROJECT LIST */}
      <div>
        <h2 className="text-2xl font-headline font-semibold my-4">
          Current Projects
        </h2>
  
        {constructionProperties.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {constructionProperties.map((property) => (
              <PropertyListItem key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border rounded-lg">
            <p className="text-muted-foreground">
              No properties are currently under construction.
            </p>
          </div>
        )}
      </div>
  
    </div>
  );
}
