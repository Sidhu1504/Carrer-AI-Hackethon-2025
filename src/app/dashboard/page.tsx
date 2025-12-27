'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { OverviewChart } from "@/components/dashboard/overview-chart";
import { RecentAnalyses } from "@/components/dashboard/recent-analyses";
import {
    Activity,
    Award,
    BarChart,
    Target,
    TrendingDown,
    TrendingUp,
} from 'lucide-react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const userName = user?.displayName || user?.email?.split('@')[0] || 'there';

  const mockInterviewsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, `users/${user.uid}/mockInterviews`),
      orderBy("interviewDate", "asc")
    );
  }, [user, firestore]);

  const { data: mockInterviews, isLoading: isLoadingInterviews } = useCollection(mockInterviewsQuery);

  const interviewsTaken = mockInterviews?.length || 0;
  const avgInterviewScore = interviewsTaken > 0 
    ? mockInterviews.reduce((acc, interview) => acc + interview.averageScore, 0) / interviewsTaken
    : 0;

  const chartData = mockInterviews?.map((interview, index) => ({
    name: `Session ${index + 1}`,
    score: interview.averageScore,
  })) || [];
  
  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {userName} 👋
          </h1>
          <p className="text-muted-foreground">
            Here's an overview of your progress and recent activity.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Readiness Score</CardTitle>
                    <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">82%</div>
                    <p className="text-xs text-muted-foreground">For a Senior DevOps role</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Skills Coverage</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-primary">91%</div>
                    <p className="text-xs text-muted-foreground">vs. target role</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Interview Score</CardTitle>
                    <BarChart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoadingInterviews ? <Skeleton className="h-8 w-24" /> : (
                      <>
                        <div className="text-2xl font-bold">{avgInterviewScore.toFixed(1)} / 10</div>
                        <p className="text-xs text-muted-foreground">Based on {interviewsTaken} interviews</p>
                      </>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Interviews Taken</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     {isLoadingInterviews ? <Skeleton className="h-8 w-12" /> : (
                        <>
                            <div className="text-2xl font-bold">{interviewsTaken}</div>
                            <p className="text-xs text-muted-foreground">Keep practicing!</p>
                        </>
                    )}
                </CardContent>
            </Card>
            
            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Strong Areas</CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-2">
                    {['Kubernetes', 'Terraform', 'CI/CD', 'AWS'].map(skill => (
                        <span key={skill} className="text-xs font-medium bg-green-500/20 text-green-400 px-2 py-1 rounded-full">{skill}</span>
                    ))}
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Weak Areas</CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 pt-2">
                     {['Python', 'Go', 'System Design'].map(skill => (
                        <span key={skill} className="text-xs font-medium bg-red-500/20 text-red-400 px-2 py-1 rounded-full">{skill}</span>
                    ))}
                </CardContent>
            </Card>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
            <CardDescription>
              Your mock interview scores over time.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {isLoadingInterviews ? (
              <div className="flex items-center justify-center h-[350px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <OverviewChart data={chartData} />
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>An overview of your recent actions.</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentAnalyses />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
    