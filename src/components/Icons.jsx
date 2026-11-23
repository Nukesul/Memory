const P = {
  home: <path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6" />,
  people: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5.2a3 3 0 010 5.6M18 14.4c1.9.7 3 2.6 3 5.6" />
    </>
  ),
  photo: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M3 17l5-4.5 4 3.5 3-2.5 6 5" />
    </>
  ),
  note: <path d="M5 4h14v11l-5 5H5zM14 20v-5h5" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z" />,
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3v11H4z" />
      <circle cx="12" cy="13.5" r="3.5" />
    </>
  ),
  edit: <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />,
  send: <path d="M4 12L20 4l-5 16-3.5-6.5zM11.5 13.5L20 4" />,
  chat: <path d="M4 5h16v11H9l-5 4zM8 9.5h8M8 12.5h5" />,
  game: (
    <>
      <rect x="2.5" y="7" width="19" height="11" rx="5" />
      <path d="M8 10v5M5.5 12.5h5M15.5 11h.01M18 14h.01" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  trash: <path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  left: <path d="M15 5l-7 7 7 7" />,
  right: <path d="M9 5l7 7-7 7" />,
  shuffle: <path d="M4 7h3.5c4 0 5 10 9 10H20M4 17h3.5c1.4 0 2.4-1.2 3.2-2.7M20 7h-3.5c-1.4 0-2.4 1.2-3.2 2.7M17.5 4.5L20 7l-2.5 2.5M17.5 14.5L20 17l-2.5 2.5" />,
};

export function Icon({ name, size = 22, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  );
}
