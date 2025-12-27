import { PageHeader } from "@/components/page-header";
import { MockInterviewClient } from "@/components/dashboard/mock-interview-client";

export default function MockInterviewPage() {
    return (
        <>
            <PageHeader
                title="Mock Interview"
                description="Select a profession, get tailored questions, and receive instant AI feedback."
            />
            <MockInterviewClient />
        </>
    );
}
