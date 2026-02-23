'use server';

import { revalidatePath } from 'next/cache';
import {
  updateProperty,
  getConstructionExpenses,
  addProperty,
  deleteProperty,
} from '@/lib/data';
import type { Property } from '@/lib/types';

export async function finishConstructionAction(property: Property) {
  if (property.type !== 'Under Construction') {
    throw new Error('Property is not under construction.');
  }

  const expenses = await getConstructionExpenses(property.id);
  const totalConstructionCost = expenses.reduce(
    (sum, expense) => sum + expense.totalPrice,
    0
  );

  await updateProperty(property.id, {
    type: 'Finished',
    constructionStage: 'Completed',
    totalInvestment: totalConstructionCost,
  });

  revalidatePath('/dashboard/construction');
  revalidatePath('/dashboard/finished-properties');
  revalidatePath(`/dashboard/properties/${property.id}`);
}

type NewFinishedPropertyInput = {
  name: string;
  location: string;
  size: string;
  totalInvestment: number;
  status: 'Occupied' | 'Vacant';
  monthlyRent: number;
  paymentDueDay: number;
  tenantName?: string;
  tenantContact?: string;
};

export async function addFinishedPropertyAction(
  data: NewFinishedPropertyInput
) {
  const isOccupied = data.status === 'Occupied';

  await addProperty({
    name: data.name,
    code: `AUTO-${Date.now().toString().slice(-6)}`,
    categoryId: 'cat-1',
    location: data.location,
    size: data.size,
    description: '',
    type: 'Finished',
    imageId: 'default-img',
    totalInvestment: data.totalInvestment,
    status: data.status,
    monthlyRent: isOccupied ? data.monthlyRent : 0,
    paymentDueDay: isOccupied ? data.paymentDueDay : 0,
    tenantName: isOccupied ? (data.tenantName || '') : '',
    tenantContact: isOccupied ? (data.tenantContact || '') : '',
    constructionStage: 'Completed',
    estimatedBudget: undefined,
    totalConstructionCost: 0,
    totalRentReceived: 0,
    totalMaintenanceCost: 0,
    remainingInvestment: data.totalInvestment,
    totalProfit: 0,
    netProfit: 0,
    costOverrunAlert: undefined,
  });

  revalidatePath('/dashboard/finished-properties');
  revalidatePath('/dashboard/all-properties');
}

type NewConstructionPropertyInput = {
  name: string;
  location: string;
  size: string;
  constructionStage: Property['constructionStage'];
  estimatedBudget?: number;
};

export async function addConstructionPropertyAction(
  data: NewConstructionPropertyInput
) {
  await addProperty({
    name: data.name,
    code: `AUTO-${Date.now().toString().slice(-6)}`,
    categoryId: 'cat-1',
    location: data.location,
    size: data.size,
    description: '',
    type: 'Under Construction',
    imageId: 'default-img',
    totalInvestment: 0,
    status: 'Vacant',
    monthlyRent: 0,
    paymentDueDay: 0,
    tenantName: '',
    tenantContact: '',
    constructionStage: data.constructionStage,
    estimatedBudget: data.estimatedBudget,
    totalConstructionCost: 0,
    totalRentReceived: 0,
    totalMaintenanceCost: 0,
    remainingInvestment: 0,
    totalProfit: 0,
    netProfit: 0,
    costOverrunAlert: undefined,
  });

  revalidatePath('/dashboard/construction');
  revalidatePath('/dashboard/all-properties');
}

export async function deletePropertyAction(id: string) {
  await deleteProperty(id);
  revalidatePath('/dashboard/finished-properties');
  revalidatePath('/dashboard/construction');
  revalidatePath('/dashboard/all-properties');
}

