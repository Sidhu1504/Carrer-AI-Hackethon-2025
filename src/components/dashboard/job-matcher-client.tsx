'use client';

import { useActionState, useState, ChangeEvent, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Wand2, Upload } from 'lucide-react';
import { analyzeJobMatch } from '@/ai/flows/job-matcher-analysis';
import type { JobMatchAnalysisOutput } from '@/ai/flows/job-matcher-analysis';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import * as pdfjs from 'pdfjs-dist/build/pdf';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';

// Required for pdfjs-dist to work
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

type AnalysisResult = JobMatchAnalysisOutput | null;

async function analyzeMatchAction(prevState: any, formData: FormData): Promise<{ result: AnalysisResult; error: string | null; }> {
    const resumeText = formData.get('resumeText') as string;
    const jobDescription = formData.get('jobDescription') as string;

    if (!resumeText || resumeText.trim().length < 50) {
        return { result: null, error: "Please provide your resume (at least 50 characters)." };
    }
    if (!jobDescription || jobDescription.trim().length < 20) {
        return { result: null, error: "Please provide a job description (at least 20 characters)." };
    }

    try {
        const result = await analyzeJobMatch({ resumeText, jobDescription });
        return { result, error: null };
    } catch (e) {
        console.error(e);
        return { result: null, error: "An error occurred during analysis. Please try again." };
    }
}


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {pending ? 'Analyzing Match...' : 'Analyze Job Match'}
        </Button>
    );
}

export function JobMatcherClient() {
    const { toast } = useToast();
    const [state, formAction] = useActionState(analyzeMatchAction, { result: null, error: null });
    const [resumeText, setResumeText] = useState('');
    const [fileName, setFileName] = useState('');
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (state.error) {
            toast({
              variant: "destructive",
              title: "Analysis Failed",
              description: state.error,
            });
        }
    }, [state.error, toast]);


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
                    description: 'Resume parsed successfully.',
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
    
    if (!isClient) {
        return null; // Render nothing on the server
    }

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Analyze Job-Resume Fit</CardTitle>
                    <CardDescription>Provide your resume and a job description to see how you match.</CardDescription>
                </CardHeader>
                <CardContent>
                   <form action={formAction} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="font-semibold">1. Your Resume</Label>
                            <Tabs defaultValue="paste" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="paste">Paste Text</TabsTrigger>
                                    <TabsTrigger value="upload">Upload PDF</TabsTrigger>
                                </TabsList>
                                <TabsContent value="paste" className="mt-4">
                                    <Textarea
                                        name="resumeText"
                                        placeholder="Paste the full text of your resume here..."
                                        className="min-h-[150px] text-base"
                                        value={resumeText}
                                        onChange={(e) => setResumeText(e.target.value)}
                                        required
                                    />
                                </TabsContent>
                                <TabsContent value="upload" className="mt-4">
                                    <input type="hidden" name="resumeText" value={resumeText} />
                                    <div className="flex justify-center rounded-lg border border-dashed border-input px-6 py-10">
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
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="job-description" className="font-semibold">2. Target Job Description</Label>
                            <Textarea
                                id="job-description"
                                name="jobDescription"
                                placeholder="Paste the full job description here..."
                                className="min-h-[150px] text-base"
                                required
                            />
                        </div>

                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>

            {state.result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Job Match Analysis</CardTitle>
                        <CardDescription>Here's how your profile aligns with the job description.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-lg font-medium">Overall Match Score</p>
                                <p className="font-bold text-2xl text-primary">{state.result.matchScore}%</p>
                            </div>
                            <Progress value={state.result.matchScore} />
                        </div>
                        
                        <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                            <AccordionItem value="item-1">
                                <AccordionTrigger className="text-base">Strong Areas</AccordionTrigger>
                                <AccordionContent>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {state.result.strongAreas.map(skill => (
                                            <Badge key={skill} variant="secondary" className="text-sm bg-green-500/20 text-green-300 border-green-500/30">{skill}</Badge>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-2">
                                <AccordionTrigger className="text-base">Areas for Improvement</AccordionTrigger>
                                <AccordionContent>
                                     <div className="flex flex-wrap gap-2 pt-2">
                                        {state.result.improvementAreas.map(skill => (
                                            <Badge key={skill} variant="destructive" className="text-sm bg-red-500/20 text-red-300 border-red-500/30">{skill}</Badge>
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                             <AccordionItem value="item-3">
                                <AccordionTrigger className="text-base">Targeted Study Plan</AccordionTrigger>
                                <AccordionContent>
                                    <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-secondary/10 p-4">
                                        <ReactMarkdown>{state.result.targetedStudyPlan}</ReactMarkdown>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>

                    </CardContent>
                </Card>
            )}
        </div>
    );
}
