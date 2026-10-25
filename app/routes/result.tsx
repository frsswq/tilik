import { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import { InstrumentAvatar } from "~/components/instrument-avatar";
import { ResultActions } from "~/components/result-actions";
import { StoredResultActions } from "~/components/stored-result-actions";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Badge } from "~/components/ui/badge";
import { Button, buttonVariants } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Progress } from "~/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { findCategory } from "~/lib/categories";
import { addHistory } from "~/lib/history";
import { findInstrument } from "~/lib/instruments/registry";
import type { Instrument } from "~/lib/instruments/schema";
import { deleteStoredResult, readStoredId } from "~/lib/remote-result";
import {
  buildReport,
  bandOf,
  buildReportFromDomainScores,
  buildReportFromFacetScores,
  describeDomain,
  describePosition,
} from "~/lib/scoring/report";
import type { InstrumentReport } from "~/lib/scoring/report";
import { isComplete } from "~/lib/scoring/score";
import {
  answersFromShare,
  answersShare,
  decodeShare,
  domainScoresFromShare,
  encodeShare,
  facetScoresFromShare,
  readShareCode,
  shareFor,
} from "~/lib/share";
import { useStoredResult, useStoredUpload } from "~/lib/use-stored-result";
import { useTestSession } from "~/lib/use-test-session";

export const meta = () => [{ title: "Your result - Tilik" }];

interface SharedResult {
  code: string;
  report: InstrumentReport;
  source: "answers" | "scores";
}

const NotFound = () => (
  <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 p-4 py-16">
    <h1 className="font-heading text-2xl font-semibold">Test not found</h1>
    <Link className={buttonVariants()} to="/">
      See all tests
    </Link>
  </main>
);

const sharedReportFor = (
  code: string | null,
  instrument: Instrument
): SharedResult | null => {
  if (!code) {
    return null;
  }
  const payload = decodeShare(code, instrument);
  if (!payload) {
    return null;
  }
  if (payload.mode === "answers") {
    const answers = answersFromShare(payload, instrument);
    return answers
      ? { code, report: buildReport(instrument, answers), source: "answers" }
      : null;
  }
  const facets = facetScoresFromShare(payload, instrument);
  if (facets) {
    return {
      code,
      report: buildReportFromFacetScores(instrument, facets),
      source: "scores",
    };
  }
  const domains = domainScoresFromShare(payload, instrument);
  return domains
    ? {
        code,
        report: buildReportFromDomainScores(instrument, domains),
        source: "scores",
      }
    : null;
};

const storedMessages = {
  failed:
    "The stored copy could not be loaded. Check your connection and reload this page.",
  incompatible:
    "This result belongs to another test or an older scoring key. It cannot be interpreted with the current test.",
  loading: "Your stored scores are on their way.",
  missing:
    "This stored result has expired or was deleted. Stored copies are available for 90 days.",
};
const StoredNotice = ({
  kind,
  slug,
}: {
  kind: keyof typeof storedMessages;
  slug: string;
}) => (
  <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 p-4 py-16">
    <h1 className="font-heading text-2xl font-semibold">
      {kind === "loading"
        ? "Loading your stored result"
        : "Stored result unavailable"}
    </h1>
    <output className="text-muted-foreground">{storedMessages[kind]}</output>
    <Link
      className={buttonVariants({ variant: "outline" })}
      to={`/tests/${slug}/result`}
    >
      See your local result
    </Link>
    <Link className={buttonVariants({ variant: "ghost" })} to="/">
      See all tests
    </Link>
  </main>
);

const StoredActions = ({
  id,
  slug,
  stored,
  upload,
}: {
  id: string | null;
  slug: string;
  stored: ReturnType<typeof useStoredResult>;
  upload: ReturnType<typeof useStoredUpload>;
}) => {
  if (id && stored.kind === "ready") {
    return (
      <StoredResultActions
        onDelete={() => deleteStoredResult(id)}
        slug={slug}
        state={{ kind: "saved", reference: stored.reference }}
      />
    );
  }
  return (
    <StoredResultActions
      onDelete={() => upload.remove()}
      onRetry={() => upload.retry()}
      slug={slug}
      state={upload.state}
    />
  );
};

