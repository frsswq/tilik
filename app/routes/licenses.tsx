import { Link } from "react-router";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { instruments } from "~/lib/instruments/registry";

export const meta = () => [
  { title: "Licences - Tilik" },
  {
    content:
      "The licence, source, and citation of every instrument on this site.",
    name: "description",
  },
];

const Licenses = () => (
  <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 py-10">
    <header className="flex flex-col gap-3">
      <h1 className="font-heading text-3xl font-semibold tracking-tight">
        Licences and attribution
      </h1>
      <p className="text-muted-foreground max-w-prose text-pretty">
        Every instrument lists its licence, its source, and the paper that
        describes it. Only instruments that are public domain, Creative Commons,
        or free with attribution can be included.
      </p>
    </header>

    <section className="flex flex-col gap-4">
      {instruments.map((instrument) => (
        <article className="flex flex-col gap-3" key={instrument.slug}>
          <h2 className="font-heading text-xl font-semibold tracking-tight">
            {instrument.title}
          </h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Licence</TableCell>
                <TableCell>{instrument.license}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Licence notes</TableCell>
                <TableCell>{instrument.licenseNotes}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Citation</TableCell>
                <TableCell>{instrument.citation}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Source</TableCell>
                <TableCell>
                  <a
                    className="underline underline-offset-4"
                    href={instrument.sourceUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {instrument.sourceUrl}
                  </a>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <ul className="text-muted-foreground flex flex-col gap-1 text-sm">
            {instrument.references.map((reference) => (
              <li key={reference.id}>
                {reference.authors} ({reference.year}). {reference.title}.{" "}
                <em>{reference.source}</em>.
                {reference.doi ? (
                  <>
                    {" "}
                    <a
                      className="underline underline-offset-4"
                      href={`https://doi.org/${reference.doi}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      doi:{reference.doi}
                    </a>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>

    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-xl font-semibold tracking-tight">
        Reporting a problem
      </h2>
      <p className="text-muted-foreground max-w-prose">
        If an attribution is wrong or incomplete, open an issue at{" "}
        <a
          className="underline underline-offset-4"
          href="https://github.com/frsswq/tilik/issues"
          rel="noreferrer"
          target="_blank"
        >
          github.com/frsswq/tilik/issues
        </a>
        . The item text, the scoring key, and the site code are public.
      </p>
    </section>

    <p>
      <Link className="underline underline-offset-4" to="/">
        Back to the tests
      </Link>
    </p>
  </main>
);

export default Licenses;
