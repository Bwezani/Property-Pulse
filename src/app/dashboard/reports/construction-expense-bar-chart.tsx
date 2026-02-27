'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

interface ExpenseSummary {
  category: string;
  amount: number;
}

interface Props {
  data: ExpenseSummary[];
}

export function ConstructionExpenseBarChart({ data }: Props) {
  return (
    <div className="h-[350px] w-full rounded-xl border p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">
        Construction Expense Breakdown
      </h3>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" />
          <YAxis />
          <Tooltip />
          <Bar
  dataKey="amount"
  fill="hsl(var(--chart-1))"
  radius={[8, 8, 0, 0]}
/>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}