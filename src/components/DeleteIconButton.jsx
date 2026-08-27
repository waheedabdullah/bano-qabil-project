function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 7h16" strokeLinecap="round" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" strokeLinecap="round" />
      <path d="M7 7v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V7" strokeLinecap="round" />
      <path d="M10 11v6M14 11v6" strokeLinecap="round" />
    </svg>
  );
}

export default function DeleteIconButton({ onClick, label = "Delete", disabled }) {
  return (
    <button
      type="button"
      className="icon-btn danger"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <TrashIcon />
    </button>
  );
}
