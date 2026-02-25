import { notFound } from 'next/navigation';
import type React from 'react';
import {
  getPropertyById,
  getAllConstructionExpenses,
  getAllRentalIncomes,
  getAllMaintenanceExpenses,
  getCategories,
  getConstructionExpenses,
  getRentalIncomes,
  getMaintenanceExpenses,
  getConstructionBudgetItems,
  getMaintenanceBudgetItems,
} from '@/lib/data';
import { calculatePropertyFinancials } from '@/lib/financials';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building,
  Calendar,
  DollarSign,
  FileText,
  GanttChartSquare,
  Ruler,
  TrendingUp,
  Hash,
  PiggyBank,
  BadgePercent,
  Banknote,
  AlertCircle,
  Construction,
} from 'lucide-react';
import { InvestmentProgress } from '@/components/properties/investment-progress';
import { CostOverrunAlert } from '@/components/expenses/cost-overrun-alert';
import { TransactionsDataTable } from '@/components/transactions/data-table';
import { constructionColumns } from '@/components/expenses/construction/columns';
import { rentalIncomeColumns } from '@/components/income/rental/columns';
import { maintenanceColumns } from '@/components/expenses/maintenance/columns';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { AddConstructionExpenseForm } from '@/components/expenses/construction/add-form';
import { AddMaintenanceExpenseForm } from '@/components/expenses/maintenance/add-form';
import { constructionBudgetColumns } from '@/components/expenses/construction/budget-columns';
import { maintenanceBudgetColumns } from '@/components/expenses/maintenance/budget-columns';
import { AddConstructionBudgetItemForm } from '@/components/expenses/construction/add-budget-form';
import { AddMaintenanceBudgetItemForm } from '@/components/expenses/maintenance/add-budget-form';
import { ConstructionExpenseBarChart } 
from '@/app/dashboard/reports/construction-expense-bar-chart';
export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const propertyData = await getPropertyById(id);
  if (!propertyData) {
    notFound();
  }

  const [
    allConstructionExpenses,
    allRentalIncomes,
    allMaintenanceExpenses,
    categories,
    propertyConstructionExpenses,
    propertyRentalIncomes,
    propertyMaintenanceExpenses,
    propertyConstructionBudgetItems,
    propertyMaintenanceBudgetItems,
  ] = await Promise.all([
    getAllConstructionExpenses(),
    getAllRentalIncomes(),
    getAllMaintenanceExpenses(),
    getCategories(),
    getConstructionExpenses(id),
    getRentalIncomes(id),
    getMaintenanceExpenses(id),
    getConstructionBudgetItems(id),
    getMaintenanceBudgetItems(id),
  ]);

  
  const calculatedProperty = calculatePropertyFinancials(
    propertyData,
    allConstructionExpenses,
    allRentalIncomes,
    allMaintenanceExpenses
  );

  const category =
    categories.find((c) => c.id === calculatedProperty.categoryId)?.name ||
    'N/A';

  const DetailItem = ({
    icon: Icon,
    label,
    value,
  }: {
    icon: React.ElementType;
    label: string;
    value: React.ReactNode;
  }) => (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );

  const FinancialItem = ({
    label,
    value,
    isPositive,
  }: {
    label: string;
    value: string;
    isPositive?: boolean;
  }) => (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p
        className={`font-semibold text-lg ${
          isPositive === true
            ? 'text-green-600'
            : isPositive === false
            ? 'text-red-600'
            : ''
        }`}
      >
        {value}
      </p>
    </div>
  );

  const categoryTotals = propertyConstructionBudgetItems.reduce(
    (acc: Record<string, number>, item) => {
      const category = item.category || 'Uncategorized';
  
      if (!acc[category]) {
        acc[category] = 0;
      }
  
      acc[category] += item.actualCost ?? 0;
  
      return acc;
    },
    {}
  );
  
  const chartData = Object.entries(categoryTotals).map(
    ([category, total]) => ({
      category,
      amount: total,
    })
  );
  
  

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">
            {calculatedProperty.name}
          </h1>
          <p className="text-muted-foreground">
            {calculatedProperty.location}
          </p>
        </div>
        <Badge
          variant={
            calculatedProperty.type === 'Finished'
              ? 'default'
              : 'secondary'
          }
        >
          {calculatedProperty.type}
        </Badge>
      </header>


      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {calculatedProperty.type === 'Finished' ? (
              <>
                <KpiCard
                  title="Net Profit"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ZMW',
                    maximumFractionDigits: 0,
                  }).format(calculatedProperty.netProfit)}
                  helperText={
                    calculatedProperty.netProfit >= 0
                      ? 'Profit after all costs'
                      : 'Loss after all costs'
                  }
                  Icon={TrendingUp}
                />
                <KpiCard
                  title="Status"
                  value={calculatedProperty.status}
                  helperText={
                    calculatedProperty.status === 'Occupied'
                      ? `Tenant: ${calculatedProperty.tenantName}`
                      : 'Available for rent'
                  }
                  Icon={Building}
                />
                <KpiCard
                  title="Investment Recovery"
                  value={
                    calculatedProperty.totalInvestment > 0
                      ? `${(
                          (calculatedProperty.totalRentReceived /
                            calculatedProperty.totalInvestment) *
                          100
                        ).toFixed(0)}%`
                      : 'N/A'
                  }
                  helperText="ROI progress"
                  Icon={BadgePercent}
                />
                <KpiCard
                  title="Total Rent Received"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ZMW',
                    maximumFractionDigits: 0,
                  }).format(calculatedProperty.totalRentReceived)}
                  helperText="Lifetime gross rental income"
                  Icon={PiggyBank}
                />
              </>
            ) : (
              <>
                <KpiCard
                  title="Total Spent"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ZMW',
                    maximumFractionDigits: 0,
                  }).format(calculatedProperty.totalConstructionCost)}
                  helperText="On construction to date"
                  Icon={Banknote}
                />
                <KpiCard
                  title="Budget Utilization"
                  value={
                    calculatedProperty.estimatedBudget && calculatedProperty.estimatedBudget > 0
                      ? `${(
                          (calculatedProperty.totalConstructionCost /
                            calculatedProperty.estimatedBudget) *
                          100
                        ).toFixed(0)}%`
                      : 'N/A'
                  }
                  helperText={`Budget: ${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ZMW',
                    maximumFractionDigits: 0,
                  }).format(calculatedProperty.estimatedBudget || 0)}`}
                  Icon={GanttChartSquare}
                />
                <KpiCard
                  title="Construction Stage"
                  value={calculatedProperty.constructionStage}
                  helperText="Current phase of development"
                  Icon={Construction}
                />
                <KpiCard
                  title="Cost Overrun"
                  value={calculatedProperty.costOverrunAlert ? 'Detected' : 'None'}
                  helperText="AI-powered analysis"
                  Icon={AlertCircle}
                />
              </>
            )}
          </div>
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Property Details</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <DetailItem icon={Hash} label="Property Code" value={calculatedProperty.code} />
              <DetailItem
                icon={GanttChartSquare}
                label="Category"
                value={category || 'N/A'}
              />
              <DetailItem icon={Ruler} label="Size" value={calculatedProperty.size} />
              <DetailItem
                icon={Calendar}
                label="Date Created"
                value={new Date(calculatedProperty.createdAt).toLocaleDateString()}
              />

              {calculatedProperty.type === 'Finished' ? (
                <>
                  <DetailItem icon={Building} label="Status" value={calculatedProperty.status} />
                  <DetailItem
                    icon={DollarSign}
                    label="Monthly Rent"
                    value={new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'ZMW',
                    }).format(calculatedProperty.monthlyRent)}
                  />
                </>
              ) : (
                <>
                  <DetailItem
                    icon={GanttChartSquare}
                    label="Construction Stage"
                    value={calculatedProperty.constructionStage}
                  />
                  <DetailItem
                    icon={DollarSign}
                    label="Estimated Budget"
                    value={new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'ZMW',
                    }).format(calculatedProperty.estimatedBudget || 0)}
                  />
                </>
              )}
              <div className="md:col-span-3">
                <DetailItem
                  icon={FileText}
                  label="Description"
                  value={
                    <p className="whitespace-pre-line">{calculatedProperty.description}</p>
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-headline">Financial Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {calculatedProperty.type === 'Finished' && (
                <InvestmentProgress
                  totalInvestment={calculatedProperty.totalInvestment}
                  rentReceived={calculatedProperty.totalRentReceived}
                />
              )}
              <div className="space-y-4 pt-4">
                <FinancialItem
                  label={
                    calculatedProperty.type === 'Finished'
                      ? 'Total Investment'
                      : 'Total Spent'
                  }
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ZMW',
                  }).format(calculatedProperty.totalInvestment)}
                />
                <FinancialItem
                  label="Total Rent Received"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ZMW',
                  }).format(calculatedProperty.totalRentReceived)}
                />
                <FinancialItem
                  label="Maintenance Costs"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ZMW',
                  }).format(calculatedProperty.totalMaintenanceCost)}
                />
                <FinancialItem
                  label="Net Profit"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'ZMW',
                  }).format(calculatedProperty.netProfit)}
                  isPositive={calculatedProperty.netProfit >= 0}
                />
              </div>
              <CostOverrunAlert reason={calculatedProperty.costOverrunAlert} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs
        defaultValue={
          calculatedProperty.type === 'Under Construction' ? 'construction' : 'income'
        }
      >
        <TabsList>
          {calculatedProperty.type === 'Under Construction' && (
            <TabsTrigger value="construction">
              Construction Expenses
            </TabsTrigger>
          )}
          {calculatedProperty.type === 'Finished' && (
            <TabsTrigger value="income">Rental Income</TabsTrigger>
          )}
          {calculatedProperty.type === 'Finished' && (
            <TabsTrigger value="maintenance">Expenses</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="construction">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Construction Expenses</CardTitle>
                <AddConstructionExpenseForm propertyId={calculatedProperty.id} />
              </CardHeader>
              <CardContent>
                <TransactionsDataTable
                  columns={constructionColumns}
                  data={propertyConstructionExpenses}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Construction Budget</CardTitle>
                  <CardDescription>
                    Plan your construction items and compare estimated costs with actual spending.
                  </CardDescription>
                </div>
                <AddConstructionBudgetItemForm propertyId={calculatedProperty.id} />
              </CardHeader>
              <CardContent className="space-y-4">
                <TransactionsDataTable
                  columns={constructionBudgetColumns}
                  data={propertyConstructionBudgetItems}
                />
                
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div>
                    Estimated Total:{' '}
                    <span className="font-medium text-foreground">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'ZMW',
                        maximumFractionDigits: 0,
                      }).format(
                        propertyConstructionBudgetItems.reduce(
                          (sum, item) => sum + item.estimatedCost,
                          0
                        )
                      )}
                    </span>
                  </div>
                  <div>
                    Actual Total:{' '}
                    <span className="font-medium text-foreground">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'ZMW',
                        maximumFractionDigits: 0,
                      }).format(
                        propertyConstructionBudgetItems.reduce(
                          (sum, item) => sum + item.actualCost,
                          0
                        )
                      )}
                    </span>
                  </div>
                  <div>
                    Difference:{' '}
                    <span className="font-medium text-foreground">
                      {(() => {
                        const estimated = propertyConstructionBudgetItems.reduce(
                          (sum, item) => sum + item.estimatedCost,
                          0
                        );
                        const actual = propertyConstructionBudgetItems.reduce(
                          (sum, item) => sum + item.actualCost,
                          0
                        );
                        const diff = actual - estimated;
                        const label =
                          diff > 0
                            ? 'Over Budget'
                            : diff < 0
                            ? 'Under Budget'
                            : 'On Budget';
                        return `${label} (${new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'ZMW',
                          maximumFractionDigits: 0,
                        }).format(diff)})`;
                      })()}
                    </span>
                  </div>
                </div>
                <div className="mt-8">
  <ConstructionExpenseBarChart data={chartData} />
