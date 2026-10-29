// Original vector artwork, drawn for this project. No external imagery.
export function Scenery({ small = false }: { small?: boolean }) {
  return (
    <svg
      className={`scenery ${small ? 'scenery-small' : ''}`}
      viewBox="0 0 620 660"
      role="img"
      aria-label="Tranh minh họa làng ven sông, những mái ngói và cánh đồng dưới nắng chiều"
    >
      <defs>
        <clipPath id="scene-clip">
          <rect width="620" height="660" rx="3" />
        </clipPath>
        <pattern id="scene-grain" width="7" height="7" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r=".55" fill="#493b2d" opacity=".09" />
          <circle cx="5" cy="4" r=".4" fill="#fff" opacity=".25" />
        </pattern>
      </defs>
      <g clipPath="url(#scene-clip)">
        <path fill="#e7d9bc" d="M0 0h620v660H0z" />
        <circle cx="438" cy="158" r="71" fill="#c56b47" />
        <path d="M-40 270Q40 155 120 225T290 213T450 236T660 165V430H-40" fill="#a7ad8b" />
        <path d="M-40 321Q63 214 160 280T320 263T480 292T660 242V480H-40" fill="#7e9278" />
        <path d="M-20 367Q92 305 200 339T410 325T660 337V660H-20" fill="#576f5b" />
        <path d="M-20 413Q113 348 270 401T640 380V660H-20" fill="#c8b56c" />
        <path
          d="M620 371C438 371 427 409 311 436S131 468 124 510s151 65 103 150h175c38-100-158-125-119-162s119-30 183-70 107-23 154-25"
          fill="#b9c5b2"
        />
        <path
          d="M-20 459Q53 426 204 436M-20 503Q48 469 143 471M-20 550Q45 519 112 523M-20 602Q70 557 151 564M354 485Q444 432 643 441M387 519Q477 466 650 485M424 571Q494 517 652 530M432 625Q544 568 650 587"
          fill="none"
          stroke="#8b9259"
          strokeWidth="3"
        />
        <path
          d="M355 423l18-3m-29 9 7-2M250 461l17-4M196 492l13-3M203 521l20 4M328 577l20 7"
          stroke="#e4e5ce"
          strokeWidth="2"
        />
        <g transform="translate(69 309)">
          <path d="M8 24h100v62H8" fill="#dbcbaa" />
          <path d="M-6 26L48-9l74 37z" fill="#98533e" />
          <path d="M48-9v36h74" fill="#ab6344" />
          <path
            d="M48-9L5 26M58-4L24 26M71 2L44 27M85 9L66 27M101 17L88 27"
            stroke="#784536"
            strokeWidth="1"
          />
          <path d="M24 44h24v42H24M72 42h21v23H72" fill="#566353" />
          <path d="M80 42v23M72 54h21" stroke="#bdb598" strokeWidth="2" />
          <path d="M3 87h109" stroke="#e7d3a2" strokeWidth="5" />
        </g>
        <g transform="translate(367 311) scale(.69)">
          <path d="M8 24h100v62H8" fill="#c8bea1" />
          <path d="M-6 26L48-9l74 37z" fill="#91513e" />
          <path d="M48-9v36h74" fill="#aa6748" />
          <path d="M23 45h23v41H23M71 43h20v23H71" fill="#445d4c" />
        </g>
        <g fill="#3f5c49">
          <path d="M13 317q-41-49-8-79 23-21 40 2 32-14 40 16 13 33-20 48z" />
          <path d="M184 338q-30-46-1-65 28-11 33 18 21 2 16 23z" />
          <path d="M500 357q-30-40-5-67 17-13 30 10 24-4 22 23z" />
        </g>
        <g stroke="#5c573e" strokeWidth="4">
          <path d="M36 270v83m163-43v51m317-40v49" />
        </g>
        <g transform="translate(530 339)">
          <path d="M5 23V-91" stroke="#4b614b" strokeWidth="5" />
          <path
            d="M6-77Q-26-113-55-95Q-25-91 6-77M6-77Q29-117 62-104Q30-95 6-77M6-77Q-20-127-43-120Q-13-105 6-77M6-77Q36-106 61-78Q32-86 6-77M6-77Q-3-118 15-136Q11-106 6-77"
            fill="#4b614b"
          />
        </g>
        <path
          d="M273 185q8-8 16 0m4-12q8-8 16 0M127 147q8-8 16 0m4 8q8-8 16 0"
          fill="none"
          stroke="#606b56"
          strokeWidth="2"
        />
        <g transform="translate(196 480) rotate(-12)">
          <path d="M-22 1Q0 17 25 0L16 10H-14z" fill="#665b40" />
          <path d="M0-3v-11" stroke="#665b40" strokeWidth="3" />
          <path d="M-7-15L0-20l8 5z" fill="#e8d6a5" />
          <path d="M-17-6l38 19" stroke="#665b40" strokeWidth="1.6" />
        </g>
        <path d="M0 648q46-44 86-16t72 12M461 660q40-49 88-25t87-6" fill="#60734e" />
        <rect width="620" height="660" fill="url(#scene-grain)" />
        <path
          d="M22 27h27M22 27v27m547-27h27v27M22 606v27h27m547-27v27h-27"
          fill="none"
          stroke="#f4ebd5"
          opacity=".7"
        />
      </g>
    </svg>
  );
}
