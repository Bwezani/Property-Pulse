import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatFullCurrency } from '@/lib/utils';
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
    return <div className="text-sm text-muted-foreground">No investment data.</div>;
  }

  const progress = (rentReceived / totalInvestment) * 100;
  const isProfit = progress >= 100;

  let colorClass = 'bg-red-500'; // Loss
  if (progress > 80) colorClass = 'bg-yellow-500'; // Nearing break-even
  if (isProfit) colorClass = 'bg-green-500'; // Profit

  const profitAmount = rentReceived - totalInvestment;

  return (
    <TooltipProvider>
      <div className="w-full">
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium text-muted-foreground">
              {isProfit ? "Profit Mode" : "Investment Recovery"}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="font-bold cursor-help">
                  {isProfit 
                   ? `+${formatCurrency(profitAmount)}`
                   : `${Math.min(100, progress).toFixed(1)}%`
                  }
              </span>
            </TooltipTrigger>
            {isProfit && (
              <TooltipContent>
                <p>Total Profit: {formatFullCurrency(profitAmount)}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </div>
        <Progress value={isProfit ? 100 : progress} className="h-2" indicatorClassName={colorClass} />
        <div className="flex justify-between text-xs mt-1 text-muted-foreground">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">{formatCurrency(rentReceived)}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total Rent Received: {formatFullCurrency(rentReceived)}</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help">{formatCurrency(totalInvestment)}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Total Investment: {formatFullCurrency(totalInvestment)}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
