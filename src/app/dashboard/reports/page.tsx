'use client';

import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { MonthlySummaryChart } from '@/components/dashboard/reports/monthly-summary-chart';
import { ProfitLossChart } from '@/components/dashboard/reports/profit-loss-chart';
import { calculatePropertyFinancials } from '@/lib/financials';
import { Loader2 } from 'lucide-react';
import type { Property, RentalIncome, MaintenanceExpense, ConstructionExpense } from '@/lib/types';

export default function ReportsPage() {
    const db = useFirestore();
    const { user, isUserLoading: isAuthLoading } = useUser();

    // Fetch user-specific properties
    const finishedPropsQuery = useMemoFirebase(() => {
        if (!db || !user) return null;
        return query(collection(db, 'finished_properties'), where('userId', '==', user.uid));
    }, [db, user]);
    const { data: finishedProps, isLoading: isPropsLoading } = useCollection<Property>(finishedPropsQuery);

    // Fetch user-specific rental incomes
    const incomesQuery = useMemoFirebase(() => {
        if (!db || !user) return null;
        return query(collection(db, 'rental_incomes'), where('userId', '==', user.uid));
    }, [db, user]);
    const { data: rentalIncomes, isLoading: isIncomesLoading } = useCollection<RentalIncome>(incomesQuery);

    // Fetch user-specific maintenance expenses
    const maintenanceQuery = useMemoFirebase(() => {
        if (!db || !user) return null;
        return query(collection(db, 'maintenance_expenses'), where('userId', '==', user.uid));
    }, [db, user]);
    const { data: maintenanceExpenses, isLoading: isMaintenanceLoading } = useCollection<MaintenanceExpense>(maintenanceQuery);

    // Fetch user-specific construction expenses
    const constructionQuery = useMemoFirebase(() => {
        if (!db || !user) return null;
        return query(collection(db, 'construction_expenses'), where('userId', '==', user.uid));
    }, [db, user]);
    const { data: constructionExpenses, isLoading: isConstructionLoading } = useCollection<ConstructionExpense>(constructionQuery);

    if (isAuthLoading || isPropsLoading || isIncomesLoading || isMaintenanceLoading || isConstructionLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const allProperties = (finishedProps || []).map(p => 
        calculatePropertyFinancials(
            p, 
            (constructionExpenses || []).filter(ce => ce.propertyId === p.id), 
            (rentalIncomes || []).filter(ri => ri.propertyId === p.id), 
            (maintenanceExpenses || []).filter(me => me.propertyId === p.id)
        )
    );

    return (
        <div className="space-y-6">
            <div className="space-y-1">
                <h1 className="text-3xl font-headline font-bold text-foreground">Financial Reports</h1>
                <p className="text-sm text-muted-foreground">Portfolio performance analysis for {user?.email}</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <MonthlySummaryChart 
                    incomes={rentalIncomes || []} 
                    expenses={maintenanceExpenses || []} 
               />
               <ProfitLossChart 
                    properties={allProperties} 
               />
            </div>
        </div>
    );
}