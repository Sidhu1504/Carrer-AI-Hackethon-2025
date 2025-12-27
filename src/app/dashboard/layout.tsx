import { MainNav } from "@/components/dashboard/main-nav";
import { UserNav } from "@/components/dashboard/user-nav";
import { Logo } from "@/components/logo";
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="hidden flex-col md:flex">
      <div className="border-b">
        <div className="flex h-16 items-center px-4">
          <Link href="/dashboard">
            <Logo />
          </Link>
          <div className="ml-auto flex items-center space-x-4">
            <UserNav />
          </div>
        </div>
      </div>
      <div className="flex">
        <aside className="w-64 border-r p-4">
          <MainNav />
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
