"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PROFESSIONS } from "@/lib/constants";
import { generateInterviewQuestions } from "@/ai/flows/generate-interview-questions";
import { mockInterviewFeedback } from "@/ai/flows/mock-interview-feedback";
import type { MockInterviewFeedbackOutput } from "@/ai/flows/mock-interview-feedback";
import { Loader2, MessageSquare, Sparkles, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type InterviewState = 'idle' | 'questions_loading' | 'questions_ready' | 'answering' | 'feedback_loading' | 'feedback_ready';

export function MockInterviewClient() {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [profession, setProfession] = useState<string>('');
    const [questions, setQuestions] = useState<string[]>([]);
    const [currentQuestion, setCurrentQuestion] = useState<string | null>(null);
    const [answer, setAnswer] = useState<string>('');
    const [feedback, setFeedback] = useState<MockInterviewFeedbackOutput | null>(null);
    const [interviewState, setInterviewState] = useState<InterviewState>('idle');

    const handleGenerateQuestions = () => {
        if (!profession) {
            toast({ title: 'Please select a profession first.', variant: 'destructive' });
            return;
        }
        setInterviewState('questions_loading');
        setQuestions([]);
        setCurrentQuestion(null);
        setFeedback(null);
        startTransition(async () => {
            try {
                const result = await generateInterviewQuestions({ profession });
                setQuestions(result.questions);
                setInterviewState('questions_ready');
            } catch (error) {
                console.error(error);
                toast({ title: 'Failed to generate questions.', description: 'Please try again.', variant: 'destructive' });
                setInterviewState('idle');
            }
        });
    };

    const handleSelectQuestion = (question: string) => {
        setCurrentQuestion(question);
        setAnswer('');
        setFeedback(null);
        setInterviewState('answering');
    };

    const handleGetFeedback = () => {
        if (!currentQuestion || !answer) {
            toast({ title: 'Please provide an answer.', variant: 'destructive' });
            return;
        }
        setInterviewState('feedback_loading');
        startTransition(async () => {
            try {
                const result = await mockInterviewFeedback({ profession, question: currentQuestion, answer });
                setFeedback(result);
                setInterviewState('feedback_ready');
            } catch (error) {
                console.error(error);
                toast({ title: 'Failed to get feedback.', description: 'Please try again.', variant: 'destructive' });
                setInterviewState('answering');
            }
        });
    };

    const renderStars = (score: number) => {
        const stars = [];
        for (let i = 1; i <= 10; i++) {
            stars.push(<Star key={i} className={`h-5 w-5 ${i <= score ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />);
        }
        return stars;
    };
    
    return (
        <div className="grid gap-8 lg:grid-cols-2">
            {/* Left Column: Setup and Questions */}
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>1. Select Your Profession</CardTitle>
                        <CardDescription>Choose a role to get tailored interview questions.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col sm:flex-row gap-2">
                        <Select onValueChange={setProfession} value={profession}>
                            <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Select a profession..." />
                            </SelectTrigger>
                            <SelectContent>
                                {PROFESSIONS.map((p) => (
                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button onClick={handleGenerateQuestions} disabled={!profession || interviewState === 'questions_loading'} className="w-full sm:w-auto">
                            {interviewState === 'questions_loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                            Generate Questions
                        </Button>
                    </CardContent>
                </Card>

                {(interviewState === 'questions_loading' || questions.length > 0) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>2. Choose a Question</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {interviewState === 'questions_loading' ? (
                                <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                            ) : (
                                <div className="space-y-2">
                                    {questions.map((q, i) => (
                                        <Button key={i} variant={currentQuestion === q ? "secondary" : "outline"} className="w-full justify-start text-left h-auto py-2" onClick={() => handleSelectQuestion(q)}>
                                            <MessageSquare className="mr-2 h-4 w-4 flex-shrink-0" />
                                            <span>{q}</span>
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Right Column: Answering and Feedback */}
            <div className="space-y-6">
                {interviewState !== 'idle' && interviewState !== 'questions_loading' && currentQuestion && (
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Your Answer</CardTitle>
                            <CardDescription className="text-primary">{currentQuestion}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Textarea
                                placeholder="Type your answer here..."
                                className="min-h-[150px] text-base"
                                value={answer}
                                onChange={(e) => setAnswer(e.target.value)}
                            />
                            <Button onClick={handleGetFeedback} disabled={!answer || interviewState === 'feedback_loading'}>
                                {interviewState === 'feedback_loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                Get Feedback
                            </Button>
                        </CardContent>
                    </Card>
                )}
                
                {(interviewState === 'feedback_loading' || feedback) && (
                    <Card>
                        <CardHeader>
                            <CardTitle>AI Feedback</CardTitle>
                        </CardHeader>
                        <CardContent>
                             {interviewState === 'feedback_loading' ? (
                                <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>
                            ) : feedback && (
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-semibold">Score:</span>
                                            <div className="flex">{renderStars(feedback.score)}</div>
                                            <span className="font-bold text-lg">({feedback.score}/10)</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2">Constructive Feedback:</h4>
                                        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap rounded-md border bg-secondary/50 p-4">
                                            {feedback.feedback}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
