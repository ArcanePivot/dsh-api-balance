export function WalletIcon({ size = 16 }: { size?: number }): JSX.Element {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2.5 4.3h11a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1h-9a2 2 0 0 1-2-2V4.3Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" />
      <path d="M2.5 6h11" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
      <circle cx="11" cy="9.5" r="1.8" stroke="currentColor" strokeWidth="1.1" />
      <circle cx="11" cy="9.5" r="0.75" fill="currentColor" />
    </svg>
  )
}
