// Hand-made SVG art. Colours come from CSS variables so it works in both themes.

export function Petal({ className = '', style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2c3 3 6 6 5 10-1 4-5 8-5 10-0-2-4-6-5-10-1-4 2-7 5-10z" fill="var(--sakura)" stroke="var(--ink)" strokeWidth="1.4" strokeLinejoin="round" />
    </svg>
  );
}

const FlowerShape = () => (
  <>
    {[0, 72, 144, 216, 288].map((a) => (
      <path key={a} transform={`rotate(${a})`} d="M0 -4C-12 -12 -10 -26 0 -27C10 -26 12 -12 0 -4Z" fill="var(--sakura)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
    ))}
    <circle r="5" fill="var(--sun)" stroke="var(--ink)" strokeWidth="2" />
  </>
);

export function Flower({ size = 48, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="-30 -30 60 60" aria-hidden="true">
      <FlowerShape />
    </svg>
  );
}

export function Star({ size = 40, className = '', fill = 'var(--sun)' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M20 3l4.8 10.4 11.4 1.3-8.5 7.7 2.4 11.2L20 27.8 9.9 33.6l2.4-11.2-8.5-7.7 11.4-1.3z" fill={fill} stroke="var(--ink)" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

export function Sparkle({ size = 28, className = '', fill = 'var(--white)' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <path d="M15 1c1.5 8 5.5 12.5 14 14-8.5 1.5-12.5 6-14 14C13.5 21 9.5 16.5 1 15 9.5 13.5 13.5 9 15 1z" fill={fill} stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

export function Cloud({ className = '', style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 120 56" aria-hidden="true">
      <path d="M22 50a18 18 0 01-1-36 24 24 0 0145-6 20 20 0 0132 17 16 16 0 01-2 25z" fill="var(--white)" stroke="var(--ink)" strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  );
}

export function Heart({ size = 30, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 32 30" aria-hidden="true">
      <path d="M16 28C5 20 2 14 2 9a7 7 0 0114-2 7 7 0 0114 2c0 5-3 11-14 19z" fill="var(--coral)" stroke="var(--ink)" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

export function Plane({ size = 54, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 60 60" aria-hidden="true">
      <path d="M4 28L56 6 40 54 28 36z" fill="var(--white)" stroke="var(--ink)" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M28 36L56 6M28 36l-2 14 8-9" fill="none" stroke="var(--ink)" strokeWidth="2.4" strokeLinejoin="round" />
    </svg>
  );
}

export function Onigiri({ size = 56, className = '' }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 60 56" aria-hidden="true">
      <path d="M30 4c6 0 9 6 22 38 1 4-1 10-6 10H14c-5 0-7-6-6-10C21 10 24 4 30 4z" fill="var(--white)" stroke="var(--ink)" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M18 34h24l3 18H15z" fill="#23303a" stroke="var(--ink)" strokeWidth="2.4" strokeLinejoin="round" />
      <circle cx="25" cy="22" r="2" fill="var(--ink)" />
      <circle cx="35" cy="22" r="2" fill="var(--ink)" />
      <path d="M27 27q3 3 6 0" fill="none" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** The home page sky: sun and mountain on top, rolling hills in front. */
export function Scene() {
  return (
    <>
      <svg className="scene-sky" viewBox="0 0 560 330" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
        <circle cx="440" cy="90" r="50" fill="var(--sun)" stroke="var(--ink)" strokeWidth="3" />
        <circle cx="440" cy="90" r="72" fill="none" stroke="var(--sun)" strokeWidth="3" strokeDasharray="3 13" strokeLinecap="round" />
        <path d="M60 330L212 80h56l152 250z" fill="var(--fuji)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
        <path d="M212 80h56l20 34-22 16-18-14-18 18-18-16z" fill="var(--white)" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
      </svg>
      <svg className="scene-hills" viewBox="0 0 800 140" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 40C100 -6 220 -6 330 30s230 30 330-6 110-24 140-8V140H0z" fill="var(--hill1)" stroke="var(--ink)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <path d="M0 96C120 62 240 70 340 92s240 14 330-8 100-6 130 4V140H0z" fill="var(--hill2)" stroke="var(--ink)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
      </svg>
    </>
  );
}

/** A sakura branch for the corner of a panel. */
export function Branch({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 220 150" aria-hidden="true">
      <path d="M222 6C170 20 120 44 84 84S30 130 -4 140" fill="none" stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
      <path d="M150 34c-8 20-4 34 6 44M96 74c-6 18 0 30 12 40" fill="none" stroke="var(--ink)" strokeWidth="4" strokeLinecap="round" />
      {[[40, 112, 30], [96, 56, 36], [160, 24, 38], [150, 82, 30], [118, 122, 28], [196, 58, 26]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s / 56}) rotate(${i * 20})`}>
          <FlowerShape />
        </g>
      ))}
    </svg>
  );
}

/** Wavy divider between sections. */
export function Wave({ className = '' }) {
  return (
    <svg className={`wave ${className}`} viewBox="0 0 400 14" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 7q25-12 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0" fill="none" stroke="var(--ink)" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
