import { MonthlySummaryChart } from '@/components/dashboard/reports/monthly-summary-chart'
import { ProfitLossChart } from '@/components/dashboard/reports/profit-loss-chart'
import {
  getProperties,
  getAllConstructionExpenses,
  getAllRentalIncomes,
  getAllMaintenanceExpenses,
} from '@/lib/data';
import { calculatePropertyFinancials } from '@/lib/financials';

export default async function ReportsPage() {
    const propertiesData = await getProperties();
    const constructionExpenses = await getAllConstructionExpenses();
    const rentalIncomes = await getAllRentalIncomes();
    const maintenanceExpenses = await getAllMaintenanceExpenses();

    const allProperties = propertiesData.map(p => 
        calculatePropertyFinancials(p, constructionExpenses, rentalIncomes, maintenanceExpenses)
    );

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-headline font-bold">Financial Reports</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <MonthlySummaryChart incomes={rentalIncomes} expenses={maintenanceExpenses} />
               <ProfitLossChart properties={allProperties} />
            </div>
        </div>
    )
}
