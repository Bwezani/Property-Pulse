import Image from 'next/image';
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
import { PlaceHolderImagesMap } from '@/lib/placeholder-images';
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
  Hash
} from 'lucide-react';
import { InvestmentProgress } from '@/components/properties/investment-progress';
import { CostOverrunAlert } from '@/components/expenses/cost-overrun-alert';
import { TransactionsDataTable } from '@/components/transactions/data-table';
import { constructionColumns } from '@/components/expenses/construction/columns';
import { rentalIncomeColumns } from '@/components/income/rental/columns';
import { maintenanceColumns } from '@/components/expenses/maintenance/columns';

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
  const image = PlaceHolderImagesMap.get(property.imageId) || PlaceHolderImagesMap.get('default-img');

  const DetailItem = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: React.ReactNode }) => (
    <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-muted-foreground mt-1" />
        <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    </div>
  );

  const FinancialItem = ({ label, value, isPositive }: { label: string, value: string, isPositive?: boolean}) => (
    <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`font-semibold text-lg ${isPositive === true ? 'text-green-600' : isPositive === false ? 'text-red-600' : ''}`}>{value}</p>
    </div>
  );


  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold">{property.name}</h1>
          <p className="text-muted-foreground">{property.location}</p>
        </div>
        <Badge variant={property.type === 'Finished' ? 'default' : 'secondary'}>{property.type}</Badge>
      </header>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-0">
               <Image
                src={image!.imageUrl}
                alt={property.name}
                width={800}
                height={450}
                className="w-full object-cover rounded-t-lg aspect-video"
                data-ai-hint={image!.imageHint}
              />
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle className="font-headline">Property Details</CardTitle>
            </CardHeader>
             <CardContent className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                 <DetailItem icon={Hash} label="Property Code" value={property.code} />
                <DetailItem icon={GanttChartSquare} label="Category" value={category || 'N/A'} />
                <DetailItem icon={Ruler} label="Size" value={property.size} />
                <DetailItem icon={Calendar} label="Date Created" value={new Date(property.createdAt).toLocaleDateString()} />
                
                {property.type === 'Finished' ? (
                     <>
                        <DetailItem icon={Building} label="Status" value={property.status} />
                        <DetailItem icon={DollarSign} label="Monthly Rent" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(property.monthlyRent)} />
                     </>
                ) : (
                    <>
                        <DetailItem icon={GanttChartSquare} label="Construction Stage" value={property.constructionStage} />
                        <DetailItem icon={DollarSign} label="Estimated Budget" value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(property.estimatedBudget || 0)} />
                    </>
                )}
                 <div className="md:col-span-3">
                    <DetailItem icon={FileText} label="Description" value={<p className="whitespace-pre-line">{property.description}</p>} />
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
                    <InvestmentProgress totalInvestment={property.totalInvestment} rentReceived={property.totalRentReceived} />
                 )}
                 <div className="space-y-4 pt-4">
                    <FinancialItem 
                        label={property.type === 'Finished' ? "Total Investment" : "Total Spent"} 
                        value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(property.totalInvestment)} 
                    />
                     <FinancialItem 
                        label="Total Rent Received"
                        value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(property.totalRentReceived)} 
                    />
                    <FinancialItem 
                        label="Maintenance Costs"
                        value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(property.totalMaintenanceCost)} 
                    />
                     <FinancialItem 
                        label="Net Profit"
                        value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(property.netProfit)} 
                        isPositive={property.netProfit >= 0}
                    />
                 </div>
                 <CostOverrunAlert reason={property.costOverrunAlert} />
            </CardContent>
          </Card>
        </div>
      </div>

       <Tabs defaultValue={property.type === 'Under Construction' ? 'construction' : 'income'}>
        <TabsList>
          {property.type === 'Under Construction' && <TabsTrigger value="construction">Construction Expenses</TabsTrigger>}
          {property.type === 'Finished' && <TabsTrigger value="income">Rental Income</TabsTrigger>}
          {property.type === 'Finished' && <TabsTrigger value="maintenance">Maintenance</TabsTrigger>}
        </TabsList>
        <TabsContent value="construction">
           <Card>
                <CardHeader><CardTitle>Construction Expenses</CardTitle></CardHeader>
                <CardContent>
                    <TransactionsDataTable columns={constructionColumns} data={propertyConstructionExpenses} />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="income">
           <Card>
                <CardHeader><CardTitle>Rental Income</CardTitle></CardHeader>
                <CardContent>
                    <TransactionsDataTable columns={rentalIncomeColumns} data={propertyRentalIncomes} />
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="maintenance">
           <Card>
                <CardHeader><CardTitle>Maintenance Expenses</CardTitle></CardHeader>
                <CardContent>
                    <TransactionsDataTable columns={maintenanceColumns} data={propertyMaintenanceExpenses} />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
