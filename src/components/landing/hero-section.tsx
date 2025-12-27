import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';

export function HeroSection() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero');

  return (
    <section className="container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-6xl font-bold">
          <h1 className="inline">
            <span className="inline bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Craft
            </span>{' '}
            Your Career Path with AI
          </h1>
        </main>
        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
          Leverage AI to analyze your resume, identify skill gaps, and ace your interviews. Your personal AI career coach is here.
        </p>
        <div className="space-x-4">
          <Button asChild className="w-full md:w-1/3">
            <Link href="/signup">Get Started Free</Link>
          </Button>
          <Button asChild variant="outline" className="w-full md:w-1/3">
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </div>
      <div className="z-10">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            width={1200}
            height={800}
            className="rounded-lg shadow-2xl"
            data-ai-hint={heroImage.imageHint}
          />
        )}
      </div>
      <div className="absolute inset-0 -z-10 h-full w-full bg-background [mask-image:radial-gradient(100%_100%_at_top_right,white,transparent)]" />
    </section>
  );
}
