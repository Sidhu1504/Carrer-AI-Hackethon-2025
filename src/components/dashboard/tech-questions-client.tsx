'use client';

import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Wand2 } from 'lucide-react';
import { generateTechQuestions, type GenerateTechQuestionsOutput } from '@/ai/flows/generate-tech-questions';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ReactMarkdown from 'react-markdown';

type QuestionType = 'theory' | 'practical';
type ActionResult = {
    result: GenerateTechQuestionsOutput | null;
    error: string | null;
};

async function generateQuestionsAction(prevState: any, formData: FormData): Promise<ActionResult> {
    const technologies = formData.get('technologies') as string;
    const questionType = formData.get('questionType') as QuestionType;

    if (!technologies || technologies.trim().length === 0) {
        return { result: null, error: "Please enter at least one technology." };
    }
    
    const techArray = technologies.split(',').map(t => t.trim()).filter(t => t.length > 0);

    if (techArray.length === 0) {
        return { result: null, error: "Please enter at least one valid technology." };
    }

    try {
        const result = await generateTechQuestions({ technologies: techArray, questionType });
        return { result, error: null };
    } catch (e) {
        console.error(e);
        return { result: null, error: "An error occurred while generating questions. Please try again." };
    }
}


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {pending ? 'Generating...' : 'Generate Questions'}
        </Button>
    );
}

export function TechQuestionsClient() {
    const { toast } = useToast();
    const [state, formAction] = useActionState(generateQuestionsAction, { result: null, error: null });

    useEffect(() => {
        if (state.error) {
            toast({
              variant: "destructive",
              title: "Generation Failed",
              description: state.error,
            });
        }
    }, [state.error, toast]);

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Generate Technical Questions</CardTitle>
                    <CardDescription>Enter technologies and choose a question type.</CardDescription>
                </CardHeader>
                <CardContent>
                   <form action={formAction} className="space-y-6">
                         <div className="space-y-2">
                            <Label htmlFor="technologies">Technologies</Label>
                            <Input
                                id="technologies"
                                name="technologies"
                                placeholder="e.g., React, Node.js, SQL"
                                required
                            />
                             <p className="text-sm text-muted-foreground">Enter a comma-separated list of technologies.</p>
                        </div>
                        
                        <div className="space-y-3">
                            <Label>Question Type</Label>
                            <RadioGroup name="questionType" defaultValue="theory" className="flex gap-4">
                                <Label htmlFor="type-theory" className="flex items-center gap-2 border rounded-md p-3 flex-1 has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                                    <RadioGroupItem value="theory" id="type-theory" /> Theory Questions
                                </Label>
                                <Label htmlFor="type-practical" className="flex items-center gap-2 border rounded-md p-3 flex-1 has-[:checked]:bg-primary/10 has-[:checked]:border-primary cursor-pointer">
                                    <RadioGroupItem value="practical" id="type-practical" /> Practical Tasks
                                </Label>
                            </RadioGroup>
                        </div>
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>

            {state.result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Generated Questions & Tasks</CardTitle>
                        <CardDescription>Here are the AI-generated questions based on your selection.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
                            {state.result.questions.map((q, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger>{q.question}</AccordionTrigger>
                                    <AccordionContent>
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown>{q.details}</ReactMarkdown>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
