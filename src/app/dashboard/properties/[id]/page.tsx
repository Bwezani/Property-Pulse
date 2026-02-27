
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
  LayoutGrid,
  Users,
} from 'lucide-react';
import { InvestmentProgress } from '@/components/properties/investment-progress';
import { CostOverrunAlert } from '@/components/expenses/cost-overrun-alert';
import { TransactionsDataTable } from '@/components/transactions/data-table';
import { constructionColumns } from '@/components/expenses/columns'; 
import { rentalIncomeColumns } from '@/components/income/rental/columns';
import { maintenanceColumns } from '@/components/expenses/maintenance/columns';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { AddConstructionExpenseForm } from '@/components/expenses/construction/add-form';
import { AddMaintenanceExpenseForm } from '@/components/expenses/maintenance/add-form';
import { EditUnitForm } from '@/components/properties/edit-unit-form';
import type { 
  Property, 
  ConstructionExpense, 
  RentalIncome, 
  MaintenanceExpense,
  ConstructionBudgetItem,
  MaintenanceBudgetItem,
  PropertyUnit
} from '@/lib/types';

export default function PropertyDetailPage() {
  const { id } = useParams() as { id: string };
  const db = useFirestore();
  const { user, isUserLoading: isAuthLoading } = useUser();

  const propertyRef = useMemoFirebase(() => {
    if (!db || !id) return null;
    return doc(db, 'finished_properties', id);
  }, [db, id]);
  const { data: rawProperty, isLoading: isPropLoading } = useDoc<Property>(propertyRef);

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

  const FinancialItem = ({ label, value, isPositive }: { label: string, value: string, isPositive?: boolean }) => (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`font-semibold text-lg ${isPositive === true ? 'text-green-600' : isPositive === false ? 'text-red-600' : ''}`}>
        {value}
      </p>
    </div>
  );

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
        <div className="flex items-center gap-2">
           <Badge variant={calculatedProperty.type === 'Finished' ? 'default' : 'secondary'} className="px-4 py-1">
            {calculatedProperty.type}
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
                  value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 0 }).format(calculatedProperty.netProfit)}
                  helperText={calculatedProperty.netProfit >= 0 ? 'Profit after all costs' : 'Loss after all costs'}
                  Icon={TrendingUp}
                />
                <KpiCard
                  title="Occupancy"
                  value={totalUnits > 1 ? `${occupiedUnits} / ${totalUnits} Units` : calculatedProperty.status}
                  helperText={totalUnits > 1 ? `${((occupiedUnits / totalUnits) * 100).toFixed(0)}% Occupancy rate` : `Tenant: ${calculatedProperty.tenantName || 'None'}`}
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
                  title="Construction Stage"
                  value={calculatedProperty.constructionStage}
                  helperText="Current phase of development"
                  Icon={Construction}
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
              {totalUnits > 1 && (
                <DetailItem icon={LayoutGrid} label="Total Units" value={`${totalUnits} Individual Spaces`} />
              )}
              {calculatedProperty.type === 'Finished' && totalUnits === 1 && (
                <DetailItem
                  icon={DollarSign}
                  label="Monthly Rent"
                  value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(calculatedProperty.monthlyRent || 0)}
                />
              )}
            </CardContent>
          </Card>

          {calculatedProperty.unitsList && calculatedProperty.unitsList.length > 0 && (
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-headline text-xl">Unit Inventory</CardTitle>
                  <CardDescription>Manage individual tenants and statuses for all units.</CardDescription>
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
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW' }).format(unit.monthlyRent)}
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

        <TabsContent value="income" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rental Income</CardTitle>
              <CardDescription>Automated monthly tracking for all occupied units.</CardDescription>
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
