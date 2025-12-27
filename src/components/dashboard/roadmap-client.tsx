'use client';

import { useActionState, useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Wand2 } from 'lucide-react';
import { generateRoadmap } from '@/ai/flows/generate-roadmap';
import type { GenerateRoadmapOutput } from '@/ai/flows/generate-roadmap';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PROFESSIONS } from '@/lib/constants';
import ReactMarkdown from 'react-markdown';

type ActionResult = {
    result: GenerateRoadmapOutput | null;
    error: string | null;
};

async function generateRoadmapAction(prevState: any, formData: FormData): Promise<ActionResult> {
    const profession = formData.get('profession') as string;

    if (!profession) {
        return { result: null, error: "Please select a profession." };
    }

    try {
        const result = await generateRoadmap({ profession });
        return { result, error: null };
    } catch (e) {
        console.error(e);
        return { result: null, error: "An error occurred while generating the roadmap. Please try again." };
    }
}


function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {pending ? 'Generating...' : 'Generate Roadmap'}
        </Button>
    );
}

export function RoadmapClient() {
    const { toast } = useToast();
    const [state, formAction] = useActionState(generateRoadmapAction, { result: null, error: null });
    const [profession, setProfession] = useState('');

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
                    <CardTitle>Select a Goals</CardTitle>
                    <CardDescription>Choose a career path to generate a detailed learning roadmap.</CardDescription>
                </CardHeader>
                <CardContent>
                   <form action={formAction} className="flex flex-wrap items-end gap-4">
                        <div className="grid gap-2 flex-1 min-w-[200px]">
                            <Label htmlFor="profession">Profession</Label>
                            <Select name="profession" value={profession} onValueChange={setProfession}>
                                <SelectTrigger id="profession">
                                    <SelectValue placeholder="Select a role..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROFESSIONS.map((p) => (
                                        <SelectItem key={p} value={p}>{p}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>

            {state.result && (
                <Card>
                    <CardHeader>
                        <CardTitle>Your Roadmap to Becoming a {profession}</CardTitle>
                        <CardDescription>Follow these steps to build your skills and land your dream job.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="prose prose-sm dark:prose-invert max-w-none rounded-md border bg-secondary/10 p-4">
                            <ReactMarkdown>{state.result.roadmap}</ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
