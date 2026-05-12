'use client';

const WHATSAPP_NUMBER = '919929563668'; // replace with your WhatsApp number

const features = [
  'Telecalling Management',
  'Lead Pipeline',
  'Followup Tracking',
  'Meeting Management',
  'Solar Calculator',
  'Proposal Generator',
  'Dashboard Analytics',
  'Mobile APK Support',
];

export default function SolarCRMPresentation() {
  return (
    <main className="presentation-page">
      <div className="top-actions">
        <button onClick={() => window.print()}>Save as PDF</button>
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>
      </div>

      <section className="slide hero">
        <div className="badge">☀️ Safeer / Solar CRM</div>
        <h1>SOLAR CRM</h1>
        <h2>Smart Solar Business Operating System</h2>
        <p>
          Manage telecalling, leads, meetings, solar calculator, proposals,
          projects and team operations from one powerful platform.
        </p>

        <div className="pill-grid">
          {features.map((f) => (
            <span key={f}>{f}</span>
          ))}
        </div>
      </section>

      <section className="slide dark">
        <h2>Stop Losing Leads</h2>
        <p className="subtitle">
          Solar companies need more than a normal CRM. They need a complete
          workflow system.
        </p>

        <div className="card-grid">
          {[
            'Missed followups',
            'Manual quotations',
            'Unorganized team work',
            'No call tracking',
            'No site visit control',
            'Scattered customer data',
          ].map((item) => (
            <div className="glass-card" key={item}>
              ❌ {item}
            </div>
          ))}
        </div>
      </section>

      <section className="slide orange">
        <h2>Complete Solar Workflow</h2>

        <div className="flow">
          {[
            'Contact',
            'Telecalling',
            'Lead',
            'Followup',
            'Meeting',
            'Calculator',
            'Proposal',
            'Project',
          ].map((item) => (
            <div className="flow-item" key={item}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="slide dark">
        <h2>Premium Features</h2>

        <div className="feature-grid">
          {[
            ['☎️ Telecalling', 'Auto call, recordings, review queue'],
            ['📈 Leads', 'Lead assignment, potential, conversion'],
            ['🏠 Meetings', 'Site visits, GPS proof, manager tracking'],
            ['⚙️ Calculator', 'Panel, inverter, structure, profit, discount'],
            ['📄 Proposals', 'Professional PDF proposal generation'],
            ['📊 Analytics', 'Role-wise dashboard and performance'],
          ].map(([title, desc]) => (
            <div className="feature-card" key={title}>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="slide pricing">
        <h2>Software License</h2>
        <div className="price-box">
          <span>Total Product Cost</span>
          <strong>₹2,50,000</strong>
        </div>

        <div className="pricing-grid">
          <div className="price-card">
            <h3>Full Payment</h3>
            <p>10% Discount</p>
            <strong>₹2,25,000</strong>
          </div>

          <div className="price-card">
            <h3>EMI Plan</h3>
            <p>50% upfront + EMI</p>
            <strong>1.5%–2% ROI Monthly</strong>
          </div>
        </div>
      </section>

      <section className="slide dark">
        <h2>Special Offers</h2>

        <div className="card-grid">
          <div className="glass-card">🚀 First 5 clients get 10% discount</div>
          <div className="glass-card">🤝 Refer 2 clients and get benefits</div>
          <div className="glass-card">💵 Full upfront payment gets discount</div>
        </div>

        <p className="note">
          Maximum total discount benefit can be capped.
        </p>
      </section>

      <section className="slide orange">
        <h2>Ownership & Copyright</h2>
        <p>
          Source code, architecture, database structure, workflow logic,
          calculator system and proposal system remain owned by the developer.
        </p>
        <p>
          Client receives a non-transferable software usage license for internal
          business operations only.
        </p>
      </section>

      <section className="slide final">
        <h2>Solar CRM</h2>
        <p>Built specifically for solar businesses.</p>
        <h3>Automate • Organize • Scale</h3>
        <a
          className="whatsapp"
          href={`https://wa.me/${WHATSAPP_NUMBER}`}
          target="_blank"
          rel="noreferrer"
        >
          Contact on WhatsApp
        </a>
      </section>

      <style jsx global>{`
        .presentation-page {
          min-height: 100vh;
          background: #020617;
          color: white;
          font-family: Inter, Arial, sans-serif;
          overflow-x: hidden;
        }

        .top-actions {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 50;
          display: flex;
          gap: 10px;
        }

        .top-actions button,
        .top-actions a {
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(0, 0, 0, 0.55);
          color: white;
          padding: 10px 16px;
          border-radius: 999px;
          font-weight: 800;
          backdrop-filter: blur(14px);
          text-decoration: none;
        }

        .slide {
          min-height: 100vh;
          padding: 90px 7%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
        }

        .hero {
          text-align: center;
          background:
            radial-gradient(circle at top right, rgba(255,255,255,0.35), transparent 35%),
            radial-gradient(circle at bottom left, rgba(255,255,255,0.2), transparent 30%),
            linear-gradient(135deg, #f97316, #f59e0b, #fde047);
          color: #111827;
        }

        .dark {
          background:
            radial-gradient(circle at top right, rgba(249,115,22,0.18), transparent 35%),
            linear-gradient(135deg, #020617, #0f172a, #020617);
        }

        .orange {
          background: linear-gradient(135deg, #fb923c, #facc15);
          color: #111827;
          text-align: center;
        }

        .pricing {
          background:
            radial-gradient(circle at top, rgba(255,255,255,0.22), transparent 30%),
            linear-gradient(135deg, #ea580c, #f97316, #fde047);
          color: #111827;
          text-align: center;
        }

        .final {
          background:
            radial-gradient(circle at center, rgba(249,115,22,0.25), transparent 35%),
            linear-gradient(135deg, #020617, #000);
          text-align: center;
        }

        .badge {
          display: inline-block;
          margin: 0 auto 24px;
          padding: 12px 22px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.35);
          font-weight: 900;
          letter-spacing: 1px;
        }

        h1 {
          font-size: clamp(64px, 12vw, 150px);
          line-height: 0.9;
          font-weight: 1000;
          margin: 0;
        }

        h2 {
          font-size: clamp(42px, 7vw, 92px);
          line-height: 1;
          font-weight: 1000;
          margin: 0 0 24px;
        }

        h3 {
          font-size: 30px;
          font-weight: 1000;
        }

        p {
          font-size: 22px;
          line-height: 1.7;
          max-width: 950px;
          margin: 18px auto;
        }

        .subtitle {
          color: #cbd5e1;
        }

        .pill-grid {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 16px;
          margin-top: 42px;
        }

        .pill-grid span {
          background: rgba(255, 255, 255, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.35);
          border-radius: 22px;
          padding: 16px 22px;
          font-size: 18px;
          font-weight: 900;
          backdrop-filter: blur(12px);
        }

        .card-grid,
        .feature-grid,
        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 24px;
          margin-top: 50px;
        }

        .glass-card,
        .feature-card,
        .price-card {
          border-radius: 34px;
          padding: 34px;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(249, 115, 22, 0.35);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.35);
          font-size: 22px;
          font-weight: 900;
          backdrop-filter: blur(14px);
        }

        .feature-card h3 {
          color: #fb923c;
          margin: 0 0 16px;
        }

        .feature-card p {
          font-size: 18px;
          color: #cbd5e1;
          margin: 0;
        }

        .flow {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 18px;
          margin-top: 50px;
        }

        .flow-item {
          background: #020617;
          color: white;
          border-radius: 26px;
          padding: 20px 28px;
          font-size: 24px;
          font-weight: 1000;
          box-shadow: 0 25px 60px rgba(0,0,0,0.35);
        }

        .price-box {
          display: inline-flex;
          flex-direction: column;
          gap: 12px;
          background: #020617;
          color: white;
          border-radius: 42px;
          padding: 42px 70px;
          margin: 30px auto;
          box-shadow: 0 35px 90px rgba(0,0,0,0.35);
        }

        .price-box span {
          color: #fb923c;
          font-size: 24px;
          font-weight: 900;
        }

        .price-box strong {
          font-size: clamp(54px, 8vw, 100px);
          line-height: 1;
        }

        .price-card {
          background: #020617;
          color: white;
          text-align: left;
        }

        .price-card h3 {
          color: #fb923c;
        }

        .price-card strong {
          display: block;
          margin-top: 20px;
          color: #facc15;
          font-size: 38px;
        }

        .note {
          margin-top: 50px;
          color: #facc15;
          font-weight: 900;
        }

        .whatsapp {
          display: inline-block;
          margin-top: 30px;
          background: #22c55e;
          color: white;
          text-decoration: none;
          padding: 18px 34px;
          border-radius: 999px;
          font-size: 22px;
          font-weight: 1000;
        }

        @media print {
          .top-actions {
            display: none;
          }

          .slide {
            page-break-after: always;
            min-height: 100vh;
          }
        }

        @media (max-width: 768px) {
          .slide {
            padding: 80px 24px;
          }

          p {
            font-size: 18px;
          }

          .flow-item {
            font-size: 18px;
          }
        }
      `}</style>
    </main>
  );
}