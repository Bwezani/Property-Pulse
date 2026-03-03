'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Property } from '@/lib/types';
import { InvestmentProgress } from './investment-progress';
import { LayoutGrid, Ruler, MapPin, Building2, AlertTriangle, Hash, ArrowRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatFullCurrency } from '@/lib/utils';
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
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-border/60 flex flex-col h-full group bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3 space-y-4">
        <div className="flex justify-between items-start gap-2">
          <div className="p-2.5 bg-primary/10 rounded-xl shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col gap-1.5 items-end shrink-0">
            <Badge 
              variant={property.type === 'Finished' ? 'outline' : 'default'} 
              className={cn(
                "font-bold px-3 py-0.5 rounded-lg border shadow-sm",
                property.type === 'Under Construction' 
                  ? 'bg-amber-500 text-white border-none' 
                  : 'bg-background/80 text-foreground'
              )}
            >
              {property.type === 'Finished' ? property.status : property.constructionStage}
            </Badge>
            {property.units && property.units > 1 && (
              <Badge variant="secondary" className="bg-muted text-foreground flex items-center gap-1.5 text-[10px] py-0.5 h-6 rounded-lg px-2">
                <LayoutGrid className="h-3 w-3" />
                {property.units} Units
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground uppercase tracking-wider font-semibold">
            <Hash className="h-3 w-3 text-primary/40" />
            {property.code}
          </div>
          <CardTitle className="font-headline text-xl line-clamp-1 leading-tight">
            <Link href={`/dashboard/properties/${property.id}`} className="hover:text-primary transition-colors flex items-center justify-between">
              {property.name}
              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
            </Link>
          </CardTitle>
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary/60" />
              <span className="truncate">{property.location}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Ruler className="h-3.5 w-3.5 text-primary/60" />
              <span>{property.size}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="mt-auto pt-6 border-t bg-muted/20 pb-6">
        {property.type === "Finished" ? (
             <InvestmentProgress totalInvestment={property.totalInvestment} rentReceived={property.totalRentReceived} />
        ) : (
            <TooltipProvider>
              <div className='space-y-4'>
                  <div className="flex justify-between items-center text-[11px]">
                     <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground font-semibold uppercase tracking-wide">Budget Utilization</span>
                        {isOverBudget && <AlertTriangle className="h-3.5 w-3.5 text-destructive animate-pulse" />}
                     </div>
                     <span className={cn("font-bold text-sm", isOverBudget ? 'text-destructive' : 'text-foreground')}>
                        {budgetProgress.toFixed(1)}%
                     </span>
                  </div>
                  <Progress 
                    value={Math.min(100, budgetProgress)} 
                    indicatorClassName={isOverBudget ? 'bg-destructive shadow-[0_0_8px_rgba(225,29,72,0.4)]' : budgetProgress > 90 ? 'bg-amber-500' : 'bg-primary shadow-[0_0_8px_rgba(37,99,235,0.3)]'} 
                    className="h-2 rounded-full bg-muted/50" 
                  />
                  <div className="grid grid-cols-2 gap-4 text-[10px] pt-1">
                      <div className="space-y-1">
                          <p className="text-muted-foreground uppercase tracking-widest font-bold opacity-70">Actual Spent</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className={cn("font-bold text-xs cursor-help", isOverBudget ? 'text-destructive' : 'text-foreground')}>
                                {formatCurrency(spent)}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="font-mono text-[10px]">
                              {formatFullCurrency(spent)}
                            </TooltipContent>
                          </Tooltip>
                      </div>
                      <div className="text-right space-y-1">
                          <p className="text-muted-foreground uppercase tracking-widest font-bold opacity-70">Project Budget</p>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="font-bold text-xs text-foreground cursor-help">
                                {formatCurrency(budget)}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" className="font-mono text-[10px]">
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

import { cn } from "@/lib/utils";