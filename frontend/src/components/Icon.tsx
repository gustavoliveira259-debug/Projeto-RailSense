import type { ReactNode } from 'react'

const PATHS = {
  train: (
    <>
      <rect x="5" y="3" width="14" height="15" rx="3" />
      <path d="M8 18 6 21M16 18l2 3M7 8h10M8 13h.01M16 13h.01M9 21h6" />
    </>
  ),
  alert: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6" />
    </>
  ),
  structure: (
    <>
      <rect x="9" y="2.5" width="6" height="5" rx="1" />
      <rect x="2.5" y="16.5" width="6" height="5" rx="1" />
      <rect x="15.5" y="16.5" width="6" height="5" rx="1" />
      <path d="M12 7.5V12M5.5 16.5V12h13v4.5" />
    </>
  ),
  account: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5M21 12H9" />
    </>
  ),
  bearing: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
    </>
  ),
  wagon: (
    <>
      <rect x="3" y="5" width="18" height="11" rx="2" />
      <circle cx="7.5" cy="18.5" r="2" />
      <circle cx="16.5" cy="18.5" r="2" />
      <path d="M3 10h18" />
    </>
  ),
  camera: (
    <>
      <path d="M4 7h3l2-3h6l2 3h3a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="4" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  warning: (
    <>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4.5M12 17.5h.01" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="4" />,
  refresh: <path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7" />,
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof PATHS

export function Icon({ name, className = 'icon' }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} focusable="false">
      {PATHS[name]}
    </svg>
  )
}
