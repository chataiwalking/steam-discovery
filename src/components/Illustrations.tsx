import type { LessonId } from "../types";
export function Star({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m40 5 10 22 24 3-18 17 5 25-21-13-22 13 5-25L5 30l25-3z"
        fill="#F7CC62"
        stroke="#e9b446"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="40" r="2.6" fill="#405746" />
      <circle cx="48" cy="40" r="2.6" fill="#405746" />
      <path
        d="M35 49q5 5 10 0"
        stroke="#405746"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
export function Illustration({ id }: { id: LessonId }) {
  return (
    <svg
      viewBox="0 0 260 150"
      aria-hidden="true"
      className="lesson-illustration"
    >
      <defs>
        <linearGradient id={`glow-${id}`} x2="1" y2="1">
          <stop stopColor="#fff" stopOpacity=".6" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="133" cy="129" rx="70" ry="9" fill="#304b42" opacity=".09" />
      {id === "day-night" ? (
        <>
          <circle cx="143" cy="70" r="48" fill="#75b9bd" />
          <path
            d="m111 40 25-13 12 20-12 12 19 17-7 24-16-5-9-24-21-9zM166 41l20 17 4 25-20 7-10-18z"
            fill="#c2da94"
          />
          <path
            d="M143 22a48 48 0 0 1 0 96c28-36 28-58 0-96"
            fill="#2d617d"
            opacity=".5"
          />
          <circle cx="72" cy="39" r="20" fill="#f6c955" />
          <path
            d="m72 8 0-7m0 76v-7M40 39h-7m77 0h-7M49 16l-5-5m0 56 5-5"
            stroke="#efbf55"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {id === "water-cycle" ? (
        <>
          <ellipse cx="132" cy="115" rx="68" ry="18" fill="#83c6df" />
          <path
            d="M154 91c22-26-24-63-24-63s-46 37-24 63q24 27 48 0"
            fill="#58b5d5"
          />
          <path
            d="M115 69q-8 16 1 20"
            stroke="#d5f3f8"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <g fill="#fffdf3">
            <circle cx="186" cy="44" r="16" />
            <circle cx="165" cy="50" r="16" />
            <circle cx="177" cy="32" r="19" />
          </g>
          <path
            d="m64 67 10-14m-4 36 10-14m103 14 7-12"
            stroke="#98ccdf"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      ) : null}
      {id === "gears" ? (
        <>
          <g transform="translate(109 75)" fill="#ebbe62">
            {Array.from({ length: 10 }, (_, i) => (
              <rect
                key={i}
                x="-8"
                y="-48"
                width="16"
                height="24"
                rx="4"
                transform={`rotate(${i * 36})`}
              />
            ))}
            <circle r="37" />
            <circle r="14" fill="#fcf1d2" />
          </g>
          <g transform="translate(177 98)" fill="#d88164">
            {Array.from({ length: 8 }, (_, i) => (
              <rect
                key={i}
                x="-6"
                y="-31"
                width="12"
                height="14"
                rx="3"
                transform={`rotate(${i * 45})`}
              />
            ))}
            <circle r="25" />
            <circle r="9" fill="#fcf1d2" />
          </g>
          <circle cx="196" cy="35" r="7" fill="#f3d690" />
        </>
      ) : null}
      {id === "bridge" ? (
        <>
          <path d="M57 114q75 30 152 0v19H57z" fill="#9fcfd3" />
          <path
            d="M65 85h132"
            stroke="#deaa76"
            strokeWidth="17"
            strokeLinecap="round"
          />
          <path
            d="M75 118V88m49 30V88m62 30V88"
            stroke="#bd865a"
            strokeWidth="12"
          />
          <path
            d="m74 86 25-36 25 36 31-36 30 36M99 50h56"
            fill="none"
            stroke="#e9b882"
            strokeWidth="8"
            strokeLinejoin="round"
          />
          <rect x="143" y="67" width="28" height="13" rx="5" fill="#81a56c" />
          <circle cx="149" cy="82" r="5" fill="#53645a" />
          <circle cx="167" cy="82" r="5" fill="#53645a" />
        </>
      ) : null}
      {id === "light" ? (
        <>
          <path d="M61 113 117 28l22 83z" fill="#f1a097" opacity=".7" />
          <path d="m113 114 21-93 40 93z" fill="#b1cc85" opacity=".75" />
          <path d="m145 114 24-86 43 86z" fill="#8cbad6" opacity=".8" />
          <ellipse cx="133" cy="114" rx="67" ry="8" fill="#fcf2d0" />
          <g fill="#faf7e9" stroke="#af9bb2" strokeWidth="3">
            <rect x="73" y="109" width="28" height="19" rx="7" />
            <rect x="122" y="109" width="28" height="19" rx="7" />
            <rect x="171" y="109" width="28" height="19" rx="7" />
          </g>
          <path d="m212 34 3 8 8 3-8 3-3 8-3-8-8-3 8-3z" fill="#bba1c6" />
        </>
      ) : null}
      {id === "shapes" ? (
        <>
          <path d="m76 65 34-18 34 18v42l-34 19-34-19z" fill="#e9b876" />
          <path d="m76 65 34 18 34-18-34-18z" fill="#f5d497" />
          <path d="M110 83v43l34-19V65z" fill="#d59967" />
          <circle cx="172" cy="95" r="29" fill="#9ec4b1" />
          <ellipse cx="161" cy="82" rx="9" ry="7" fill="#cae0ca" />
          <path d="M149 38h42v28q-21 16-42 0z" fill="#b3a2ca" />
          <ellipse cx="170" cy="38" rx="21" ry="10" fill="#d6cae3" />
        </>
      ) : null}
    </svg>
  );
}
