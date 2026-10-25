import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { instruments } from "~/lib/instruments/registry";
import type { Instrument } from "~/lib/instruments/schema";

const personalityCopy: Record<string, { summary: string; title: string }> = {
  "big-five-ipip-50": {
    summary:
      "Extraversion, agreeableness, conscientiousness, emotional stability, and intellect.",
    title: "Big Five, in brief",
  },
  "big-five-ipip-neo-120": {
    summary: "Five broad personality domains and 30 narrower facets.",
    title: "The long version",
  },
  "sixteen-factor-ipip": {
    summary: "Sixteen narrower traits, from warmth to tension.",
    title: "Sixteen sides",
  },
};

const InstrumentCard = ({ instrument }: { instrument: Instrument }) => {
  const copy = personalityCopy[instrument.slug];
  return (
    <article className="home-test-card">
      <Card>
        <Separator />
        <CardHeader>
          <CardTitle>
            <h3>
              <Link
                className="hover:text-primary inline-flex items-center gap-1"
                title={instrument.title}
                to={`/tests/${instrument.slug}`}
              >
                {copy?.title ?? instrument.title}
                <ArrowUpRight aria-hidden="true" className="size-4" />
              </Link>
            </h3>
          </CardTitle>
          <CardDescription>
            {copy?.summary ?? instrument.summary}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <span>{instrument.items.length} questions</span>
          <span>
            {instrument.info.durationMinutes.min} to{" "}
            {instrument.info.durationMinutes.max} minutes
          </span>
        </CardFooter>
      </Card>
    </article>
  );
};

export const LandingTests = () => {
  const screening = instruments.filter(
    (instrument) => instrument.category === "screening"
  );
  const other = instruments
    .filter((instrument) => instrument.category !== "screening")
    .toSorted((left, right) => left.items.length - right.items.length);

  return (
    <section aria-labelledby="explore-title">
      <header className="home-explore-heading" id="explore">
        <h2 id="explore-title">Which test would you like to take?</h2>
        <Link className="hover:underline" to="/methodology">
          The science behind the questions ↗
        </Link>
      </header>
      <div className="grid gap-8 md:grid-cols-3 md:gap-5">
        {other.map((instrument) => (
          <InstrumentCard instrument={instrument} key={instrument.slug} />
        ))}
        {screening.length > 0 ? (
          <article className="home-test-card">
            <Card>
              <Separator />
              <CardHeader>
                <CardTitle>
                  <h3>Anxiety and low mood</h3>
                </CardTitle>
                <CardDescription>
                  Two short screens. A score is a starting point, not a
                  diagnosis.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                {screening.map((instrument) => (
                  <Link
                    aria-label={instrument.title}
                    className="hover:text-primary underline underline-offset-4"
                    key={instrument.slug}
                    to={`/tests/${instrument.slug}`}
                  >
                    {instrument.slug.toUpperCase()} ↗
                  </Link>
                ))}
              </CardFooter>
            </Card>
          </article>
        ) : null}
      </div>
    </section>
  );
};
