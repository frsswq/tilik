import type { ReactNode } from "react";

import type { Avatar } from "~/lib/instruments/schema";
import { cn } from "~/lib/utils";

interface Point {
  x: number;
  y: number;
}

/**
 * Each head is a profile that looks to the right, like the two profiles in the
 * Tilik mark. The paths sit on the same 100 unit grid as the mark, and `eye` is
 * where the face features go.
 */
const HEADS: Record<Avatar["shape"], { eye: Point; head: ReactNode }> = {
  bun: {
    eye: { x: 66, y: 46 },
    head: (
      <>
        <circle cx="25" cy="23" r="11" />
        <path d="M52 20C70 20 82 32 83 46C88 49 91 53 91 56C91 59 88 60 83 60C83 76 74 88 56 90H42C26 88 16 76 16 56C16 34 30 20 52 20Z" />
      </>
    ),
  },
  crest: {
    eye: { x: 66, y: 42 },
    head: (
      <>
        <path d="M40 18C38 6 50 0 62 4C54 6 50 12 50 18Z" />
        <path d="M50 14C70 14 84 28 85 44C90 47 93 52 93 55C93 59 90 60 86 60C86 76 76 88 56 90H40C24 88 12 74 12 54C12 30 28 14 50 14Z" />
      </>
    ),
  },
  dome: {
    eye: { x: 66, y: 40 },
    head: (
      <path d="M50 12C70 12 84 26 85 42C90 45 93 50 93 53C93 57 90 58 86 58C86 74 76 88 56 90H40C24 88 12 74 12 52C12 28 28 12 50 12Z" />
    ),
  },
  tall: {
    eye: { x: 64, y: 36 },
    head: (
      <path d="M50 6C68 6 80 18 80 36V44C85 47 88 52 88 55C88 59 85 60 81 60C81 78 72 92 54 92H44C30 92 20 80 20 60V36C20 18 32 6 50 6Z" />
    ),
  },
  wide: {
    eye: { x: 68, y: 44 },
    head: (
      <path d="M48 22C72 22 88 32 89 46C93 49 96 53 96 56C96 59 93 60 89 60C88 76 76 86 54 86H36C16 86 4 76 4 56C4 36 22 22 48 22Z" />
    ),
  },
};

const Eye = ({ at, kind }: { at: Point; kind: Avatar["eye"] }) => {
  if (kind === "closed") {
    return (
      <path
        d={`M${at.x - 6} ${at.y}q6 5 12 0`}
        fill="none"
        stroke="var(--avatar-ink)"
        strokeLinecap="round"
        strokeWidth="3"
      />
    );
  }

  if (kind === "ring") {
    return (
      <>
        <circle cx={at.x} cy={at.y} fill="var(--avatar-face)" r="7" />
        <circle cx={at.x + 2.5} cy={at.y} fill="var(--avatar-ink)" r="3.5" />
      </>
    );
  }

  return <circle cx={at.x} cy={at.y} fill="var(--avatar-ink)" r="4.5" />;
};

const Mark = ({ at, kind }: { at: Point; kind: Avatar["mark"] }) => {
  switch (kind) {
    case "blush": {
      return (
        <ellipse
          cx={at.x - 4}
          cy={at.y + 17}
          fill="var(--avatar-face)"
          opacity="0.45"
          rx="7"
          ry="4.5"
        />
      );
    }
    case "brow": {
      return (
        <path
          d={`M${at.x - 7} ${at.y - 11}q7 -4 13 -1`}
          fill="none"
          stroke="var(--avatar-ink)"
          strokeLinecap="round"
          strokeWidth="3"
        />
      );
    }
    case "freckles": {
      return (
        <g fill="var(--avatar-ink)" opacity="0.55">
          <circle cx={at.x - 8} cy={at.y + 15} r="2.2" />
          <circle cx={at.x - 2} cy={at.y + 17} r="2.2" />
          <circle cx={at.x - 6} cy={at.y + 21} r="2.2" />
        </g>
      );
    }
    default: {
      return null;
    }
  }
};

/**
 * The character that stands for one instrument. Every instrument declares an
 * avatar in its data file, and `docs/DESIGN.md` holds the rules.
 *
 * The avatar is decorative, because the instrument title is always next to
 * it.
 */
export const InstrumentAvatar = ({
  avatar,
  className,
}: {
  avatar: Avatar;
  className?: string;
}) => {
  const { eye, head } = HEADS[avatar.shape];

  return (
    <svg
      aria-hidden="true"
      className={cn("instrument-avatar", className)}
      data-avatar={`${avatar.shape} ${avatar.colour}`}
      viewBox="0 0 100 100"
    >
      <g fill={`var(--avatar-${avatar.colour})`}>{head}</g>
      <Mark at={eye} kind={avatar.mark} />
      <Eye at={eye} kind={avatar.eye} />
    </svg>
  );
};
