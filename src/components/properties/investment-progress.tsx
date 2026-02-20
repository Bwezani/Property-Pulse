import { Progress } from '@/components/ui/progress';

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
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-muted-foreground">
            {isProfit ? "Profit Mode" : "Investment Recovery"}
        </span>
        <span className="font-bold">
            {isProfit 
             ? `+${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(profitAmount)}`
             : `${Math.min(100, progress).toFixed(0)}%`
            }
        </span>
      </div>
      <Progress value={isProfit ? 100 : progress} className="h-2 [&>div]:" indicatorClassName={colorClass} />
      <div className="flex justify-between text-xs mt-1 text-muted-foreground">
        <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits:0 }).format(rentReceived)}</span>
        <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits:0 }).format(totalInvestment)}</span>
      </div>
    </div>
  );
}

declare module 'react' {
    interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      indicatorClassName?: string;
    }
}
