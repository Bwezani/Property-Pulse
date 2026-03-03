
'use client';

import { useEffect } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
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
      if (property.unitsList && property.unitsList.length > 0) {
        property.unitsList.forEach((unit: PropertyUnit) => {
          if (unit.status === 'Occupied' && currentDay >= unit.paymentDueDay) {
            processRent(property.id, unit.id, unit.unitName, unit.tenantName, unit.monthlyRent, unit.paymentDueDay);
          }
        });
      } else if (property.status === 'Occupied' && currentDay >= property.paymentDueDay) {
        processRent(property.id, 'main', property.name, property.tenantName, property.monthlyRent, property.paymentDueDay);
      }
    });

    async function processRent(propId: string, unitId: string, unitName: string, tenant: string, rent: number, dueDay: number) {
      if (!db || !user) return;
      
      const docId = `rent-${propId}-${unitId}-${monthKey}`;
      const docPath = `users/${user.uid}/rental_incomes`;
      const docRef = doc(db, docPath, docId);

      const incomeData = {
        userId: user.uid,
        propertyId: propId,
        unitId: unitId,
        unitName: unitName,
        tenantName: tenant || 'Tenant',
        amount: rent || 0,
        paymentDate: now.toISOString(),
        dueDate: new Date(currentYear, currentMonth - 1, dueDay).toISOString(),
        paymentMethod: 'System Automated',
        status: 'Paid',
        monthKey: monthKey,
        createdAt: serverTimestamp(),
      };

      setDoc(docRef, incomeData, { merge: true }).catch(async () => {
         errorEmitter.emit('permission-error', new FirestorePermissionError({
           path: docRef.path,
           operation: 'write',
           requestResourceData: incomeData
         }));
      });
    }

  }, [db, properties, user]);

  return null;
}
