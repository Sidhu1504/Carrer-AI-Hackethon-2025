import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FileText, Lightbulb, MessageSquare, BarChart2 } from 'lucide-react';

interface FeatureProps {
  icon: JSX.Element;
  title: string;
  description: string;
}

const features: FeatureProps[] = [
  {
    icon: <FileText />,
    title: 'Resume Analyzer',
    description: 'Get an instant ATS score and actionable tips to optimize your resume for any job application.',
  },
  {
    icon: <Lightbulb />,
    title: 'Skill-Gap Analysis',
    description: 'Our AI identifies your missing skills and generates a personalized 4-week learning plan to get you job-ready.',
  },
  {
    icon: <MessageSquare />,
    title: 'Mock Interviews',
    description: 'Practice with AI-generated questions for your target role and receive instant feedback and scores on your answers.',
  },
  {
    icon: <BarChart2 />,
    title: 'Performance Dashboard',
    description: 'Track your progress over time, compare results, and visualize your journey to career success.',
  },
];

export const FeaturesSection = () => {
  return (
    <section id="features" className="container py-24 sm:py-32 space-y-8">
      <h2 className="text-3xl lg:text-4xl font-bold md:text-center">
        Many{' '}
        <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
          Great Features
        </span>
      </h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map(({ icon, title, description }) => (
          <Card key={title} className="bg-card/50">
            <CardHeader>
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary mb-4">
                {icon}
              </div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
};
