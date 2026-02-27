'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/lib/types';
import { InvestmentProgress } from './investment-progress';
import { LayoutGrid, Ruler, MapPin, Building2, AlertTriangle, Hash } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PropertyListItemProps {
  property: Property;
}

export function PropertyListItem({ property }: PropertyListItemProps) {
  const budget = property.estimatedBudget || 0;
  const spent = property.totalConstructionCost || 0;
  const budgetProgress = budget > 0 ? (spent / budget) * 100 : 0;
  const isOverBudget = budget > 0 && spent > budget;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-all duration-300 border-border/50 flex flex-col h-full group">
      <CardHeader className="pb-3 space-y-3">
        <div className="flex justify-between items-start gap-2">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0 group-hover:bg-primary/20 transition-colors">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex flex-col gap-1 items-end shrink-0">
            <Badge 
              variant={property.type === 'Finished' ? 'outline' : 'default'} 
              className={property.type === 'Under Construction' ? 'bg-amber-500 text-white border-none' : 'bg-background/90 backdrop-blur-sm shadow-sm'}
            >
              {property.type === 'Finished' ? property.status : property.constructionStage}
            </Badge>
            {property.units && property.units > 1 && (
              <Badge variant="secondary" className="bg-muted text-foreground flex items-center gap-1 text-[10px] py-0 h-5">
                <LayoutGrid className="h-3 w-3" />
                {property.units} Units
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            <Hash className="h-3 w-3" />
            {property.code}
          </div>
          <CardTitle className="font-headline text-lg line-clamp-1">
            <Link href={`/dashboard/properties/${property.id}`} className="hover:text-primary transition-colors">
              {property.name}
            </Link>
          </CardTitle>
          <div className="flex flex-col gap-1.5 pt-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary/60" />
              <span className="truncate">{property.location}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Ruler className="h-3.5 w-3.5 text-primary/60" />
              <span>{property.size}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="mt-auto pt-4 border-t bg-muted/5">
        {property.type === "Finished" ? (
             <InvestmentProgress totalInvestment={property.totalInvestment} rentReceived={property.totalRentReceived} />
        ) : (
            <div className='space-y-3'>
                <div className="flex justify-between items-center text-xs">
                   <div className="flex items-center gap-1">
                      <span className="text-muted-foreground font-medium">Budget Used</span>
                      {isOverBudget && <AlertTriangle className="h-3 w-3 text-destructive animate-pulse" />}
                   </div>
                   <span className={`font-bold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                      {budgetProgress.toFixed(0)}%
                   </span>
                </div>
                <Progress 
                  value={Math.min(100, budgetProgress)} 
                  indicatorClassName={isOverBudget ? 'bg-destructive' : budgetProgress > 90 ? 'bg-amber-500' : 'bg-primary'} 
                  className="h-1.5" 
                />
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                    <div>
                        <p className="text-muted-foreground uppercase tracking-wider font-semibold">Total Spent</p>
                        <p className={`font-bold ${isOverBudget ? 'text-destructive' : 'text-foreground'}`}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 0 }).format(spent)}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-muted-foreground uppercase tracking-wider font-semibold">Budgeted</p>
                        <p className="font-bold text-foreground">
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ZMW', maximumFractionDigits: 0 }).format(budget)}
                        </p>
                    </div>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  );
}