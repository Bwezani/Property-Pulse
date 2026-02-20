import { DashboardHeader } from '@/components/dashboard/header'
import { DashboardNav } from '@/components/dashboard/nav'
import { Logo } from '@/components/logo'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="grid h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:flex md:flex-col">
        <div className="flex h-14 shrink-0 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Logo />
        </div>
        <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start gap-2 px-2 py-4 text-sm font-medium lg:px-4">
            <DashboardNav />
          </nav>
        </div>
      </div>
      <div className="flex flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto bg-background p-4 lg:p-6">
          <div className="flex flex-col gap-4 lg:gap-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
