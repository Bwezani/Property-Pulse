"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import type { Property } from "@/lib/types"

const chartConfig = {
  profit: {
    label: "Net Profit",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig

type ProfitLossChartProps = {
    properties: Property[];
}

export function ProfitLossChart({ properties }: ProfitLossChartProps) {
  const chartData = properties
    .filter(p => p.type === "Finished")
    .map(p => ({
      property: p.name,
      profit: p.netProfit,
    }))
    .sort((a, b) => b.profit - a.profit);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profit/Loss by Property</CardTitle>
        <CardDescription>
          Showing net profit for all finished properties.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <YAxis
                tickFormatter={(value) => `$${value / 1000}k`}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
            />
            <XAxis
              dataKey="property"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{
                fontSize: 12,
                angle: -30,
                textAnchor: 'end',
              }}
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-profit)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-profit)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <Area
              dataKey="profit"
              type="natural"
              fill="url(#fillProfit)"
              fillOpacity={0.4}
              stroke="var(--color-profit)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
