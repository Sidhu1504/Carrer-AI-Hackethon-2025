'use client';

import { useState, useTransition, useEffect, ChangeEvent } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { PROFESSIONS } from '@/lib/constants';
import { generateInterviewQuestions } from '@/ai/flows/generate-interview-questions';
import type { GenerateInterviewQuestionsOutput } from '@/ai/flows/generate-interview-questions';
import { mockInterviewFeedback } from '@/ai/flows/mock-interview-feedback';
import type { MockInterviewFeedbackOutput } from '@/ai/flows/mock-interview-feedback';
import { Loader2, Mic, Sparkles, Star, ChevronLeft, ChevronRight, Check, MicOff, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useSpeechToText } from '@/hooks/use-speech-to-text';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import * as pdfjs from 'pdfjs-dist/build/pdf';
import { useUser, useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


// Required for pdfjs-dist to work
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;


type InterviewQuestion = GenerateInterviewQuestionsOutput['questions'][0];
type InterviewState = 'idle' | 'generating_questions' | 'ready_to_start' | 'in_progress' | 'getting_feedback' | 'feedback_ready' | 'completed';
type InterviewType = 'text' | 'voice';

export function MockInterviewClient() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    
    // Setup State
    const [profession, setProfession] = useState<string>('');
    const [interviewType, setInterviewType] = useState<InterviewType>('text');
    const [resumeText, setResumeText] = useState<string>('');
    const [fileName, setFileName] = useState('');
    
    // Interview State
    const [interviewState, setInterviewState] = useState<InterviewState>('idle');
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [allFeedback, setAllFeedback] = useState<(MockInterviewFeedbackOutput & { question: string })[]>([]);
    const [currentFeedback, setCurrentFeedback] = useState<MockInterviewFeedbackOutput | null>(null);

    const { isListening, transcript, startListening, stopListening, error: speechError } = useSpeechToText();

    const { user } = useUser();
    const firestore = useFirestore();

    useEffect(() => {
        if(speechError) {
            toast({
                title: 'Speech Recognition Error',
                description: speechError,
                variant: 'destructive'
            })
        }
    }, [speechError, toast]);

    useEffect(() => {
        if (transcript) {
            setAnswer(transcript);
        }
    }, [transcript]);
    
    useEffect(() => {
        if (interviewState === 'completed' && user && firestore) {
            const saveInterview = async () => {
                const avgScore = allFeedback.length > 0 ? allFeedback.reduce((acc, fb) => acc + fb.score, 0) / allFeedback.length : 0;
                
                const collectionRef = collection(firestore, `users/${user.uid}/mockInterviews`);
                const interviewData = {
                    userId: user.uid,
                    profession,
                    averageScore: avgScore,
                    interviewDate: serverTimestamp(),
                };
                
                addDoc(collectionRef, interviewData)
                  .catch(error => {
                    errorEmitter.emit(
                      'permission-error',
                      new FirestorePermissionError({
                        path: collectionRef.path,
                        operation: 'create',
                        requestResourceData: interviewData,
                      })
                    )
                  });
            };
            saveInterview();
        }
    }, [interviewState, user, firestore, allFeedback, profession]);

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
                    description: 'PDF parsed successfully. Questions will be based on this resume.',
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


    const handleGenerateQuestions = () => {
        if (!profession) {
            toast({ title: 'Please select a profession first.', variant: 'destructive' });
            return;
        }
        
        setInterviewState('generating_questions');
        setQuestions([]);
        setAllFeedback([]);
        setCurrentQuestionIndex(0);
        setCurrentFeedback(null);
        startTransition(async () => {
            try {
                const result = await generateInterviewQuestions({ 
                    profession,
                    resumeText: resumeText || undefined
                });
                setQuestions(result.questions);
                setInterviewState('ready_to_start');
            } catch (error) {
                console.error(error);
                toast({ title: 'Failed to generate questions.', description: 'Please try again.', variant: 'destructive' });
                setInterviewState('idle');
            }
        });
    };

    const startInterview = () => {
        setInterviewState('in_progress');
        setAnswer('');
        setCurrentFeedback(null);
    };

    const handleGetFeedback = () => {
        if(isListening) stopListening();

        const currentQuestion = questions[currentQuestionIndex];
        if (!currentQuestion || !answer) {
            toast({ title: 'Please provide an answer.', variant: 'destructive' });
            return;
        }
        setInterviewState('getting_feedback');
        startTransition(async () => {
            try {
                const result = await mockInterviewFeedback({ profession, question: currentQuestion.question, answer });
                setCurrentFeedback(result);
                setAllFeedback(prev => [...prev, { ...result, question: currentQuestion.question }]);
                setInterviewState('feedback_ready');
            } catch (error) {
                console.error(error);
                toast({ title: 'Failed to get feedback.', description: 'Please try again.', variant: 'destructive' });
                setInterviewState('in_progress');
            }
        });
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
            setInterviewState('in_progress');
            setAnswer('');
            setCurrentFeedback(null);
        } else {
            setInterviewState('completed');
        }
    };

    const handlePreviousQuestion = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
            setInterviewState('in_progress');
            setAnswer('');
            setCurrentFeedback(allFeedback[currentQuestionIndex - 1] || null);
             if (allFeedback[currentQuestionIndex - 1]) {
                setInterviewState('feedback_ready');
            }
        }
    };
    
    const resetInterview = () => {
        setInterviewState('idle');
        setProfession('');
        setQuestions([]);
        setAllFeedback([]);
        setCurrentQuestionIndex(0);
        setCurrentFeedback(null);
        setResumeText('');
        setFileName('');
    }

    const renderStars = (score: number) => {
        return Array.from({ length: 10 }, (_, i) => (
            <Star key={i} className={`h-5 w-5 ${i < Math.round(score) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
        ));
    };

    const currentQuestion = questions[currentQuestionIndex];
    const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

    // ----- RENDER LOGIC -----

    if (interviewState === 'idle' || interviewState === 'generating_questions') {
        return (
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>Setup Your Mock Interview</CardTitle>
                    <CardDescription>Choose a role and your preferred interview style to get started.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label>1. Select Your Target Role</Label>
                        <Select onValueChange={setProfession} value={profession}>
                            <SelectTrigger><SelectValue placeholder="Select a profession..." /></SelectTrigger>
                            <SelectContent>{PROFESSIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label>2. Choose Interview Type</Label>
                        <RadioGroup defaultValue="text" onValueChange={(v: InterviewType) => setInterviewType(v)} className="flex gap-4">
                            <Label htmlFor="type-text" className="flex items-center gap-2 border rounded-md p-3 flex-1 has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                                <RadioGroupItem value="text" id="type-text" /> Text-based Interview
                            </Label>
                            <Label htmlFor="type-voice" className="flex items-center gap-2 border rounded-md p-3 flex-1 has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                                <RadioGroupItem value="voice" id="type-voice" /> Voice-based Interview
                            </Label>
                        </RadioGroup>
                    </div>
                    <div className="space-y-2">
                         <Label>3. Tailor Questions (Optional)</Label>
                         <Tabs defaultValue="paste" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="paste">Paste Resume</TabsTrigger>
                                <TabsTrigger value="upload">Upload PDF</TabsTrigger>
                            </TabsList>
                            <TabsContent value="paste" className="mt-4">
                                <Textarea
                                    name="resumeText"
                                    placeholder="Paste your resume here to get tailored questions..."
                                    className="min-h-[150px]"
                                    value={resumeText}
                                    onChange={(e) => setResumeText(e.target.value)}
                                />
                            </TabsContent>
                            <TabsContent value="upload" className="mt-4">
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

                    <Button onClick={handleGenerateQuestions} disabled={!profession || interviewState === 'generating_questions'} className="w-full">
                        {interviewState === 'generating_questions' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Generate Questions
                    </Button>
                </CardContent>
            </Card>
        );
    }
    
    if (interviewState === 'ready_to_start') {
        return (
             <Card className="max-w-2xl mx-auto text-center">
                <CardHeader>
                    <CardTitle>You're All Set!</CardTitle>
                    <CardDescription>Your mock interview for a <span className="font-bold text-primary">{profession}</span> is ready.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-lg font-semibold">{questions.length} questions have been generated for you.</p>
                    {resumeText && <p className="text-sm text-muted-foreground">The questions have been tailored based on the resume you provided.</p>}
                     <p className="text-muted-foreground">When you're ready, start the interview. Good luck!</p>
                    <Button onClick={startInterview} size="lg">Start Interview</Button>
                </CardContent>
            </Card>
        )
    }

    if (interviewState === 'completed') {
        const avgScore = allFeedback.length > 0 ? allFeedback.reduce((acc, fb) => acc + fb.score, 0) / allFeedback.length : 0;
        return (
            <Card className="max-w-2xl mx-auto">
                <CardHeader className="text-center">
                    <CardTitle>Interview Complete!</CardTitle>
                    <CardDescription>Great job on finishing the interview. Here's your summary.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground">Overall Average Score</p>
                        <div className="flex items-center gap-2">
                           {renderStars(avgScore)}
                        </div>
                        <p className="text-2xl font-bold">{avgScore.toFixed(1)} / 10</p>
                    </div>
                    <Accordion type="single" collapsible className="w-full">
                         {allFeedback.map((fb, index) => (
                             <AccordionItem value={`item-${index}`} key={index}>
                                 <AccordionTrigger>
                                     <div className="flex justify-between w-full pr-4">
                                        <span>Question {index + 1}</span>
                                        <span className="font-bold">{fb.score}/10</span>
                                     </div>
                                </AccordionTrigger>
                                 <AccordionContent className="space-y-4">
                                      <p className="font-semibold text-muted-foreground">"{fb.question}"</p>
                                     <h4 className="font-semibold">Feedback:</h4>
                                     <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-md border bg-secondary/50 p-4">
                                        {fb.feedback}
                                     </div>
                                 </AccordionContent>
                             </AccordionItem>
                         ))}
                     </Accordion>
                    <Button onClick={resetInterview} className="w-full">Start New Interview</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle>Question {currentQuestionIndex + 1} of {questions.length}</CardTitle>
                            <CardDescription className="text-lg text-foreground pt-2">{currentQuestion.question}</CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                             <Badge variant="outline">{currentQuestion.category}</Badge>
                             <Badge variant={currentQuestion.difficulty === 'Advanced' ? 'destructive' : currentQuestion.difficulty === 'Intermediate' ? 'secondary' : 'default'} className="bg-opacity-20">
                                {currentQuestion.difficulty}
                             </Badge>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="space-y-2">
                        <Label htmlFor="answer">Your Answer</Label>
                        <div className="relative">
                            <Textarea
                                id="answer"
                                placeholder={
                                    interviewType === 'voice' 
                                        ? (isListening ? 'Listening...' : 'Click the mic to start speaking...') 
                                        : 'Type your answer here...'
                                }
                                className="min-h-[150px] text-base"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                                readOnly={interviewState !== 'in_progress' || isListening}
                            />
                            {interviewType === 'voice' && (
                                <Button
                                    size="icon"
                                    variant={isListening ? 'destructive' : 'outline'}
                                    className="absolute bottom-3 right-3"
                                    onClick={isListening ? stopListening : startListening}
                                    disabled={interviewState !== 'in_progress' || isPending}
                                >
                                    {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                                </Button>
                            )}
                        </div>
                     </div>
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
                    <ChevronLeft className="mr-2"/> Previous
                </Button>
                {(interviewState === 'in_progress' || interviewState === 'feedback_ready') && (
                    <>
                    {interviewState === 'in_progress' && (
                        <Button onClick={handleGetFeedback} disabled={!answer || isPending || isListening}>
                            {isPending ? <Loader2 className="animate-spin" /> : <Check className="mr-2"/>} Submit Answer
                        </Button>
                    )}
                     {interviewState === 'feedback_ready' && (
                        <Button onClick={handleNextQuestion}>
                            {currentQuestionIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question'}
                            <ChevronRight className="ml-2"/>
                        </Button>
                    )}
                    </>
                )}
            </div>

             { (interviewState === 'getting_feedback' || currentFeedback) && (
                <Card>
                    <CardHeader>
                        <CardTitle>AI Feedback</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {interviewState === 'getting_feedback' ? (
                            <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                        ) : currentFeedback && (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="font-semibold">Score:</span>
                                        <div className="flex">{renderStars(currentFeedback.score)}</div>
                                        <span className="font-bold text-lg">({currentFeedback.score}/10)</span>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">Constructive Feedback:</h4>
                                    <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-md border bg-secondary/50 p-4">
                                        {currentFeedback.feedback}
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
             )}

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-sm md:hidden">
                 <Progress value={progress} className="w-full" />
                 <p className="text-center text-sm text-muted-foreground mt-2">{currentQuestionIndex + 1} / {questions.length}</p>
            </div>
             <div className="hidden md:block">
                <Progress value={progress} className="w-full" />
             </div>
        </div>
    );
}
    