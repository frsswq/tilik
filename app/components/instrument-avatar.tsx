import type { ReactNode } from "react";

import type { Avatar } from "~/lib/instruments/schema";
import { cn } from "~/lib/utils";

type Shape = Avatar["shape"];

interface Point {
  x: number;
  y: number;
}

/**
 * Where the face, the hat, and the bow tie sit on each body. The values are on
 * the same 100 unit grid as the body paths.
 */
interface Anchors {
  chin: Point;
  face: Point;
  top: Point;
}

const BODIES: Record<Shape, { anchors: Anchors; body: ReactNode }> = {
  cloud: {
    anchors: {
      chin: { x: 50, y: 84 },
      face: { x: 56, y: 52 },
      top: { x: 40, y: 26 },
    },
    body: (
      <>
        <circle cx="38" cy="44" r="20" />
        <circle cx="64" cy="42" r="20" />
        <circle cx="26" cy="64" r="16" />
        <circle cx="50" cy="66" r="20" />
        <circle cx="74" cy="64" r="16" />
      </>
    ),
  },
  drop: {
    anchors: {
      chin: { x: 50, y: 88 },
      face: { x: 56, y: 60 },
      top: { x: 50, y: 18 },
    },
    body: (
      <path d="M46 12C48 9 52 9 54 12L77 42C82 49 84 56 84 64C84 80 69 92 50 92C31 92 16 80 16 64C16 56 18 49 23 42Z" />
    ),
  },
  heart: {
    anchors: {
      chin: { x: 50, y: 80 },
      face: { x: 50, y: 44 },
      top: { x: 34, y: 14 },
    },
    body: (
      <path d="M50 90C50 90 8 64 8 36C8 21 19 10 33 10C41 10 47 14 50 20C53 14 59 10 67 10C81 10 92 21 92 36C92 64 50 90 50 90Z" />
    ),
  },
  hexagon: {
    anchors: {
      chin: { x: 50, y: 82 },
      face: { x: 56, y: 44 },
      top: { x: 44, y: 18 },
    },
    body: (
      <path d="M44 11C48 9 52 9 56 11L81 26C85 28 87 32 87 36V64C87 68 85 72 81 74L56 89C52 91 48 91 44 89L19 74C15 72 13 68 13 64V36C13 32 15 28 19 26Z" />
    ),
  },
  pebble: {
    anchors: {
      chin: { x: 52, y: 86 },
      face: { x: 58, y: 40 },
      top: { x: 44, y: 16 },
    },
    body: (
      <path d="M52 14C74 14 90 30 90 52C90 74 76 88 56 88C32 88 10 76 10 54C10 30 30 14 52 14Z" />
    ),
  },
  pill: {
    anchors: {
      chin: { x: 50, y: 76 },
      face: { x: 60, y: 46 },
      top: { x: 40, y: 26 },
    },
    body: <rect height="52" rx="26" width="86" x="7" y="26" />,
  },
  round: {
    anchors: {
      chin: { x: 50, y: 88 },
      face: { x: 58, y: 38 },
      top: { x: 44, y: 14 },
    },
    body: <circle cx="50" cy="52" r="40" />,
  },
  square: {
    anchors: {
      chin: { x: 50, y: 86 },
      face: { x: 58, y: 38 },
      top: { x: 44, y: 14 },
    },
    body: <rect height="76" rx="22" width="76" x="12" y="12" />,
  },
  triangle: {
    anchors: {
      chin: { x: 50, y: 86 },
      face: { x: 54, y: 58 },
      top: { x: 50, y: 20 },
    },
    body: (
      <path d="M50 10C54 10 57 13 60 18L89 70C94 79 90 86 79 86H21C10 86 6 79 11 70L40 18C43 13 46 10 50 10Z" />
    ),
  },
};

const Eyes = ({ at, kind }: { at: Point; kind: Avatar["eyes"] }) => {
  if (kind === "dot") {
    return (
      <g fill="var(--avatar-ink)">
        <ellipse cx={at.x - 8} cy={at.y} rx="3.5" ry="4.5" />
        <ellipse cx={at.x + 8} cy={at.y} rx="3.5" ry="4.5" />
      </g>
    );
  }

  if (kind === "sleepy") {
    return (
      <path
        d={`M${at.x - 13} ${at.y}q5 4 10 0M${at.x + 3} ${at.y}q5 4 10 0`}
        fill="none"
        stroke="var(--avatar-ink)"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
    );
  }

  return (
    <g stroke="var(--avatar-ink)" strokeLinecap="round">
      <path d={`M${at.x - 10} ${at.y - 7}l5 12`} strokeWidth="8" />
      <path d={`M${at.x + 5} ${at.y - 8}l5 11`} strokeWidth="6.5" />
    </g>
  );
};

const Accessory = ({
  anchors,
  kind,
}: {
  anchors: Anchors;
  kind: Avatar["accessory"];
}) => {
  const { chin, face, top } = anchors;

  switch (kind) {
    case "beret": {
      return (
        <g fill="var(--avatar-ink)">
          <ellipse
            cx={top.x}
            cy={top.y}
            rx="26"
            ry="11"
            transform={`rotate(-12 ${top.x} ${top.y})`}
          />
          <circle cx={top.x - 4} cy={top.y - 11} r="3" />
        </g>
      );
    }
    case "bow-tie": {
      return (
        <path
          d={`M${chin.x} ${chin.y}l-14 -7q-3 7 0 14zM${chin.x} ${chin.y}l14 -7q3 7 0 14z`}
          fill="var(--avatar-ink)"
          stroke="var(--avatar-ink)"
          strokeLinejoin="round"
          strokeWidth="3"
        />
      );
    }
    case "round-glasses": {
      return (
        <g fill="none" stroke="var(--avatar-ink)" strokeWidth="2.5">
          <circle cx={face.x - 10} cy={face.y} r="10" />
          <circle cx={face.x + 10} cy={face.y} r="10" />
        </g>
      );
    }
    case "sunglasses": {
      return (
        <g stroke="var(--avatar-ink)">
          <circle
            cx={face.x - 10}
            cy={face.y}
            fill="var(--avatar-ink)"
            r="8.5"
          />
          <circle
            cx={face.x + 10}
            cy={face.y}
            fill="var(--avatar-ink)"
            r="8.5"
          />
          <path
            d={`M${face.x - 2} ${face.y - 1}q2 -3 4 0`}
            fill="none"
            strokeWidth="2"
          />
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
 * avatar in its data file, and the shapes and the eyes follow the reference
 * set in `docs/DESIGN.md`.
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
  const { anchors, body } = BODIES[avatar.shape];
  const hidesEyes = avatar.accessory === "sunglasses";

  return (
    <svg
      aria-hidden="true"
      className={cn("instrument-avatar", className)}
      data-avatar={`${avatar.shape} ${avatar.colour}`}
      viewBox="0 0 100 100"
    >
      <g fill={`var(--avatar-${avatar.colour})`}>{body}</g>
      {hidesEyes ? null : <Eyes at={anchors.face} kind={avatar.eyes} />}
      <Accessory anchors={anchors} kind={avatar.accessory} />
    </svg>
  );
};
