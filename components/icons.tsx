import { type SVGProps } from 'react';

/**
 * One small, consistent icon set (Phase 7): stroke-only, currentColor, 24×24,
 * rounded joins. Replaces the placeholder unicode glyphs so the UI reads as one
 * system. No icon library — just inline SVG.
 */
function Base({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {children}
    </svg>
  );
}

/** Erlenmeyer flask — Pharmaceutical Supply. */
export function FlaskIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M9 3h6M10 3v6l-4.2 8.4A1.5 1.5 0 0 0 7.2 20h9.6a1.5 1.5 0 0 0 1.4-2.6L14 9V3" />
      <path d="M8 15h8" />
    </Base>
  );
}

/** Tanker/box truck — Logistics. */
export function TruckIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M3 6h11v9H3zM14 9h3.5L21 12.5V15h-7" />
      <circle cx="7" cy="18" r="1.6" />
      <circle cx="17" cy="18" r="1.6" />
    </Base>
  );
}

/** Tent — Camping Equipment. */
export function TentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <path d="M12 4 3 20h18zM12 4v16" />
    </Base>
  );
}

/** Padlock — locked/clearance-gated. */
export function LockIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <Base {...props}>
      <rect x="5" y="11" width="14" height="9" rx="1.6" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </Base>
  );
}
