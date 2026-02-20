'use server';

import { revalidatePath } from 'next/cache';
import {
  updateProperty,
  getConstructionExpenses,
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
