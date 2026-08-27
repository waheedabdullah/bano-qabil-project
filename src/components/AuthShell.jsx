export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="auth-page">
      <div className="auth-stage" aria-hidden="true">
        <div className="auth-stage-photo" />
        <div className="auth-stage-shade" />
      </div>

      <aside className="auth-brand">
        <div className="auth-logo auth-fade-up">
          <span className="brand-mark">+</span>
          <div>
            <strong>Al Shifa Clinic</strong>
            <small>Clinic Management & Appointment System</small>
          </div>
        </div>
        <div className="auth-brand-copy auth-fade-up auth-fade-delay">
          <p className="auth-kicker">Welcome</p>
          <h2>Al Shifa Clinic</h2>
          <p className="auth-lead">
            Trusted doctors. Easy appointments. Care in one secure place.
          </p>
        </div>
      </aside>

      <section className="auth-card">
        <div className="auth-form-box auth-fade-up auth-fade-delay-2">
          <p className="eyebrow">Al Shifa Clinic</p>
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
          {footer}
        </div>
      </section>
    </main>
  );
}
