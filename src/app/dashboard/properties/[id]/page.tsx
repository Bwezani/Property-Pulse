
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { 
  useFirestore, 
  useDoc, 
  useCollection, 
  useMemoFirebase, 
  useUser 
} from '@/firebase';
import { doc, collection, query, where } from 'firebase/firestore';
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
  Loader2,
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
import { ConstructionExpenseBarChart } from '@/app/dashboard/reports/construction-expense-bar-chart';
import type { 
  Property, 
  ConstructionExpense, 
  RentalIncome, 
  MaintenanceExpense,
  ConstructionBudgetItem,
  MaintenanceBudgetItem
} from '@/lib/types';

export default function PropertyDetailPage() {
  const { id } = useParams() as { id: string };
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  // 1. Fetch Property Data
  const propertyRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'finished_properties', id);
  }, [db, id]);
  const { data: rawProperty, isLoading: isPropLoading } = useDoc<Property>(propertyRef);

  // 2. Fetch Related Data (Expenses, Income, Budget)
  const qExpenses = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'construction_expenses'), where('propertyId', '==', id));
  }, [db, id]);
  const { data: constructionExpenses } = useCollection<ConstructionExpense>(qExpenses);

  const qIncomes = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'rental_incomes'), where('propertyId', '==', id));
  }, [db, id]);
  const { data: rentalIncomes } = useCollection<RentalIncome>(qIncomes);

  const qMaintenance = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'maintenance_expenses'), where('propertyId', '==', id));
  }, [db, id]);
  const { data: maintenanceExpenses } = useCollection<MaintenanceExpense>(qMaintenance);

  const qCBudget = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'construction_budget_items'), where('propertyId', '==', id));
  }, [db, id]);
  const { data: cBudgetItems } = useCollection<ConstructionBudgetItem>(qCBudget);

  const qMBudget = useMemoFirebase(() => {
    if (!db || !id) return null;
    return query(collection(db, 'maintenance_budget_items'), where('propertyId', '==', id));
  }, [db, id]);
  const { data: mBudgetItems } = useCollection<MaintenanceBudgetItem>(qMBudget);

  if (isAuthLoading || isPropLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!rawProperty) {
    return <div className="p-8 text-center">Property not found.</div>;
  }

  // 3. Calculate Financials
  const calculatedProperty = calculatePropertyFinancials(
    rawProperty,
    constructionExpenses || [],
    rentalIncomes || [],
    maintenanceExpenses || []
  );

  const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="font-medium text-foreground">{value}</div>
      </div>
    </div>
  );

  const FinancialItem = ({ label, value, isPositive }: { label: string, value: string, isPositive?: boolean }) => (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-semibold text-lg ${isPositive === true ? 'text-green-600' : isPositive === false ? 'text-red-600' : ''}`}>
        {value}
      </p>
    </div>
  );

  const chartData = (cBudgetItems || []).reduce((acc: any[], item) => {
    const category = item.category || 'Uncategorized';
    const existing = acc.find(a => a.category === category);
    if (existing) {
      existing.amount += item.actualCost || 0;
    } else {
      acc.push({ category, amount: item.actualCost || 0 });
    }
    return acc;
  }, []);

  const maintenanceChartData = (mBudgetItems || []).reduce((acc: any[], item) => {
    const category = item.category || 'Uncategorized';
    const existing = acc.find(a => a.category === category);
    if (existing) {
      existing.amount += item.actualCost || 0;
    } else {
      acc.push({ category, amount: item.actualCost || 0 });
    }
    return acc;
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">
            {calculatedProperty.name}
          </h1>
          <p className="text-muted-foreground">
            {calculatedProperty.location}
          </p>
        </div>
        <Badge variant={calculatedProperty.type === 'Finished' ? 'default' : 'secondary'} className="px-4 py-1">
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
                  value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 0 }).format(calculatedProperty.netProfit)}
                  helperText={calculatedProperty.netProfit >= 0 ? 'Profit after all costs' : 'Loss after all costs'}
                  Icon={TrendingUp}
                />
                <KpiCard
                  title="Status"
                  value={calculatedProperty.status}
                  helperText={calculatedProperty.status === 'Occupied' ? `Tenant: ${calculatedProperty.tenantName}` : 'Available for rent'}
                  Icon={Building}
                />
                <KpiCard
                  title="Investment Recovery"
                  value={calculatedProperty.totalInvestment > 0 ? `${((calculatedProperty.totalRentReceived / calculatedProperty.totalInvestment) * 100).toFixed(0)}%` : '0%'}
                  helperText="ROI progress"
                  Icon={BadgePercent}
                />
                <KpiCard
                  title="Total Rent Received"
                  value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 0 }).format(calculatedProperty.totalRentReceived)}
                  helperText="Lifetime gross rental income"
                  Icon={PiggyBank}
                />
              </>
            ) : (
              <>
                <KpiCard
                  title="Total Spent"
                  value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 0 }).format(calculatedProperty.totalConstructionCost)}
                  helperText="On construction to date"
                  Icon={Banknote}
                />
                <KpiCard
                  title="Budget Utilization"
                  value={calculatedProperty.estimatedBudget && calculatedProperty.estimatedBudget > 0 ? `${((calculatedProperty.totalConstructionCost / calculatedProperty.estimatedBudget) * 100).toFixed(0)}%` : 'N/A'}
                  helperText={`Budget: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 0 }).format(calculatedProperty.estimatedBudget || 0)}`}
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
          
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Property Details</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <DetailItem icon={Hash} label="Property Code" value={calculatedProperty.code} />
              <DetailItem icon={Ruler} label="Size" value={calculatedProperty.size} />
              <DetailItem
                icon={Calendar}
                label="Date Created"
                value={calculatedProperty.createdAt ? new Date(calculatedProperty.createdAt).toLocaleDateString() : 'N/A'}
              />
              {calculatedProperty.type === 'Finished' && (
                <DetailItem
                  icon={DollarSign}
                  label="Monthly Rent"
                  value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(calculatedProperty.monthlyRent || 0)}
                />
              )}
              <div className="md:col-span-3">
                <DetailItem
                  icon={FileText}
                  label="Description"
                  value={<div className="whitespace-pre-line text-muted-foreground">{calculatedProperty.description || 'No description provided.'}</div>}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Financial Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {calculatedProperty.type === 'Finished' && (
                <InvestmentProgress
                  totalInvestment={calculatedProperty.totalInvestment}
                  rentReceived={calculatedProperty.totalRentReceived}
                />
              )}
              <div className="space-y-4 pt-4 border-t">
                <FinancialItem
                  label={calculatedProperty.type === 'Finished' ? 'Initial Investment' : 'Total Spent'}
                  value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(calculatedProperty.totalInvestment)}
                />
                <FinancialItem
                  label="Total Rent Received"
                  value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(calculatedProperty.totalRentReceived)}
                />
                <FinancialItem
                  label="Maintenance Costs"
                  value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(calculatedProperty.totalMaintenanceCost)}
                />
                <div className="pt-2">
                   <FinancialItem
                    label="Net Profit"
                    value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(calculatedProperty.netProfit)}
                    isPositive={calculatedProperty.netProfit >= 0}
                  />
                </div>
              </div>
              <CostOverrunAlert reason={calculatedProperty.costOverrunAlert} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue={calculatedProperty.type === 'Under Construction' ? 'construction' : 'income'} className="w-full">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          {calculatedProperty.type === 'Under Construction' && <TabsTrigger value="construction">Construction</TabsTrigger>}
          {calculatedProperty.type === 'Finished' && <TabsTrigger value="income">Income</TabsTrigger>}
          {calculatedProperty.type === 'Finished' && <TabsTrigger value="maintenance">Maintenance</TabsTrigger>}
        </TabsList>

        <TabsContent value="construction" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Expenses</CardTitle>
              <AddConstructionExpenseForm propertyId={id} />
            </CardHeader>
            <CardContent>
              <TransactionsDataTable columns={constructionColumns} data={constructionExpenses || []} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Budget Tracking</CardTitle>
                <CardDescription>Estimated vs Actual costs per item.</CardDescription>
              </div>
              <AddConstructionBudgetItemForm propertyId={id} />
            </CardHeader>
            <CardContent className="space-y-6">
              <TransactionsDataTable columns={constructionBudgetColumns} data={cBudgetItems || []} />
              <div className="pt-6 border-t">
                <ConstructionExpenseBarChart data={chartData} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rental Income</CardTitle>
              <CardDescription>Track payments from tenants.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsDataTable columns={rentalIncomeColumns} data={rentalIncomes || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Maintenance Expenses</CardTitle>
              <AddMaintenanceExpenseForm propertyId={id} />
            </CardHeader>
            <CardContent>
              <TransactionsDataTable columns={maintenanceColumns} data={maintenanceExpenses || []} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Maintenance Budget</CardTitle>
                <CardDescription>Planning for repairs and upkeep.</CardDescription>
              </div>
              <AddMaintenanceBudgetItemForm propertyId={id} />
            </CardHeader>
            <CardContent className="space-y-6">
              <TransactionsDataTable columns={maintenanceBudgetColumns} data={mBudgetItems || []} />
              <div className="pt-6 border-t">
                <ConstructionExpenseBarChart data={maintenanceChartData} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
