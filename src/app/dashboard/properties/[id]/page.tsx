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
import { Progress } from '@/components/ui/progress';
import {
  Building,
  Calendar,
  DollarSign,
  Ruler,
  TrendingUp,
  Hash,
  PiggyBank,
  BadgePercent,
  Banknote,
  Construction,
  Loader2,
  LayoutGrid,
  Users,
  Wallet,
  MapPin,
} from 'lucide-react';
import { InvestmentProgress } from '@/components/properties/investment-progress';
import { TransactionsDataTable } from '@/components/transactions/data-table';
import { constructionColumns } from '@/components/expenses/construction/columns'; 
import { rentalIncomeColumns } from '@/components/income/rental/columns';
import { maintenanceColumns } from '@/components/expenses/maintenance/columns';
import { constructionBudgetColumns } from '@/components/expenses/construction/budget-columns';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { AddConstructionExpenseForm } from '@/components/expenses/construction/add-form';
import { AddMaintenanceExpenseForm } from '@/components/expenses/maintenance/add-form';
import { AddConstructionBudgetItemForm } from '@/components/expenses/construction/add-budget-form';
import { EditUnitForm } from '@/components/properties/edit-unit-form';
import type { 
  Property, 
  ConstructionExpense, 
  RentalIncome, 
  MaintenanceExpense,
  ConstructionBudgetItem
} from '@/lib/types';
import { formatCurrency, formatFullCurrency } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function PropertyDetailPage() {
  const { id } = useParams() as { id: string };
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  const finishedRef = useMemoFirebase(() => {
    if (!db || !id || !user) return null;
    return doc(db, 'users', user.uid, 'finished_properties', id);
  }, [db, id, user]);
  const { data: finishedProp, isLoading: isFinishedLoading } = useDoc<Property>(finishedRef);

  const constructionRef = useMemoFirebase(() => {
    if (!db || !id || !user) return null;
    return doc(db, 'users', user.uid, 'construction_properties', id);
  }, [db, id, user]);
  const { data: constructionProp, isLoading: isConstructionLoading } = useDoc<Property>(constructionRef);

  const qExpenses = useMemoFirebase(() => {
    if (!db || !id || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'construction_expenses'), 
      where('propertyId', '==', id),
      where('userId', '==', user.uid)
    );
  }, [db, id, user]);
  const { data: constructionExpenses } = useCollection<ConstructionExpense>(qExpenses);

  const qIncomes = useMemoFirebase(() => {
    if (!db || !id || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'rental_incomes'), 
      where('propertyId', '==', id),
      where('userId', '==', user.uid)
    );
  }, [db, id, user]);
  const { data: rentalIncomes } = useCollection<RentalIncome>(qIncomes);

  const qMaintenance = useMemoFirebase(() => {
    if (!db || !id || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'maintenance_expenses'), 
      where('propertyId', '==', id),
      where('userId', '==', user.uid)
    );
  }, [db, id, user]);
  const { data: maintenanceExpenses } = useCollection<MaintenanceExpense>(qMaintenance);

  const qBudget = useMemoFirebase(() => {
    if (!db || !id || !user) return null;
    return query(
      collection(db, 'users', user.uid, 'construction_budget_items'), 
      where('propertyId', '==', id),
      where('userId', '==', user.uid)
    );
  }, [db, id, user]);
  const { data: budgetItems } = useCollection<ConstructionBudgetItem>(qBudget);

  if (isAuthLoading || isFinishedLoading || isConstructionLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const rawProperty = finishedProp || constructionProp;

  if (!rawProperty) {
    return <div className="p-8 text-center">Property not found.</div>;
  }

  const calculatedProperty = calculatePropertyFinancials(
    rawProperty,
    constructionExpenses || [],
    rentalIncomes || [],
    maintenanceExpenses || []
  );

  const occupiedUnits = calculatedProperty.unitsList?.filter(u => u.status === 'Occupied').length || 0;
  const totalUnits = calculatedProperty.units || calculatedProperty.unitsList?.length || 1;

  const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-3">
      <Icon className="h-5 w-5 text-muted-foreground mt-1" />
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="font-medium text-foreground">{value}</div>
      </div>
    </div>
  );

  const FinancialItem = ({ label, value, fullValue, isPositive }: { label: string, value: string, fullValue: string, isPositive?: boolean }) => (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className={`font-semibold text-lg cursor-help ${isPositive === true ? 'text-green-600' : isPositive === false ? 'text-red-600' : ''}`}>
              {value}
            </p>
          </TooltipTrigger>
          <TooltipContent>
            <p>{fullValue}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

  // Truncate percentages without rounding
  const recoveryProgressRaw = calculatedProperty.totalInvestment > 0 ? (calculatedProperty.totalRentReceived / calculatedProperty.totalInvestment) * 100 : 0;
  const recoveryProgress = Math.floor(recoveryProgressRaw * 10) / 10;
  
  const budgetUtilizationRaw = calculatedProperty.estimatedBudget ? (calculatedProperty.totalConstructionCost / calculatedProperty.estimatedBudget) * 100 : 0;
  const budgetUtilization = Math.floor(budgetUtilizationRaw * 10) / 10;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <header className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">
            {calculatedProperty.name}
          </h1>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{calculatedProperty.location}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant={calculatedProperty.type === 'Finished' ? 'default' : 'secondary'} className="px-4 py-1 text-sm">
            {calculatedProperty.type === 'Finished' ? 'Finished Property' : `Development: ${calculatedProperty.constructionStage}`}
          </Badge>
          {totalUnits > 1 && (
            <Badge variant="outline" className="border-primary text-primary px-3 py-1 flex items-center gap-1">
              <LayoutGrid className="h-3 w-3" />
              {totalUnits} Units
            </Badge>
          )}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {calculatedProperty.type === 'Finished' ? (
              <>
                <KpiCard
                  title="Net Profit"
                  value={formatCurrency(calculatedProperty.netProfit)}
                  tooltipValue={formatFullCurrency(calculatedProperty.netProfit)}
                  helperText={calculatedProperty.netProfit >= 0 ? 'Profit after all costs' : 'Loss after all costs'}
                  Icon={TrendingUp}
                />
                <KpiCard
                  title="Occupancy"
                  value={totalUnits > 1 ? `${occupiedUnits} / ${totalUnits} Units` : calculatedProperty.status}
                  helperText={totalUnits > 1 ? `${((occupiedUnits / totalUnits) * 100).toFixed(1)}% Occupancy rate` : `Tenant: ${calculatedProperty.tenantName || 'None'}`}
                  Icon={Building}
                />
                <KpiCard
                  title="Investment Recovery"
                  value={`${recoveryProgress.toFixed(1)}%`}
                  helperText="ROI progress"
                  Icon={BadgePercent}
                />
                <KpiCard
                  title="Total Rent Received"
                  value={formatCurrency(calculatedProperty.totalRentReceived)}
                  tooltipValue={formatFullCurrency(calculatedProperty.totalRentReceived)}
                  helperText="Lifetime gross rental income"
                  Icon={PiggyBank}
                />
              </>
            ) : (
              <>
                <KpiCard
                  title="Total Spent"
                  value={formatCurrency(calculatedProperty.totalConstructionCost)}
                  tooltipValue={formatFullCurrency(calculatedProperty.totalConstructionCost)}
                  helperText="Total project costs to date"
                  Icon={Banknote}
                />
                <KpiCard
                  title="Project Budget"
                  value={formatCurrency(calculatedProperty.estimatedBudget || 0)}
                  tooltipValue={formatFullCurrency(calculatedProperty.estimatedBudget || 0)}
                  helperText="Initial projected cost"
                  Icon={Wallet}
                />
                <KpiCard
                  title="Budget Utilization"
                  value={`${budgetUtilization.toFixed(1)}%`}
                  helperText="Percentage of budget used"
                  Icon={BadgePercent}
                />
                <KpiCard
                  title="Current Stage"
                  value={calculatedProperty.constructionStage}
                  helperText="Current project status"
                  Icon={Construction}
                />
              </>
            )}
          </div>
          
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="font-headline text-xl">General Overview</CardTitle>
            </CardHeader>
            <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
              <DetailItem icon={Hash} label="Reference Code" value={calculatedProperty.code} />
              <DetailItem icon={Ruler} label="Property Size" value={calculatedProperty.size} />
              <DetailItem
                icon={Calendar}
                label="Date Registered"
                value={calculatedProperty.createdAt ? new Date(calculatedProperty.createdAt).toLocaleDateString() : 'N/A'}
              />
              {totalUnits > 1 && (
                <DetailItem icon={LayoutGrid} label="Configuration" value={`${totalUnits} Unit Multi-Dwelling`} />
              )}
              {calculatedProperty.type === 'Finished' && totalUnits === 1 && (
                <DetailItem
                  icon={DollarSign}
                  label="Monthly Rent"
                  value={formatCurrency(calculatedProperty.monthlyRent || 0)}
                />
              )}
            </CardContent>
          </Card>

          {calculatedProperty.unitsList && calculatedProperty.unitsList.length > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-xl">Unit Inventory</CardTitle>
                  <CardDescription>Status and tenant mapping for all individual units.</CardDescription>
                </div>
                <Users className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 border-b">
                      <tr>
                        <th className="p-3 text-left font-medium">Unit</th>
                        <th className="p-3 text-left font-medium">Status</th>
                        <th className="p-3 text-left font-medium">Tenant</th>
                        <th className="p-3 text-right font-medium">Monthly Rent</th>
                        <th className="p-3 text-center font-medium">Due Day</th>
                        <th className="p-3 text-right font-medium w-16">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {calculatedProperty.unitsList.map((unit) => (
                        <tr key={unit.id} className="hover:bg-muted/30 transition-colors">
                          <td className="p-3 font-medium">{unit.unitName}</td>
                          <td className="p-3">
                            <Badge variant={unit.status === 'Occupied' ? 'default' : 'secondary'}>
                              {unit.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                             <div className="flex flex-col">
                               <span>{unit.tenantName || '-'}</span>
                               <span className="text-xs text-muted-foreground">{unit.tenantContact}</span>
                             </div>
                          </td>
                          <td className="p-3 text-right font-mono">
                            {formatCurrency(unit.monthlyRent)}
                          </td>
                          <td className="p-3 text-center text-muted-foreground">{unit.paymentDueDay}</td>
                          <td className="p-3 text-right">
                            <EditUnitForm property={calculatedProperty} unit={unit} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Card className="border-border/50 shadow-md">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Financial Health</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {calculatedProperty.type === 'Finished' ? (
                <InvestmentProgress
                  totalInvestment={calculatedProperty.totalInvestment}
                  rentReceived={calculatedProperty.totalRentReceived}
                />
              ) : (
                <div className="space-y-2">
                   <div className="flex justify-between text-xs font-medium">
                      <span className="text-muted-foreground">Project Spending</span>
                      <span>{budgetUtilization.toFixed(1)}%</span>
                   </div>
                   <Progress value={Math.min(100, budgetUtilization)} className="h-2" />
                </div>
              )}
              <div className="space-y-4 pt-4 border-t">
                <FinancialItem
                  label={calculatedProperty.type === 'Finished' ? 'Initial Investment' : 'Actual Spent'}
                  value={formatCurrency(calculatedProperty.type === 'Finished' ? calculatedProperty.totalInvestment : calculatedProperty.totalConstructionCost)}
                  fullValue={formatFullCurrency(calculatedProperty.type === 'Finished' ? calculatedProperty.totalInvestment : calculatedProperty.totalConstructionCost)}
                />
                {calculatedProperty.type === 'Finished' && (
                  <>
                    <FinancialItem
                      label="Total Rent Received"
                      value={formatCurrency(calculatedProperty.totalRentReceived)}
                      fullValue={formatFullCurrency(calculatedProperty.totalRentReceived)}
                    />
                    <FinancialItem
                      label="Maintenance Costs"
                      value={formatCurrency(calculatedProperty.totalMaintenanceCost)}
                      fullValue={formatFullCurrency(calculatedProperty.totalMaintenanceCost)}
                    />
                    <div className="pt-2">
                      <FinancialItem
                        label="Net Profit"
                        value={formatCurrency(calculatedProperty.netProfit)}
                        fullValue={formatFullCurrency(calculatedProperty.netProfit)}
                        isPositive={calculatedProperty.netProfit >= 0}
                      />
                    </div>
                  </>
                )}
                {calculatedProperty.type === 'Under Construction' && (
                  <FinancialItem
                    label="Remaining Budget"
                    value={formatCurrency(Math.max(0, (calculatedProperty.estimatedBudget || 0) - calculatedProperty.totalConstructionCost))}
                    fullValue={formatFullCurrency(Math.max(0, (calculatedProperty.estimatedBudget || 0) - calculatedProperty.totalConstructionCost))}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs defaultValue={calculatedProperty.type === 'Under Construction' ? 'construction' : 'income'} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          {calculatedProperty.type === 'Under Construction' && <TabsTrigger value="construction">Expenditure</TabsTrigger>}
          {calculatedProperty.type === 'Under Construction' && <TabsTrigger value="budget">Project Budget</TabsTrigger>}
          {calculatedProperty.type === 'Finished' && <TabsTrigger value="income">Rental Income</TabsTrigger>}
          {calculatedProperty.type === 'Finished' && <TabsTrigger value="maintenance">Maintenance</TabsTrigger>}
        </TabsList>

        <TabsContent value="construction" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Construction Expenditure</CardTitle>
                <CardDescription>Detailed log of all material, labour, and transport costs.</CardDescription>
              </div>
              <AddConstructionExpenseForm propertyId={calculatedProperty.id} />
            </CardHeader>
            <CardContent>
              <TransactionsDataTable columns={constructionColumns} data={constructionExpenses || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="budget" className="mt-6 space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Projected Budget</CardTitle>
                <CardDescription>Define planned costs for materials and labour to track against actuals.</CardDescription>
              </div>
              <AddConstructionBudgetItemForm propertyId={calculatedProperty.id} />
            </CardHeader>
            <CardContent>
              <TransactionsDataTable columns={constructionBudgetColumns} data={budgetItems || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="income" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rental Income Log</CardTitle>
              <CardDescription>Consolidated monthly tracking for all occupied units.</CardDescription>
            </CardHeader>
            <CardContent>
              <TransactionsDataTable columns={rentalIncomeColumns} data={rentalIncomes || []} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Maintenance Log</CardTitle>
                <CardDescription>Track repairs and ongoing utility costs for finished units.</CardDescription>
              </div>
              <AddMaintenanceExpenseForm property={calculatedProperty} />
            </CardHeader>
            <CardContent>
              <TransactionsDataTable columns={maintenanceColumns} data={maintenanceExpenses || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