</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="income">
          <Card>
            <CardHeader>
              <CardTitle>Rental Income</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionsDataTable
                columns={rentalIncomeColumns}
                data={propertyRentalIncomes}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="maintenance">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Expenses</CardTitle>
                <AddMaintenanceExpenseForm propertyId={calculatedProperty.id} />
              </CardHeader>
              <CardContent>
                <TransactionsDataTable
                  columns={maintenanceColumns}
                  data={propertyMaintenanceExpenses}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Budget</CardTitle>
                  <CardDescription>
                    Plan any property-related items (repairs, improvements, decor) and track if you stayed within budget.
                  </CardDescription>
                </div>
                <AddMaintenanceBudgetItemForm propertyId={calculatedProperty.id} />
              </CardHeader>
              <CardContent className="space-y-4">
                <TransactionsDataTable
                  columns={maintenanceBudgetColumns}
                  data={propertyMaintenanceBudgetItems}
                />
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div>
                    Estimated Total:{' '}
                    <span className="font-medium text-foreground">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'ZMW',
                        maximumFractionDigits: 0,
                      }).format(
                        propertyMaintenanceBudgetItems.reduce(
                          (sum, item) => sum + item.estimatedCost,
                          0
                        )
                      )}
                    </span>
                  </div>
                  <div>
                    Actual Total:{' '}
                    <span className="font-medium text-foreground">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'ZMW',
                        maximumFractionDigits: 0,
                      }).format(
                        propertyMaintenanceBudgetItems.reduce(
                          (sum, item) => sum + item.actualCost,
                          0
                        )
                      )}
                    </span>
                  </div>
                  <div>
                    Difference:{' '}
                    <span className="font-medium text-foreground">
                      {(() => {
                        const estimated = propertyMaintenanceBudgetItems.reduce(
                          (sum, item) => sum + item.estimatedCost,
                          0
                        );
                        const actual = propertyMaintenanceBudgetItems.reduce(
                          (sum, item) => sum + item.actualCost,
                          0
                        );
                        const diff = actual - estimated;
                        const label =
                          diff > 0
                            ? 'Over Budget'
                            : diff < 0
                            ? 'Under Budget'
                            : 'On Budget';
                        return `${label} (${new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'ZMW',
                          maximumFractionDigits: 0,
                        }).format(diff)})`;
                      })()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
