'use server';

import { revalidatePath } from 'next/cache';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

import type {
    ConstructionBudgetItem,
    ConstructionExpense,
    MaintenanceExpense,
    MaintenanceBudgetItem,
} from '@/lib/types';

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ------------------------------------------------ */
/* ADD CONSTRUCTION EXPENSE */
/* ------------------------------------------------ */

export async function addConstructionExpenseAction(
    propertyId: string,
    data: Omit<ConstructionExpense, 'id' | 'propertyId'>,
    userId: string
) {
    const colRef = collection(
        db,
        'users',
        userId,
        'construction_expenses'
    );

    await addDoc(colRef, {
        ...data,
        propertyId,
        userId,
        createdAt: new Date().toISOString(),
    });

    revalidatePath(`/dashboard/properties/${propertyId}`);
}


/* ------------------------------------------------ */
/* ADD MAINTENANCE EXPENSE */
/* ------------------------------------------------ */

export async function addMaintenanceExpenseAction(
    propertyId: string,
    data: Omit<MaintenanceExpense, 'id' | 'propertyId'>,
    userId: string
) {
    const colRef = collection(
        db,
        'users',
        userId,
        'maintenance_expenses'
    );

    await addDoc(colRef, {
        ...data,
        propertyId,
        userId,
        createdAt: new Date().toISOString(),
    });

    revalidatePath(`/dashboard/properties/${propertyId}`);
}


/* ------------------------------------------------ */
/* ADD CONSTRUCTION BUDGET ITEM */
/* ------------------------------------------------ */

export async function addConstructionBudgetItemAction(
    propertyId: string,
    data: Omit<ConstructionBudgetItem, 'id' | 'propertyId'>,
    userId: string
) {
    const colRef = collection(
        db,
        'users',
        userId,
        'construction_budget_items'
    );

    await addDoc(colRef, {
        ...data,
        propertyId,
        userId,
        actualCost: 0,
        createdAt: new Date().toISOString(),
    });

    revalidatePath(`/dashboard/properties/${propertyId}`);
}


/* ------------------------------------------------ */
/* ADD MAINTENANCE BUDGET ITEM */
/* ------------------------------------------------ */

export async function addMaintenanceBudgetItemAction(
    propertyId: string,
    data: Omit<MaintenanceBudgetItem, 'id' | 'propertyId'>,
    userId: string
) {
    const colRef = collection(
        db,
        'users',
        userId,
        'maintenance_budget_items'
    );

    await addDoc(colRef, {
        ...data,
        propertyId,
        userId,
        actualCost: 0,
        createdAt: new Date().toISOString(),
    });

    revalidatePath(`/dashboard/properties/${propertyId}`);
}


/* ------------------------------------------------ */
/* UPDATE MAINTENANCE ACTUAL COST */
/* ------------------------------------------------ */
export async function updateMaintenanceBudgetActualCostAction(
    userId: string,
    itemId: string,
    actualCost: number,
    propertyId: string
) {

    const ref = doc(
        db,
        'users',
        userId,
        'maintenance_budget_items',
        itemId
    );

    await updateDoc(ref, {
        actualCost: Number(actualCost),
        updatedAt: new Date().toISOString(),
    });

    revalidatePath(`/dashboard/properties/${propertyId}`);
}



/* ------------------------------------------------ */
/* DELETE CONSTRUCTION EXPENSE */
/* ------------------------------------------------ */

export async function deleteConstructionExpenseAction(
    propertyId: string,
    expenseId: string,
    userId: string
) {
    const docRef = doc(
        db,
        'users',
        userId,
        'construction_expenses',
        expenseId
    );

    await deleteDoc(docRef);

    revalidatePath(`/dashboard/properties/${propertyId}`);
}


/* ------------------------------------------------ */
/* DELETE MAINTENANCE EXPENSE */
/* ------------------------------------------------ */

export async function deleteMaintenanceExpenseAction(
    propertyId: string,
    expenseId: string,
    userId: string
) {
    const docRef = doc(
        db,
        'users',
        userId,
        'maintenance_expenses',
        expenseId
    );

    await deleteDoc(docRef);

    revalidatePath(`/dashboard/properties/${propertyId}`);
}


/* ------------------------------------------------ */
/* DELETE MAINTENANCE BUDGET ITEM */
/* ------------------------------------------------ */

export async function deleteMaintenanceBudgetItemAction(
    propertyId: string,
    itemId: string,
    userId: string
) {
    const docRef = doc(
        db,
        'users',
        userId,
        'maintenance_budget_items',
        itemId
    );

    await deleteDoc(docRef);

    revalidatePath(`/dashboard/properties/${propertyId}`);
}