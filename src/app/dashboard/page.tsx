import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { RecentAnalyses } from "@/components/dashboard/recent-analyses";
import { PageHeader } from "@/components/page-header";

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Here's a snapshot of your career prep progress."
      />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
                Your mock interview scores over the last 7 weeks.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <OverviewChart />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              You've completed 5 analyses this month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecentAnalyses />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
