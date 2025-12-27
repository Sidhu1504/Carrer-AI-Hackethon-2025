import { PageHeader } from "@/components/page-header";
import { ResumeAnalyzerClient } from "@/components/dashboard/resume-analyzer-client";

export default function ResumeAnalyzerPage() {
    return (
        <>
            <PageHeader
                title="Resume Analyzer"
                description="Upload your resume to get an ATS score, improvement tips, and a personalized learning plan."
            />
            <ResumeAnalyzerClient />
        </>
    );
}
