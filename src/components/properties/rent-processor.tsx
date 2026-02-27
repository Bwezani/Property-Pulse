'use client';

import { useEffect } from 'react';
import { useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import type { Property, PropertyUnit } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * RentProcessor is a background component that checks for due rent
 * across all units of occupied properties and records income automatically.
 */
export function RentProcessor() {
  const db = useFirestore();
  const { user } = useUser();

  const propertiesQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, 'finished_properties'),
      where('type', '==', 'Finished'),
      where('isDeleted', '==', false)
    );
  }, [db, user]);

  const { data: properties } = useCollection<Property>(propertiesQuery);

  useEffect(() => {
    if (!db || !properties || properties.length === 0) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDay = now.getDate();
    const monthKey = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    properties.forEach((property) => {
      // 1. Handle Multi-Unit properties
      if (property.unitsList && property.unitsList.length > 0) {
        property.unitsList.forEach((unit: PropertyUnit) => {
          if (unit.status === 'Occupied' && currentDay >= unit.paymentDueDay) {
            processRent(property.id, unit.id, unit.unitName, unit.tenantName, unit.monthlyRent, unit.paymentDueDay);
          }
        });
      } 
      // 2. Handle Single Unit properties (Backward compatibility/Fallback)
      else if (property.status === 'Occupied' && currentDay >= property.paymentDueDay) {
        processRent(property.id, 'main', property.name, property.tenantName, property.monthlyRent, property.paymentDueDay);
      }
    });

    async function processRent(propId: string, unitId: string, unitName: string, tenant: string, rent: number, dueDay: number) {
      if (!db) return;
      
      const docId = `rent-${propId}-${unitId}-${monthKey}`;
      const docRef = doc(db, 'rental_incomes', docId);

      const incomeData = {
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

      setDoc(docRef, incomeData, { merge: true }).catch(async (error) => {
         errorEmitter.emit('permission-error', new FirestorePermissionError({
           path: docRef.path,
           operation: 'write',
           requestResourceData: incomeData
         }));
      });
    }

  }, [db, properties]);

  return null;
}
