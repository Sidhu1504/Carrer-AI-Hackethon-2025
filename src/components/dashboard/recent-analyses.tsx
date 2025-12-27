'use client';

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText, MessageSquare, Loader2 } from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { formatDistanceToNow } from 'date-fns';

type CombinedHistory = {
    id: string;
    type: "Resume" | "Interview";
    title: string;
    score: string;
    date: Date;
}

export function RecentAnalyses() {
    const { user } = useUser();
    const firestore = useFirestore();

    const resumeAnalysesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, `users/${user.uid}/resumeAnalyses`),
            orderBy("analysisDate", "desc"),
            limit(5)
        );
    }, [user, firestore]);

    const mockInterviewsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, `users/${user.uid}/mockInterviews`),
            orderBy("interviewDate", "desc"),
            limit(5)
        );
    }, [user, firestore]);

    const { data: resumeAnalyses, isLoading: isLoadingResumes } = useCollection(resumeAnalysesQuery);
    const { data: mockInterviews, isLoading: isLoadingInterviews } = useCollection(mockInterviewsQuery);

    const combinedAndSortedHistory: CombinedHistory[] = [
        ...(resumeAnalyses || []).map(r => ({
            id: r.id,
            type: "Resume" as const,
            title: `ATS Score`,
            score: `${r.atsScore}%`,
            date: r.analysisDate?.toDate()
        })),
        ...(mockInterviews || []).map(i => ({
            id: i.id,
            type: "Interview" as const,
            title: `${i.profession}`,
            score: `${i.averageScore.toFixed(1)}/10`,
            date: i.interviewDate?.toDate()
        })),
    ].filter(item => item.date).sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);


    if (isLoadingResumes || isLoadingInterviews) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary"/>
            </div>
        );
    }
    
    if (!combinedAndSortedHistory || combinedAndSortedHistory.length === 0) {
        return <p className="text-muted-foreground text-sm text-center">No recent activity found. Analyze a resume or take a mock interview to get started!</p>;
    }

    return (
        <div className="space-y-8">
            {combinedAndSortedHistory.map((item) => (
                <div className="flex items-center" key={item.id}>
                    <Avatar className="h-9 w-9">
                         <AvatarFallback className="bg-secondary">
                            {item.type === "Resume" ? 
                                <FileText className="h-4 w-4 text-muted-foreground" /> :
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            }
                         </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{formatDistanceToNow(item.date, { addSuffix: true })}</p>
                    </div>
                    <div className="ml-auto font-medium">{item.score}</div>
                </div>
            ))}
        </div>
    );
}
    