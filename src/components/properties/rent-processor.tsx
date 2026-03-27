
'use client';

import { useEffect } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';
import type { Property, PropertyUnit } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * RentProcessor automatically records rental income for properties owned by the current user.
 */
export function RentProcessor() {
  const db = useFirestore();
  const { user } = useUser();

  const propertiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return collection(db, 'users', user.uid, 'finished_properties');
  }, [db, user]);

  const { data: properties } = useCollection<Property>(propertiesQuery);

  useEffect(() => {
    if (!db || !user || !properties || properties.length === 0) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    properties.forEach((property) => {
      // Ignore Airbnb properties as their income is highly variable and manually logged
      if (property.isAirbnb) return;

      if (property.unitsList && property.unitsList.length > 0) {
        property.unitsList.forEach((unit: PropertyUnit) => {
          if (unit.status === 'Occupied') {
            checkAndProcessRent(property.id, unit.id, unit.unitName, unit.tenantName, unit.monthlyRent, unit.paymentDueDay);
          }
        });
      } else if (property.status === 'Occupied') {
        checkAndProcessRent(property.id, 'main', property.name, property.tenantName, property.monthlyRent, property.paymentDueDay);
      }
    });

    async function checkAndProcessRent(propId: string, unitId: string, unitName: string, tenant: string, rent: number, dueDay: number) {
      if (!db || !user) return;
      
      // Calculate Trigger and Time bounds
      const dueDate = new Date(currentYear, currentMonth - 1, dueDay, 23, 59, 59);
      const triggerDate = new Date(currentYear, currentMonth - 1, dueDay - 3, 0, 0, 0); // 3 days before
      
      if (now < triggerDate) return; // Too early to generate invoice
      
      const isOverdue = now > dueDate;
      const targetStatus = isOverdue ? 'Overdue' : 'Pending';
      
      const docPath = `users/${user.uid}/rental_incomes`;
      
      const q = query(
        collection(db, docPath),
        where('propertyId', '==', propId),
        where('unitId', '==', unitId),
        where('monthKey', '==', monthKey),
        limit(1)
      );
      
      try {
        const querySnapshot = await getDocs(q);
        
        // If an entry exists for this month, update it if it's lagging behind 'Overdue' status
        if (!querySnapshot.empty) {
          const existingDoc = querySnapshot.docs[0];
          const existingData = existingDoc.data();
          if (existingData.status === 'Pending' && isOverdue) {
             await setDoc(existingDoc.ref, { status: 'Overdue' }, { merge: true });
          }
          return;
        }

        const docId = `rent-${propId}-${unitId}-${monthKey}`;
        const docRef = doc(db, docPath, docId);

        const incomeData = {
          userId: user.uid,
          propertyId: propId,
          unitId: unitId,
          unitName: unitName,
          tenantName: tenant || 'Tenant',
          amount: rent || 0,
          paymentDate: null, // Null because it's not paid yet!
          dueDate: new Date(currentYear, currentMonth - 1, dueDay).toISOString(),
          paymentMethod: 'Pending Payment',
          status: targetStatus,
          monthKey: monthKey,
          createdAt: serverTimestamp(),
        };

        await setDoc(docRef, incomeData, { merge: true });
      } catch (error) {
         errorEmitter.emit('permission-error', new FirestorePermissionError({
           path: docPath,
           operation: 'write',
           requestResourceData: {}
         }));
      }
    }

  }, [db, properties, user]);

  return null;
}
