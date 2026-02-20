import { notFound } from 'next/navigation';
import {
  getPropertyById,
  getAllConstructionExpenses,
  getAllRentalIncomes,
  getAllMaintenanceExpenses,
  getCategories,
  getConstructionExpenses,
  getRentalIncomes,
  getMaintenanceExpenses,
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
  MapPin,
  Ruler,
  TrendingUp,
  Wrench,
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

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const propertyData = await getPropertyById(params.id);
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
  ] = await Promise.all([
    getAllConstructionExpenses(),
    getAllRentalIncomes(),
    getAllMaintenanceExpenses(),
    getCategories(),
    getConstructionExpenses(params.id),
    getRentalIncomes(params.id),
    getMaintenanceExpenses(params.id),
  ]);

  const property = calculatePropertyFinancials(
    propertyData,
    allConstructionExpenses,
    allRentalIncomes,
    allMaintenanceExpenses
  );

  const category = categories.find((c) => c.id === property.categoryId)?.name;

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
        <p className="font-medium">{value}</p>
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

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">{property.name}</h1>
          <p className="text-muted-foreground">{property.location}</p>
        </div>
        <Badge variant={property.type === 'Finished' ? 'default' : 'secondary'}>
          {property.type}
        </Badge>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {property.type === 'Finished' ? (
              <>
                <KpiCard
                  title="Net Profit"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  }).format(property.netProfit)}
                  helperText={
                    property.netProfit >= 0
                      ? 'Profit after all costs'
                      : 'Loss after all costs'
                  }
                  Icon={TrendingUp}
                />
                <KpiCard
                  title="Status"
                  value={property.status}
                  helperText={
                    property.status === 'Occupied'
                      ? `Tenant: ${property.tenantName}`
                      : 'Available for rent'
                  }
                  Icon={Building}
                />
                <KpiCard
                  title="Investment Recovery"
                  value={
                    property.totalInvestment > 0
                      ? `${(
                          (property.totalRentReceived /
                            property.totalInvestment) *
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
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  }).format(property.totalRentReceived)}
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
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  }).format(property.totalConstructionCost)}
                  helperText="On construction to date"
                  Icon={Banknote}
                />
                <KpiCard
                  title="Budget Utilization"
                  value={
                    property.estimatedBudget && property.estimatedBudget > 0
                      ? `${(
                          (property.totalConstructionCost /
                            property.estimatedBudget) *
                          100
                        ).toFixed(0)}%`
                      : 'N/A'
                  }
                  helperText={`Budget: ${new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    maximumFractionDigits: 0,
                  }).format(property.estimatedBudget || 0)}`}
                  Icon={GanttChartSquare}
                />
                <KpiCard
                  title="Construction Stage"
                  value={property.constructionStage}
                  helperText="Current phase of development"
                  Icon={Construction}
                />
                <KpiCard
                  title="Cost Overrun"
                  value={property.costOverrunAlert ? 'Detected' : 'None'}
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
              <DetailItem icon={Hash} label="Property Code" value={property.code} />
              <DetailItem
                icon={GanttChartSquare}
                label="Category"
                value={category || 'N/A'}
              />
              <DetailItem icon={Ruler} label="Size" value={property.size} />
              <DetailItem
                icon={Calendar}
                label="Date Created"
                value={new Date(property.createdAt).toLocaleDateString()}
              />

              {property.type === 'Finished' ? (
                <>
                  <DetailItem icon={Building} label="Status" value={property.status} />
                  <DetailItem
                    icon={DollarSign}
                    label="Monthly Rent"
                    value={new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(property.monthlyRent)}
                  />
                </>
              ) : (
                <>
                  <DetailItem
                    icon={GanttChartSquare}
                    label="Construction Stage"
                    value={property.constructionStage}
                  />
                  <DetailItem
                    icon={DollarSign}
                    label="Estimated Budget"
                    value={new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(property.estimatedBudget || 0)}
                  />
                </>
              )}
              <div className="md:col-span-3">
                <DetailItem
                  icon={FileText}
                  label="Description"
                  value={
                    <p className="whitespace-pre-line">{property.description}</p>
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
              {property.type === 'Finished' && (
                <InvestmentProgress
                  totalInvestment={property.totalInvestment}
                  rentReceived={property.totalRentReceived}
                />
              )}
              <div className="space-y-4 pt-4">
                <FinancialItem
                  label={
                    property.type === 'Finished'
                      ? 'Total Investment'
                      : 'Total Spent'
                  }
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(property.totalInvestment)}
                />
                <FinancialItem
                  label="Total Rent Received"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(property.totalRentReceived)}
                />
                <FinancialItem
                  label="Maintenance Costs"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(property.totalMaintenanceCost)}
                />
                <FinancialItem
                  label="Net Profit"
                  value={new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                  }).format(property.netProfit)}
                  isPositive={property.netProfit >= 0}
                />
              </div>
              <CostOverrunAlert reason={property.costOverrunAlert} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs
        defaultValue={
          property.type === 'Under Construction' ? 'construction' : 'income'
        }
      >
        <TabsList>
          {property.type === 'Under Construction' && (
            <TabsTrigger value="construction">
              Construction Expenses
            </TabsTrigger>
          )}
          {property.type === 'Finished' && (
            <TabsTrigger value="income">Rental Income</TabsTrigger>
          )}
          {property.type === 'Finished' && (
            <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          )}
        </TabsList>
        <TabsContent value="construction">
          <Card>
            <CardHeader>
              <CardTitle>Construction Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionsDataTable
                columns={constructionColumns}
                data={propertyConstructionExpenses}
              />
            </CardContent>
          </Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <TransactionsDataTable
                columns={maintenanceColumns}
                data={propertyMaintenanceExpenses}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
