'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/lib/types';
import { InvestmentProgress } from './investment-progress';
import { LayoutGrid, Ruler, MapPin, Building2, AlertTriangle, Hash, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatFullCurrency, cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface PropertyListItemProps {
  property: Property;
}

export function PropertyListItem({ property }: PropertyListItemProps) {
  const budget = property.estimatedBudget || 0;
  const spent = property.totalConstructionCost || 0;
  
  // Truncate percentage to 1 decimal place without rounding
  const budgetProgressRaw = budget > 0 ? (spent / budget) * 100 : 0;
  const budgetProgress = Math.floor(budgetProgressRaw * 10) / 10;
  
  const isOverBudget = budget > 0 && spent > budget;

  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 border-border/40 flex flex-col h-full group bg-card hover:-translate-y-1">
      <CardHeader className="pb-4 space-y-4 relative">
        <div className="flex justify-between items-start gap-2">
          <div className="p-3 bg-primary/5 rounded-xl shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <div className="flex flex-col gap-1.5 items-end shrink-0">
            <Badge 
              variant={property.type === 'Finished' ? 'outline' : 'default'} 
              className={cn(
                "font-bold px-3 py-1 rounded-lg border shadow-sm tracking-wide text-[10px] uppercase",
                property.type === 'Under Construction' 
                  ? 'bg-amber-500 hover:bg-amber-600 text-white border-none' 
                  : 'bg-background/80 text-foreground'
              )}
            >
              {property.type === 'Finished' ? property.status : property.constructionStage}
            </Badge>
            {property.units && property.units > 1 && (
              <Badge variant="secondary" className="bg-muted/50 text-muted-foreground flex items-center gap-1.5 text-[10px] py-1 h-7 rounded-lg px-2.5 border-none">
                <LayoutGrid className="h-3.5 w-3.5" />
                {property.units} Units
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest font-bold">
            <Hash className="h-3 w-3 text-primary/30" />
            {property.code}
          </div>
          <CardTitle className="font-headline text-2xl line-clamp-1 leading-tight tracking-tight">
            <Link href={`/dashboard/properties/${property.id}`} className="hover:text-primary transition-colors flex items-center justify-between group/title">
              {property.name}
              <ArrowRight className="h-5 w-5 opacity-0 group-hover/title:opacity-100 transition-all -translate-x-3 group-hover/title:translate-x-0 text-primary" />
            </Link>
          </CardTitle>
          <div className="flex flex-col gap-2 pt-1.5">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
              <MapPin className="h-4 w-4 text-primary/40" />
              <span className="truncate">{property.location}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
              <Ruler className="h-4 w-4 text-primary/40" />
              <span>{property.size}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="mt-auto pt-6 border-t bg-muted/5 pb-8 px-6">
        {property.type === "Finished" ? (
             <InvestmentProgress totalInvestment={property.totalInvestment} rentReceived={property.totalRentReceived} />
        ) : (
            <TooltipProvider>
              <div className='space-y-4'>
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Budget Utilization</span>
                        {isOverBudget && <AlertTriangle className="h-3.5 w-3.5 text-destructive animate-pulse" />}
                     </div>
                     <span className={cn("font-bold text-sm font-headline", isOverBudget ? 'text-destructive' : 'text-primary')}>
                        {budgetProgress.toFixed(1)}%
                     </span>
                  </div>
                  <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={cn(
                        "h-full transition-all duration-1000 ease-out",
                        isOverBudget ? 'bg-destructive' : budgetProgress > 90 ? 'bg-amber-500' : 'bg-primary'
                      )}
                      style={{ width: `${Math.min(100, budgetProgress)}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-[10px] pt-1">
                      <div className="space-y-1">
                          <p className="text-muted-foreground uppercase tracking-widest font-bold opacity-60">Actual Spent</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className={cn("font-bold text-sm cursor-help tracking-tight", isOverBudget ? 'text-destructive' : 'text-foreground')}>
                                {formatCurrency(spent)}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="font-mono text-[10px] bg-popover border-border shadow-xl">
                              {formatFullCurrency(spent)}
                            </TooltipContent>
                          </Tooltip>
                      </div>
                      <div className="text-right space-y-1">
                          <p className="text-muted-foreground uppercase tracking-widest font-bold opacity-60">Project Budget</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="font-bold text-sm text-foreground cursor-help tracking-tight">
                                {formatCurrency(budget)}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="font-mono text-[10px] bg-popover border-border shadow-xl">
                              {formatFullCurrency(budget)}
                            </TooltipContent>
                          </Tooltip>
                      </div>
                  </div>
              </div>
            </TooltipProvider>
        )}
      </CardContent>
    </Card>
  );
}