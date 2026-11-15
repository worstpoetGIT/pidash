const P = {
  moon: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z',
  auto: 'M12 3a9 9 0 1 0 0 18zM12 3v18',
  play: 'M7 4l13 8-13 8z',
  wrench: 'M14.7 6.3a4 4 0 0 0 5 5L12 19a2.1 2.1 0 0 1-3-3zM14.7 6.3l2.6-2.6',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 12h.01',
  branch: 'M6 3v12M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 9a9 9 0 0 1-9 9',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6zM9 12l2.2 2.2L15.5 10',
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  bolt: 'M13 2 4 14h7l-1 8 9-12h-7z',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  bank: 'M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18',
  cart: 'M3 4h2l2.5 11h10L20 7H6M9 20h.01M17 20h.01',
  fork: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10',
  coffee: 'M4 8h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5zM17 9h2a2 2 0 0 1 0 5h-2M8 2v3M12 2v3',
  bus: 'M5 4h14a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zM4 11h16M7 20v-3M17 20v-3M8 14h.01M16 14h.01',
  dots: 'M5 12h.01M12 12h.01M19 12h.01',
  film: 'M4 4h16v16H4zM8 4v16M16 4v16M4 9h4M4 15h4M16 9h4M16 15h4',
  chip: 'M7 7h10v10H7zM9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4',
  shirt: 'M8 3 3 6l2.5 4L8 9v12h8V9l2.5 1L21 6l-5-3a4 4 0 0 1-8 0z',
  tag: 'M3 12V4h8l10 10-8 8zM7.5 8h.01',
  city: 'M4 21V8l6-3v16M10 21V10l10 3v8M3 21h18M7 11h.01M7 15h.01M14 15h.01M17 16h.01',
  chart: 'M5 21V12M12 21V4M19 21v-6',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  plus: 'M12 5v14M5 12h14',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM21 21l-5-5',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  x: 'M6 6l12 12M18 6 6 18',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2',
  leaf: 'M5 19C5 9 12 4 20 4c0 9-5 16-15 15zM5 19l8-8',
  snow: 'M12 2v20M3.5 7l17 10M3.5 17l17-10',
  flower: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 9c-2-4 0-6 0-6s2 2 0 6M12 15c2 4 0 6 0 6s-2-2 0-6M9 12c-4-2-6 0-6 0s2 2 6 0M15 12c4 2 6 0 6 0s-2-2-6 0',
  check: 'M5 12l5 5 9-10',
  up: 'M12 19V5M6 11l6-6 6 6',
  down: 'M12 5v14M6 13l6 6 6-6',
  card: 'M3 6h18v12H3zM3 10h18M7 15h3',
  wallet: 'M4 7h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h12M16 13h.01',
  pie: 'M12 3v9h9a9 9 0 1 1-9-9zM15 3.5A9 9 0 0 1 20.5 9H15z',
  edit: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4.3a3.5 3.5 0 0 1 0 6.4M18 14a7 7 0 0 1 4 6',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19 12l2-1-1-3-2 .5a7 7 0 0 0-1.5-1.5L17 5l-3-1-1 2a7 7 0 0 0-2 0L10 4 7 5l.5 2A7 7 0 0 0 6 8.5L4 8l-1 3 2 1a7 7 0 0 0 0 2l-2 1 1 3 2-.5A7 7 0 0 0 7.5 19L7 21l3 1 1-2a7 7 0 0 0 2 0l1 2 3-1-.5-2a7 7 0 0 0 1.5-1.5l2 .5 1-3-2-1a7 7 0 0 0 0-2z',
}

export default function Icon({ name, size = 24, color = 'currentColor', fill = 'none', sw = 2, style }) {
  const d = P[name] || P.tag
  const thick = name === 'dots'
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={thick ? 3.4 : sw} strokeLinecap="round" strokeLinejoin="round" style={style} aria-hidden="true">
      <path d={d} />
    </svg>
  )
}
