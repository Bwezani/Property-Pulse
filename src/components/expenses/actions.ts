'use server';

import { revalidatePath } from 'next/cache';
import {
  addConstructionExpense,
  addMaintenanceExpense,
  addConstructionBudgetItem,
  addMaintenanceBudgetItem,
  updateConstructionBudgetItem,
  updateMaintenanceBudgetItem,
  deleteConstructionExpense,
  deleteMaintenanceExpense,
  deleteConstructionBudgetItem,
  deleteMaintenanceBudgetItem,
} from '@/lib/data';
import type {
  ConstructionExpense,
  MaintenanceExpense,
  ConstructionBudgetItem,
  MaintenanceBudgetItem,
} from '@/lib/types';

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

export async function addConstructionBudgetItemAction(
  propertyId: string,
  data: Omit<ConstructionBudgetItem, 'id' | 'propertyId'>
) {
  await addConstructionBudgetItem({ ...data, propertyId });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function addMaintenanceBudgetItemAction(
  propertyId: string,
  data: Omit<MaintenanceBudgetItem, 'id' | 'propertyId'>
) {
  await addMaintenanceBudgetItem({ ...data, propertyId });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function updateConstructionBudgetActualCostAction(
  propertyId: string,
  itemId: string,
  actualCost: number,
) {
  await updateConstructionBudgetItem(itemId, { actualCost });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function updateMaintenanceBudgetActualCostAction(
  propertyId: string,
  itemId: string,
  actualCost: number,
) {
  await updateMaintenanceBudgetItem(itemId, { actualCost });
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function deleteConstructionExpenseAction(
  propertyId: string,
  expenseId: string,
) {
  await deleteConstructionExpense(expenseId);
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function deleteMaintenanceExpenseAction(
  propertyId: string,
  expenseId: string,
) {
  await deleteMaintenanceExpense(expenseId);
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function deleteConstructionBudgetItemAction(
  propertyId: string,
  itemId: string,
) {
  await deleteConstructionBudgetItem(itemId);
  revalidatePath(`/dashboard/properties/${propertyId}`);
}

export async function deleteMaintenanceBudgetItemAction(
  propertyId: string,
  itemId: string,
) {
  await deleteMaintenanceBudgetItem(itemId);
  revalidatePath(`/dashboard/properties/${propertyId}`);
}
