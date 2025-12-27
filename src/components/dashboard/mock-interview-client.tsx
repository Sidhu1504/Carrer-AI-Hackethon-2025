'use client';

import { useState, useTransition } from 'react';
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
import { generateInterviewQuestions, type GenerateInterviewQuestionsOutput } from '@/ai/flows/generate-interview-questions';
import { mockInterviewFeedback, type MockInterviewFeedbackOutput } from '@/ai/flows/mock-interview-feedback';
import { Loader2, Mic, Sparkles, Star, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

type InterviewQuestion = GenerateInterviewQuestionsOutput['questions'][0];
type InterviewState = 'idle' | 'generating_questions' | 'ready_to_start' | 'in_progress' | 'getting_feedback' | 'feedback_ready' | 'completed';
type InterviewType = 'text' | 'voice';

export function MockInterviewClient() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    
    // Setup State
    const [profession, setProfession] = useState<string>('');
    const [interviewType, setInterviewType] = useState<InterviewType>('text');
    
    // Interview State
    const [interviewState, setInterviewState] = useState<InterviewState>('idle');
    const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answer, setAnswer] = useState('');
    const [allFeedback, setAllFeedback] = useState<(MockInterviewFeedbackOutput & { question: string })[]>([]);
    const [currentFeedback, setCurrentFeedback] = useState<MockInterviewFeedbackOutput | null>(null);

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
                const result = await generateInterviewQuestions({ profession });
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
                    <CardDescription>Choose a role and interview type to get started.</CardDescription>
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
                            <Label htmlFor="type-voice" className="flex items-center gap-2 border rounded-md p-3 flex-1 has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-not-allowed opacity-50" aria-disabled="true">
                                <RadioGroupItem value="voice" id="type-voice" disabled /> Voice-based (Coming Soon)
                            </Label>
                        </RadioGroup>
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
                        <Textarea
                            id="answer"
                            placeholder="Type your answer here..."
                            className="min-h-[150px] text-base"
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                            readOnly={interviewState !== 'in_progress'}
                        />
                     </div>
                     {interviewType === 'voice' && (
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" disabled><Mic className="h-5 w-5"/></Button>
                            <p className="text-sm text-muted-foreground">Voice input is not yet enabled.</p>
                        </div>
                     )}
                </CardContent>
            </Card>

            <div className="flex justify-between items-center">
                <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
                    <ChevronLeft className="mr-2"/> Previous
                </Button>
                {interviewState === 'in_progress' && (
                    <Button onClick={handleGetFeedback} disabled={!answer || isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : <Check className="mr-2"/>} Submit Answer
                    </Button>
                )}
                 {interviewState === 'feedback_ready' && (
                    <Button onClick={handleNextQuestion}>
                        {currentQuestionIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question'}
                        <ChevronRight className="ml-2"/>
                    </Button>
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
