import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatFullCurrency, cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface InvestmentProgressProps {
  totalInvestment: number;
  rentReceived: number;
}

export function InvestmentProgress({ totalInvestment, rentReceived }: InvestmentProgressProps) {
  if (totalInvestment <= 0) {
    return <div className="text-xs text-muted-foreground font-medium italic">No investment data available.</div>;
  }

  // Truncate percentage to 1 decimal place without rounding up
  const progressRaw = (rentReceived / totalInvestment) * 100;
  const progress = Math.floor(progressRaw * 10) / 10;
  
  const isProfit = progress >= 100;

  const profitAmount = rentReceived - totalInvestment;

  return (
    <TooltipProvider>
      <div className="w-full space-y-4">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
              {isProfit ? "Profit Milestone" : "Recovery Progress"}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn(
                "font-headline font-bold text-sm tracking-tight cursor-help",
                isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-primary"
              )}>
                  {isProfit 
                   ? `+${formatCurrency(profitAmount)}`
                   : `${progress.toFixed(1)}%`
                  }
              </span>
            </TooltipTrigger>
            {isProfit && (
              <TooltipContent className="bg-popover border-border shadow-xl">
                <p className="text-xs font-mono font-medium">Total Lifetime Profit: {formatFullCurrency(profitAmount)}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        <div className="relative h-2.5 w-full bg-muted rounded-full overflow-hidden shadow-inner">
          <div 
            className={cn(
              "h-full transition-all duration-1000 ease-out",
              isProfit ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : "bg-primary"
            )}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>

        <div className="flex justify-between text-[10px] mt-1.5 font-bold uppercase tracking-widest">
          <div className="space-y-1">
            <p className="text-muted-foreground opacity-60">Total Income</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-foreground block text-xs tracking-tight">{formatCurrency(rentReceived)}</span>
              </TooltipTrigger>
              <TooltipContent className="bg-popover border-border shadow-xl">
                <p className="font-mono text-[10px]">Actual Gross: {formatFullCurrency(rentReceived)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-right space-y-1">
            <p className="text-muted-foreground opacity-60">Initial Cost</p>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-help text-foreground block text-xs tracking-tight">{formatCurrency(totalInvestment)}</span>
              </TooltipTrigger>
              <TooltipContent className="bg-popover border-border shadow-xl">
                <p className="font-mono text-[10px]">Actual Investment: {formatFullCurrency(totalInvestment)}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}