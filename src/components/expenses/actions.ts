'use server';

import { revalidatePath } from 'next/cache';
import { addConstructionExpense, addMaintenanceExpense } from '@/lib/data';
import type { ConstructionExpense, MaintenanceExpense } from '@/lib/types';

export async function addConstructionExpenseAction(
  propertyId: string,
  data: Omit<ConstructionExpense, 'id' | 'propertyId'>
) {
  await addConstructionExpense({ ...data, propertyId });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function addMaintenanceExpenseAction(
  propertyId: string,
  data: Omit<MaintenanceExpense, 'id' | 'propertyId'>
) {
  await addMaintenanceExpense({ ...data, propertyId });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}
