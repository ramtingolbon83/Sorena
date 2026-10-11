type IconName = "spark" | "plus" | "chat" | "tools" | "memory" | "settings" | "menu" | "close" | "send" | "stop" | "copy" | "search" | "calculator" | "clock" | "chevron" | "retry" | "trash" | "edit" | "check" | "alert" | "arrow"

const paths: Record<IconName, React.ReactNode> = {
  spark: (
    <path d="M12 2.75c.58 4.48 2.77 6.67 7.25 7.25-4.48.58-6.67 2.77-7.25 7.25C11.42 12.77 9.23 10.58 4.75 10 9.23 9.42 11.42 7.23 12 2.75Z" />
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chat: (
    <path d="M20 14a4 4 0 0 1-4 4H9l-5 3v-7a4 4 0 0 1-1-2.65V7a4 4 0 0 1 4-4h9a4 4 0 0 1 4 4v7Z" />
  ),
  tools: (
    <path d="m14.7 6.3 3-3a4.24 4.24 0 0 1-5.55 5.55l-7.9 7.9a2.12 2.12 0 0 0 3 3l7.9-7.9A4.24 4.24 0 0 1 20.7 6.3l-3 3-3-3Z" />
  ),
  memory: (
    <>
      <path d="M9 4.5A2.5 2.5 0 0 0 6.5 7v.3A2.8 2.8 0 0 0 5 12.3v.2A3.5 3.5 0 0 0 8.5 16H9v1.5a2.5 2.5 0 0 0 5 0V7a2.5 2.5 0 0 0-5 0v10.5" />
      <path d="M9 8H7.5M9 13H7.5M14 9h2.5A2.5 2.5 0 0 1 19 11.5v1A3.5 3.5 0 0 1 15.5 16H14" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.2.36.53.7 1 .9.36.14.72.2 1.1.2H21v4h-.1a1.7 1.7 0 0 0-1.5.9Z" />
    </>
  ),
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  send: <path d="m5 12 14-7-4.5 14-2.8-5.2L5 12Zm6.7 1.8L19 5" />,
  stop: <rect x="7" y="7" width="10" height="10" rx="1.5" />,
  copy: (
    <>
      <rect x="8" y="8" width="11" height="11" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  calculator: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h4" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  retry: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M18.5 16a8 8 0 1 1 .9-7.8L20 12" />
    </>
  ),
  trash: (
    <>
      <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
    </>
  ),
  edit: (
    <>
      <path d="m14 5 5 5L9 20H4v-5L14 5Z" />
      <path d="m12 7 5 5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  alert: (
    <>
      <path d="M12 3 2.8 20h18.4L12 3Z" />
      <path d="M12 9v5M12 17.2v.1" />
    </>
  ),
  arrow: <path d="M5 12h14M14 7l5 5-5 5" />,
}

export default function Icon({
  name,
  size = 20,
}: {
  name: IconName
  size?: number
}) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.6"
    >
      {paths[name]}
    </svg>
  )
}