const Result = ({ instrument }: { instrument: Instrument }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const session = useTestSession(instrument);
  const code = readShareCode(location.hash);
  const category = findCategory(instrument.category);
  const storedId = readStoredId(location.hash);
  const stored = useStoredResult(instrument, storedId);

  const shared = useMemo(
    () => sharedReportFor(code, instrument),
    [code, instrument]
  );

  const localReport = useMemo(
    () =>
      isComplete(instrument, session.answers)
        ? buildReport(instrument, session.answers)
        : null,
    [instrument, session.answers]
  );

  const remoteReport = stored.kind === "ready" ? stored.report : null;
  const report = storedId ? remoteReport : (shared?.report ?? localReport);

  const codes = useMemo((): {
    answers: string | null;
    scores: string;
  } | null => {
    if (!report) {
      return null;
    }

    let answersCode: string | null = null;

    if (shared) {
      if (shared.source === "answers") {
        answersCode = shared.code;
      }
    } else if (!storedId) {
      answersCode = encodeShare(
        instrument,
        answersShare(instrument, session.answers)
      );
    }

    return {
      answers: answersCode,
      scores: encodeShare(
        instrument,
        shareFor(instrument, {
          ...report,
          facets: report.domains.flatMap((domain) => domain.facets),
        })
      ),
    };
  }, [report, shared, instrument, session.answers, storedId]);

  const upload = useStoredUpload(
    shared || storedId ? null : (codes?.answers ?? null),
    instrument,
    shared || storedId ? null : localReport
  );

  useEffect(() => {
    if (shared || !(codes?.answers && localReport)) {
      return;
    }

    addHistory({
      code: codes.answers,
      completedAt: new Date().toISOString(),
      slug: instrument.slug,
      title: instrument.title,
    });
  }, [shared, codes, localReport, instrument.slug, instrument.title]);

  if (storedId && stored.kind !== "ready") {
    return <StoredNotice kind={stored.kind} slug={instrument.slug} />;
  }
  if (!report) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-4 p-4 py-16">
        <h1 className="font-heading text-2xl font-semibold">
          This test is not finished
        </h1>
        <p className="text-muted-foreground">
          Answer every item before you see a result.
        </p>
        <Link
          className={buttonVariants()}
          to={`/tests/${instrument.slug}/start`}
        >
          Continue the test
        </Link>
      </main>
    );
  }

  const restart = () => {
    session.reset();
    navigate(`/tests/${instrument.slug}/start`);
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 py-10">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <InstrumentAvatar avatar={instrument.avatar} className="size-8" />
          <p className="text-muted-foreground text-sm">{instrument.title}</p>
        </div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Your result
        </h1>
        <p className="max-w-prose text-pretty">
          Each score is the sum of its items, where a reverse-keyed answer is
          mirrored. Each score is described against the scale itself.
        </p>
      </header>

      {storedId ? (
        <Alert>
          <AlertTitle>Stored result</AlertTitle>
          <AlertDescription>
            This copy holds the scores only. Your original answers are not
            stored on the server.
          </AlertDescription>
        </Alert>
      ) : null}

      {shared ? (
        <Alert>
          <AlertTitle>Shared result</AlertTitle>
          <AlertDescription>
            {shared.source === "answers"
              ? "This result arrived through a link that carries the answers."
              : "This result arrived through a link that carries the scores only."}
          </AlertDescription>
        </Alert>
      ) : null}

      <Alert>
        <AlertTitle>No population comparison</AlertTitle>
        <AlertDescription>{instrument.reporting.note}</AlertDescription>
      </Alert>

      {category?.notice ? (
        <Alert variant="destructive">
          <AlertTitle>If you need help now</AlertTitle>
          <AlertDescription>{category.notice}</AlertDescription>
        </Alert>
      ) : null}

      <section className="flex flex-col gap-4">
        {report.domains.map(({ domain, facets, position, score }) => {
          const band = bandOf(domain.bands, score.raw);

          return (
            <Card key={domain.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle>{domain.name}</CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    {band ? (
                      <Badge variant="outline">{band.label}</Badge>
                    ) : null}
                    <Badge variant="secondary">{`${score.raw} of ${score.max}`}</Badge>
                  </div>
                </div>
                <CardDescription>
                  {band?.description ?? describeDomain(domain, position)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress
                  aria-label={`${domain.name} score`}
                  max={score.max - score.min}
                  value={score.raw - score.min}
                />
                <p className="text-muted-foreground mt-2 text-xs">
                  {band
                    ? `Screening range ${score.min} to ${score.max}. A score in this range is not a diagnosis.`
                    : `${describePosition(position)}. Range ${score.min} to ${score.max}.`}
                </p>
              </CardContent>
              {facets.length > 0 ? (
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Facet</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Position</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facets.map(
                        ({
                          facet,
                          position: facetPosition,
                          score: facetScore,
                        }) => (
                          <TableRow key={facet.id}>
                            <TableCell>{facet.name}</TableCell>
                            <TableCell className="text-right">
                              {`${facetScore.raw} of ${facetScore.max}`}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="text-muted-foreground">
                                {describePosition(facetPosition)}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              ) : null}
            </Card>
          );
        })}
      </section>

      {codes ? (
        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Keep or share this result
          </h2>
          <p className="text-muted-foreground max-w-prose text-sm">
            The link carries the result in the part of the address after the
            hash symbol, which a browser never sends to a server.
          </p>
          <ResultActions
            answersCode={codes.answers}
            instrument={instrument}
            scoresCode={codes.scores}
          />
          <StoredActions
            id={storedId}
            slug={instrument.slug}
            stored={stored}
            upload={upload}
          />
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={restart} type="button" variant="outline">
          Take the test again
        </Button>
        <Link className={buttonVariants({ variant: "ghost" })} to="/">
          See all tests
        </Link>
      </div>
    </main>
  );
};

const ResultRoute = () => {
  const { slug } = useParams();
  const location = useLocation();
  const instrument = slug ? findInstrument(slug) : undefined;

  if (!instrument) {
    return <NotFound />;
  }

  return (
    <Result instrument={instrument} key={`${instrument.id}:${location.hash}`} />
  );
};

export default ResultRoute;
