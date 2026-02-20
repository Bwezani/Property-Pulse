"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import type { RentalIncome, MaintenanceExpense } from "@/lib/types"

const chartConfig = {
  income: {
    label: "Income",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

type MonthlySummaryChartProps = {
    incomes: RentalIncome[];
    expenses: MaintenanceExpense[];
}

export function MonthlySummaryChart({ incomes, expenses }: MonthlySummaryChartProps) {
    const data = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return { month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear() };
    }).reverse();

    const chartData = data.map(({ month, year }) => {
        const monthIndex = new Date(`${month} 1, ${year}`).getMonth();
        
        const monthlyIncome = incomes
            .filter(inc => {
                const incDate = new Date(inc.paymentDate);
                return incDate.getMonth() === monthIndex && incDate.getFullYear() === year;
            })
            .reduce((acc, inc) => acc + inc.amount, 0);

        const monthlyExpenses = expenses
            .filter(exp => {
                const expDate = new Date(exp.date);
                return expDate.getMonth() === monthIndex && expDate.getFullYear() === year;
            })
            .reduce((acc, exp) => acc + exp.amount, 0);

        return {
            month,
            income: monthlyIncome,
            expenses: monthlyExpenses,
        };
    });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Summary (Last 6 Months)</CardTitle>
        <CardDescription>Income vs. Expenses</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
          <BarChart data={chartData} accessibilityLayer>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => `$${value / 1000}k`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="income" fill="var(--color-income)" radius={4} />
            <Bar dataKey="expenses" fill="var(--color-expenses)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
