import { useState } from "react";

export default function PasswordField({
  value,
  onChange,
  placeholder,
  minLength,
  required = true,
  name = "clinic-password",
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minLength={minLength}
        required={required}
        autoComplete="new-password"
        name={name}
        readOnly
        onFocus={(e) => e.currentTarget.removeAttribute("readOnly")}
      />
      <button
        type="button"
        className="eye-btn"
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? "Hide password" : "Show password"}
        title={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6A2 2 0 0 0 13.4 13.4" />
            <path d="M9.9 5.2A10 10 0 0 1 12 5c5 0 9.3 3.1 11 7-.6 1.4-1.5 2.7-2.6 3.8" />
            <path d="M6.7 6.7C4.7 8 3.2 9.8 2 12c1.7 3.9 6 7 10 7 1.4 0 2.8-.3 4-.8" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
