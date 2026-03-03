import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils'

interface KpiCardProps {
  title: string
  value: string
  helperText: string
  Icon: LucideIcon
  tooltipValue?: string
  className?: string
}

export function KpiCard({ title, value, helperText, Icon, tooltipValue, className }: KpiCardProps) {
  return (
    <Card className={cn("kpi-card overflow-hidden relative group", className)}>
      <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 group-hover:bg-primary transition-colors duration-500" />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
        <div className="p-2 bg-primary/5 rounded-lg group-hover:bg-primary/10 transition-colors duration-500">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        {tooltipValue ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-3xl font-headline font-bold cursor-help tracking-tight">{value}</div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-mono text-xs">{tooltipValue}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <div className="text-3xl font-headline font-bold tracking-tight">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1 font-medium">{helperText}</p>
      </CardContent>
    </Card>
  )
}