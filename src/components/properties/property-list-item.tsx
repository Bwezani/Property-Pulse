
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/lib/types';
import { PlaceHolderImagesMap } from '@/lib/placeholder-images';
import { InvestmentProgress } from './investment-progress';
import { LayoutGrid, Ruler, MapPin } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PropertyListItemProps {
  property: Property;
}

export function PropertyListItem({ property }: PropertyListItemProps) {
  const image = PlaceHolderImagesMap.get(property.imageId) || PlaceHolderImagesMap.get('default-img');
  
  const budget = property.estimatedBudget || 0;
  const spent = property.totalConstructionCost || 0;
  const budgetProgress = budget > 0 ? (spent / budget) * 100 : 0;

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/50">
      <Link href={`/dashboard/properties/${property.id}`} className="block group">
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={image!.imageUrl}
            alt={property.name || 'Property Image'}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            data-ai-hint={image!.imageHint}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="absolute top-3 left-3 flex gap-2">
             <Badge variant={property.type === 'Finished' ? 'outline' : 'default'} className={property.type === 'Under Construction' ? 'bg-amber-500 text-white border-none' : 'bg-background/90 backdrop-blur-sm shadow-sm'}>
                {property.type === 'Finished' ? property.status : property.constructionStage}
            </Badge>
          </div>

          {property.units && property.units > 1 && (
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm text-foreground flex items-center gap-1 shadow-sm">
                <LayoutGrid className="h-3 w-3" />
                {property.units} Units
              </Badge>
            </div>
          )}
        </div>
      </Link>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
            <CardTitle className="font-headline text-xl mb-1 line-clamp-1">
                <Link href={`/dashboard/properties/${property.id}`} className="hover:text-primary transition-colors">
                    {property.name}
                </Link>
            </CardTitle>
        </div>
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {property.location}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Ruler className="h-3 w-3" />
                {property.size}
            </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {property.type === "Finished" ? (
             <InvestmentProgress totalInvestment={property.totalInvestment} rentReceived={property.totalRentReceived} />
        ) : (
            <div className='space-y-3'>
                <div className="flex justify-between items-center text-xs">
                   <span className="text-muted-foreground">Budget Progress</span>
                   <span className={`font-bold ${budgetProgress > 100 ? 'text-destructive' : 'text-foreground'}`}>
                      {budgetProgress.toFixed(0)}%
                   </span>
                </div>
                <Progress value={Math.min(100, budgetProgress)} indicatorClassName={budgetProgress > 90 ? 'bg-amber-500' : budgetProgress > 100 ? 'bg-destructive' : 'bg-primary'} className="h-2" />
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div>
                        <p className="text-muted-foreground">Total Spent</p>
                        <p className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 0 }).format(spent)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-muted-foreground">Budget</p>
                        <p className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 0 }).format(budget)}</p>
                    </div>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
