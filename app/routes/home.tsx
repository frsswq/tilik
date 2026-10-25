import { useRef, useState, useSyncExternalStore } from "react";
import { Link, useNavigate } from "react-router";

import { LandingHero } from "~/components/landing-hero";
import { LandingTests } from "~/components/landing-tests";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import type { HistoryEntry } from "~/lib/history";
import {
  clearHistory,
  getHistoryServerSnapshot,
  getHistorySnapshot,
  subscribeToHistory,
} from "~/lib/history";
import { findInstrument } from "~/lib/instruments/registry";
import { parseResultFile } from "~/lib/result-file";
import { decodeShare } from "~/lib/share";

export const meta = () => [
  { title: "Tilik - free, open psychological tests" },
  {
    content:
      "Free, open psychological tests, scored in your browser. No account, and no answer leaves your device.",
    name: "description",
  },
];

const formatCompletedAt = (isoDate: string) => {
  const date = new Date(isoDate);

  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleString(undefined, {
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const History = ({
  entries,
  onClear,
}: {
  entries: HistoryEntry[];
  onClear: () => void;
}) => (
  <section className="flex flex-col gap-4">
    <div className="flex items-center justify-between gap-4">
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
        Your results
      </h2>
      <Button onClick={onClear} type="button" variant="ghost">
        Clear
      </Button>
    </div>
    <p className="text-muted-foreground max-w-prose text-sm">
      This history is saved in this browser. Completed scores are also saved in
      Cloudflare D1 for up to 90 days, without a login. Clearing this history
      does not delete stored scores.
    </p>
    <ul className="flex flex-col gap-2">
      {entries.map((entry) => (
        <li key={entry.code}>
          <Link
            className="hover:bg-muted flex flex-wrap items-baseline justify-between gap-2 rounded-lg border p-3"
            to={`/tests/${entry.slug}/result#r=${entry.code}`}
          >
            <span className="font-medium">{entry.title}</span>
            <span className="text-muted-foreground text-sm">
              {formatCompletedAt(entry.completedAt)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  </section>
);

const Home = () => {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  // The history lives in the browser. The store hands over an empty list
  // during hydration, so the first client render matches the pre-rendered
  // shell, and the stored entries arrive in the next render.
  const history = useSyncExternalStore(
    subscribeToHistory,
    getHistorySnapshot,
    getHistoryServerSnapshot
  );
  const [message, setMessage] = useState("");

  const importFile = async (file: File) => {
    const parsed = parseResultFile(await file.text());

    if (!parsed) {
      setMessage("That file is not a saved result.");
      return;
    }

    const instrument = findInstrument(parsed.slug);

    if (!instrument || !decodeShare(parsed.code, instrument)) {
      setMessage("That file belongs to a test this site does not have.");
      return;
    }

    navigate(`/tests/${parsed.slug}/result#r=${parsed.code}`);
  };

  return (
    <main>
      <LandingHero />
      <div className="home-content flex flex-col gap-12">
        <LandingTests />

        {history.length > 0 ? (
          <History
            entries={history}
            onClear={() => {
              clearHistory();
            }}
          />
        ) : null}

        <Separator />

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            Import a saved result
          </h2>
          <p className="text-muted-foreground max-w-prose text-sm">
            Open a result file that you downloaded earlier, on this device or
            another one.
          </p>
          <input
            accept="application/json,.json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];

              if (file) {
                void importFile(file);
              }
              event.target.value = "";
            }}
            ref={fileInput}
            type="file"
          />
          <Button
            className="self-start"
            onClick={() => fileInput.current?.click()}
            type="button"
            variant="outline"
          >
            Choose a result file
          </Button>
          <p aria-live="polite" className="text-muted-foreground text-sm">
            {message}
          </p>
        </section>
      </div>
    </main>
  );
};

export default Home;
