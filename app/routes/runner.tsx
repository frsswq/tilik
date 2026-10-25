import { Link, useNavigate, useParams } from "react-router";

import { InstrumentAvatar } from "~/components/instrument-avatar";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "~/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { findInstrument } from "~/lib/instruments/registry";
import type { Instrument, AnswerValue } from "~/lib/instruments/schema";
import { useTestSession } from "~/lib/use-test-session";

export const meta = () => [{ title: "Take a test - Tilik" }];

/** Ten items per page keeps the page short without hiding the scale. */
const PAGE_SIZE = 10;

interface ScaleOption {
  label: string;
  value: AnswerValue;
}

const scaleOptions = (instrument: Instrument): ScaleOption[] =>
  Object.entries(instrument.scale.labels)
    .map(([value, label]) => ({ label, value: Number(value) as AnswerValue }))
    .toSorted((left, right) => left.value - right.value);

/**
 * The first and last label, plus the middle label only when the scale has one.
 * A four-point scale has no middle option, so it shows its two anchors.
 */
const scaleLegend = (instrument: Instrument): ScaleOption[] => {
  const options = scaleOptions(instrument);
  const middle =
    options.length % 2 === 1 ? options[(options.length - 1) / 2] : undefined;

  return [options[0], middle, options.at(-1)].filter(
    (option): option is ScaleOption => option !== undefined
  );
};

const NotFound = () => (
  <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 p-4 py-16">
    <h1 className="font-heading text-2xl font-semibold">Test not found</h1>
    <Link className={buttonVariants()} to="/">
      See all tests
    </Link>
  </main>
);

const TestRunner = ({ instrument }: { instrument: Instrument }) => {
  const navigate = useNavigate();
  const session = useTestSession(instrument);
  const options = scaleOptions(instrument);
  const total = instrument.items.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(session.page, pageCount - 1);
  const pageItems = instrument.items.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );
  const answered = Object.keys(session.answers).length;
  const pageComplete = pageItems.every(
    (item) => session.answers[item.id] !== undefined
  );
  const complete = answered === total;
  const isLastPage = page === pageCount - 1;

  const goNext = () => {
    if (isLastPage) {
      navigate(`/tests/${instrument.slug}/result`);
      return;
    }
    session.setPage(page + 1);
    globalThis.scrollTo({ top: 0 });
  };

  const goPrevious = () => {
    session.setPage(Math.max(0, page - 1));
    globalThis.scrollTo({ top: 0 });
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 py-8">
      <header className="flex flex-col gap-4">
        <h1 className="sr-only">{instrument.title}</h1>
        <div className="flex items-center gap-3">
          <InstrumentAvatar avatar={instrument.avatar} className="size-8" />
          <Link
            className="text-muted-foreground hover:text-foreground text-sm underline underline-offset-4"
            to={`/tests/${instrument.slug}`}
          >
            {instrument.title}
          </Link>
        </div>
        <Progress aria-label="Answered items" max={total} value={answered}>
          <ProgressLabel>
            Page {page + 1} of {pageCount}
          </ProgressLabel>
          <ProgressValue>
            {() => `${answered} of ${total} answered`}
          </ProgressValue>
        </Progress>
        <p className="text-muted-foreground flex justify-between text-xs">
          {scaleLegend(instrument).map((option, index) => (
            <span
              className={index === 1 ? "hidden sm:inline" : undefined}
              key={option.value}
            >
              {`${option.value} ${option.label}`}
            </span>
          ))}
        </p>
      </header>

      {complete ? (
        <Alert>
          <AlertTitle>You have finished this test</AlertTitle>
          <AlertDescription>
            {`All ${total} items are answered. `}
            <Link
              className="underline underline-offset-4"
              to={`/tests/${instrument.slug}/result`}
            >
              See your result
            </Link>
            .
          </AlertDescription>
        </Alert>
      ) : null}

      <ol className="flex flex-col">
        {pageItems.map((item) => {
          const statementId = `statement-${item.id}`;

          return (
            <li
              className="flex flex-col gap-3 border-b py-5 first:border-t"
              key={item.id}
            >
              <p className="text-sm sm:text-base" id={statementId}>
                {item.text}
              </p>
              <RadioGroup
                aria-labelledby={statementId}
                className="w-full grid-cols-5"
                onValueChange={(value) =>
                  session.setAnswer(item.id, Number(value) as AnswerValue)
                }
                value={
                  session.answers[item.id] === undefined
                    ? null
                    : String(session.answers[item.id])
                }
              >
                {options.map((option) => (
                  <label
                    className="hover:bg-muted flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border py-2"
                    key={option.value}
                  >
                    <RadioGroupItem value={String(option.value)} />
                    <span aria-hidden="true" className="text-xs">
                      {option.value}
                    </span>
                    <span className="sr-only">{option.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </li>
          );
        })}
      </ol>

      <div className="bg-background/95 sticky bottom-0 -mx-4 flex items-center justify-between gap-3 border-t px-4 py-3 backdrop-blur">
        <Button
          disabled={page === 0}
          onClick={goPrevious}
          type="button"
          variant="outline"
        >
          Back
        </Button>
        <p className="text-muted-foreground text-xs">
          {`${answered} of ${total} answered`}
        </p>
        <Button
          disabled={isLastPage ? !complete : !pageComplete}
          onClick={goNext}
          type="button"
        >
          {isLastPage ? "See my result" : "Next"}
        </Button>
      </div>
    </main>
  );
};

const RunnerRoute = () => {
  const { slug } = useParams();
  const instrument = slug ? findInstrument(slug) : undefined;

  if (!instrument) {
    return <NotFound />;
  }

  return <TestRunner instrument={instrument} />;
};

export default RunnerRoute;
