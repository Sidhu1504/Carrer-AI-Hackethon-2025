'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Loader2, Wand2, Upload } from 'lucide-react';
import { skillGapIdentification } from '@/ai/flows/skill-gap-identification';
import type { SkillGapIdentificationOutput } from '@/ai/flows/skill-gap-identification';
import { analyzeResumeAts } from '@/ai/flows/resume-ats-analysis';
import type { AnalyzeResumeAtsOutput } from '@/ai/flows/resume-ats-analysis';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, ChangeEvent } from 'react';
import * as pdfjs from 'pdfjs-dist/build/pdf';

// Required for pdfjs-dist to work
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


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
    const [state, formAction] = useActionState(analyzeResumeAction, { result: null, error: null });
    const [resumeText, setResumeText] = useState('');
    const [fileName, setFileName] = useState('');

    if (state.error) {
        toast({
          variant: "destructive",
          title: "Analysis Failed",
          description: state.error,
        });
    }

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast({
                title: 'Invalid File Type',
                description: 'Please upload a PDF file.',
                variant: 'destructive',
            });
            return;
        }

        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const typedArray = new Uint8Array(event.target?.result as ArrayBuffer);
            try {
                const pdf = await pdfjs.getDocument(typedArray).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map(item => ('str' in item ? item.str : '')).join(' ');
                }
                setResumeText(text);
                toast({
                    title: 'Success',
                    description: 'PDF parsed successfully. You can now analyze the resume.',
                });
            } catch (error) {
                console.error('Failed to parse PDF:', error);
                toast({
                    title: 'PDF Parsing Error',
                    description: 'Could not read text from the PDF. Please try pasting the text manually.',
                    variant: 'destructive',
                });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Provide Your Resume</CardTitle>
                </CardHeader>
                <CardContent>
                   <form action={formAction} className="space-y-4">
                        <Tabs defaultValue="paste" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="paste">Paste Text</TabsTrigger>
                                <TabsTrigger value="upload">Upload PDF</TabsTrigger>
                            </TabsList>
                            <TabsContent value="paste">
                                <Textarea
                                    name="resumeText"
                                    placeholder="Paste the full text of your resume here..."
                                    className="min-h-[250px] text-base mt-4"
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                    required
                                />
                            </TabsContent>
                            <TabsContent value="upload">
                                <div className="mt-4 flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
                                    <div className="text-center">
                                        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                                            <Label
                                                htmlFor="file-upload"
                                                className="relative cursor-pointer rounded-md font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 hover:text-primary/80"
                                            >
                                                <span>Upload a file</span>
                                                <Input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".pdf"/>
                                            </Label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs leading-5 text-muted-foreground">PDF up to 10MB</p>
                                        {fileName && <p className="text-sm mt-4 text-foreground">File: {fileName}</p>}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
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
