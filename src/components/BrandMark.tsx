type BrandMarkProps = {
  className?: string;
};

/**
 * Discovery compass: a warm forward needle crosses the open quadrant of a
 * three-quarter orbit. Its shorter cyan tail leaves a clear central window.
 * The 48-unit grid uses a 3.4-unit orbit, retaining a ~1.1px stroke at 16px.
 * Keep these paths in sync with public/favicon.svg.
 */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <svg
      className={className}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M24 5A19 19 0 1 0 43 24"
        stroke="#AAD4DA"
        strokeWidth="3.4"
        strokeLinecap="round"
      />
      <path d="M39 9 29 25 23 19Z" fill="#D9B987" />
      <path d="M15 33 19 23 25 29Z" fill="#AAD4DA" />
    </svg>
  );
}

export default BrandMark;
