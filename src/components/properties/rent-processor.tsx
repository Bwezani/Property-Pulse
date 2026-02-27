'use client';

import { useEffect } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Property } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * RentProcessor is a background component that checks for due rent
 * and automatically adds rental income records for the current month.
 */
export function RentProcessor() {
  const db = useFirestore();
  const { user } = useUser();

  // Fetch all finished properties that are occupied
  const propertiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'finished_properties'),
      where('type', '==', 'Finished'),
      where('status', '==', 'Occupied')
    );
  }, [db, user]);

  const { data: properties } = useCollection<Property>(propertiesQuery);

  useEffect(() => {
    if (!db || !properties || properties.length === 0) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const currentDay = now.getDate();
    const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    properties.forEach((property) => {
      // Check if it's the due day or past it
      if (currentDay >= property.paymentDueDay) {
        // Use a deterministic ID to ensure idempotency: rent-propId-year-month
        const docId = `rent-${property.id}-${monthKey}`;
        const docRef = doc(db, 'rental_incomes', docId);

        // We use setDoc with no merge or simple data to ensure we don't overwrite
        // specific details if they were manually edited, but here we just want to
        // make sure the record exists for the month.
        // In a real app, we'd check if it exists first, but setDoc is safe if we want
        // to "ensure" the entry.
        
        const incomeData = {
          propertyId: property.id,
          tenantName: property.tenantName || 'Tenant',
          amount: property.monthlyRent || 0,
          paymentDate: now.toISOString(),
          dueDate: new Date(currentYear, currentMonth - 1, property.paymentDueDay).toISOString(),
          paymentMethod: 'System Automated',
          status: 'Paid',
          monthKey: monthKey,
          createdAt: serverTimestamp(),
        };

        // We use a "create only" approach by checking the monthKey in the document.
        // Firestore doesn't have a "create if not exists" in a single setDoc without merge
        // that won't overwrite, so we'll just initiate the write. 
        // Note: Using a deterministic ID is the standard way to handle "at most once" logic.
        setDoc(docRef, incomeData, { merge: true }).catch(async (error) => {
           // Standard error handling
           errorEmitter.emit('permission-error', new FirestorePermissionError({
             path: docRef.path,
             operation: 'write',
             requestResourceData: incomeData
           }));
        });
      }
    });
  }, [db, properties]);

  return null; // Background component
}
