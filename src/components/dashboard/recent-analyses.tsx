import {
    Avatar,
    AvatarFallback,
} from "@/components/ui/avatar";
import { recentAnalysesData } from "@/lib/data";
import { FileText, MessageSquare } from "lucide-react";

export function RecentAnalyses() {
    return (
        <div className="space-y-8">
            {recentAnalysesData.map((analysis, index) => (
                <div className="flex items-center" key={index}>
                    <Avatar className="h-9 w-9">
                         <AvatarFallback className="bg-secondary">
                            {analysis.type === "Resume" ? 
                                <FileText className="h-4 w-4 text-muted-foreground" /> :
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            }
                         </AvatarFallback>
                    </Avatar>
                    <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">{analysis.role}</p>
                        <p className="text-sm text-muted-foreground">{analysis.date}</p>
                    </div>
                    <div className="ml-auto font-medium">{analysis.score}</div>
                </div>
            ))}
        </div>
    );
}
