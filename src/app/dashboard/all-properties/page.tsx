import {
  getProperties,
  getAllConstructionExpenses,
  getAllRentalIncomes,
  getAllMaintenanceExpenses,
} from '@/lib/data';
import { calculatePropertyFinancials } from '@/lib/financials';
import { columns } from '@/components/properties/columns';
import { DataTable } from '@/components/properties/data-table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default async function AllPropertiesPage() {
  const propertiesData = await getProperties();
  const constructionExpenses = await getAllConstructionExpenses();
  const rentalIncomes = await getAllRentalIncomes();
  const maintenanceExpenses = await getAllMaintenanceExpenses();

  const allProperties = propertiesData.map(p => 
    calculatePropertyFinancials(p, constructionExpenses, rentalIncomes, maintenanceExpenses)
  );

  return (
    <Card>
        <CardHeader>
            <CardTitle className="font-headline text-2xl">All Properties</CardTitle>
            <CardDescription>View, manage, and track all your properties in one place.</CardDescription>
        </CardHeader>
        <CardContent>
            <DataTable columns={columns} data={allProperties} />
        </CardContent>
    </Card>
  );
}
