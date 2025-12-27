"use client";

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Loader2, Wand2 } from 'lucide-react';
import { skillGapIdentification } from '@/ai/flows/skill-gap-identification';
import { analyzeResumeAts } from '@/ai/flows/resume-ats-analysis';
import type { SkillGapIdentificationOutput } from '@/ai/flows/skill-gap-identification';
import type { AnalyzeResumeAtsOutput } from '@/ai/flows/resume-ats-analysis';
import { useToast } from '@/hooks/use-toast';

type AnalysisResult = {
    ats: AnalyzeResumeAtsOutput;
    skills: SkillGapIdentificationOutput;
} | null;

async function analyzeResumeAction(prevState: any, formData: FormData): Promise<{ result: AnalysisResult; error: string | null; }> {
    const resumeText = formData.get('resumeText') as string;
    if (!resumeText || resumeText.trim().length < 50) {
        return { result: null, error: "Please enter at least 50 characters of your resume." };
    }

    try {
        const [atsResult, skillsResult] = await Promise.all([
            analyzeResumeAts({ resumeData: resumeText }),
            skillGapIdentification({ resumeText: resumeText }),
        ]);

        return { result: { ats: atsResult, skills: skillsResult }, error: null };
    } catch (e) {
        console.error(e);
        return { result: null, error: "An error occurred during analysis. Please try again." };
    }
}


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {pending ? 'Analyzing...' : 'Analyze Resume'}
        </Button>
    );
}

export function ResumeAnalyzerClient() {
    const { toast } = useToast();
    const [state, formAction] = useFormState(analyzeResumeAction, { result: null, error: null });
    
    if (state.error) {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: state.error,
        });
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Paste Your Resume</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={formAction} className="space-y-4">
                        <Textarea
                            name="resumeText"
                            placeholder="Paste the full text of your resume here..."
                            className="min-h-[250px] text-base"
                            required
                        />
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>

            {state.result && (
                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>ATS Analysis</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-muted-foreground">ATS Compatibility Score</p>
                                    <p className="font-bold text-lg text-primary">{state.result.ats.atsScore}%</p>
                                </div>
                                <Progress value={state.result.ats.atsScore} />
                            </div>
                            <Accordion type="single" collapsible defaultValue="item-1">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>Improvement Suggestions</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                            {state.result.ats.improvementSuggestions}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Skill Gap Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                                <AccordionItem value="item-1">
                                    <AccordionTrigger>Missing Skills</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="flex flex-wrap gap-2">
                                            {state.result.skills.missingSkills.map((skill) => (
                                                <div key={skill} className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-sm">
                                                    {skill}
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">
                                    <AccordionTrigger>4-Week Learning Plan</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">
                                            {state.result.skills.learningPlan}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
