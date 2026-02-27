'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/lib/types';
import { PlaceHolderImagesMap } from '@/lib/placeholder-images';
import { InvestmentProgress } from './investment-progress';
import { LayoutGrid } from 'lucide-react';

interface PropertyListItemProps {
  property: Property;
}

export function PropertyListItem({ property }: PropertyListItemProps) {
  const image = PlaceHolderImagesMap.get(property.imageId) || PlaceHolderImagesMap.get('default-img');

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <Link href={`/dashboard/properties/${property.id}`} className="block">
        <div className="relative h-48 w-full">
          <Image
            src={image!.imageUrl}
            alt={property.name || 'Property Image'}
            fill
            className="object-cover"
            data-ai-hint={image!.imageHint}
          />
          {property.units && property.units > 1 && (
            <div className="absolute top-2 right-2">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-foreground flex items-center gap-1 shadow-sm">
                <LayoutGrid className="h-3 w-3" />
                {property.units} Units
              </Badge>
            </div>
          )}
        </div>
      </Link>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-lg mb-1">
                <Link href={`/dashboard/properties/${property.id}`} className="hover:underline">
                    {property.name}
                </Link>
            </CardTitle>
            {property.type === 'Finished' ? (
                <Badge variant={property.status === 'Occupied' ? 'default' : 'secondary'}>
                    {property.status}
                </Badge>
            ) : (
                 <Badge variant="default" className="bg-amber-500 text-white border-amber-500">
                    {property.constructionStage}
                </Badge>
            )}
        </div>
        <CardDescription>{property.location}</CardDescription>
      </CardHeader>
      <CardContent>
        {property.type === "Finished" ? (
             <InvestmentProgress totalInvestment={property.totalInvestment} rentReceived={property.totalRentReceived} />
        ) : (
            <div className='text-sm text-muted-foreground'>
                <p>Budget: <span className='font-medium text-foreground'>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 0 }).format(property.estimatedBudget || 0)}</span></p>
                <p>Spent: <span className='font-medium text-foreground'>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 0 }).format(property.totalConstructionCost || 0)}</span></p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
