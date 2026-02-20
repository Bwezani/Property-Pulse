import { redirect } from 'next/navigation';

export default function DashboardRootPage() {
  redirect('/dashboard/finished-properties');
}
