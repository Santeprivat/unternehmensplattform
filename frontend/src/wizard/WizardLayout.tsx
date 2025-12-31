import type { ReactNode } from "react";

function WizardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app">
      <section className="hero">
        <div className="hero-overlay">
          <div className="container">
            <h1>Unternehmensgründung</h1>
            <p>Digitaler One-Stop-Shop</p>
          </div>
        </div>
      </section>

      <main className="content container">
        {children}
      </main>
    </div>
  );
}

export default WizardLayout;

