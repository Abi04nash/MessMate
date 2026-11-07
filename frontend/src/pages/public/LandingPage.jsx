import { Link } from "react-router-dom";
import {
  Utensils, QrCode, Receipt, MessageSquare, BarChart3, ShieldCheck, Package,
  ArrowRight, Check, Lock, Zap, Star, GraduationCap, Building2, UserCog
} from "lucide-react";

const features = [
  { icon: Utensils, title: "Dynamic menus", desc: "Real-time updates with dietary labels, allergens, and special meal flags across all four daily meals." },
  { icon: QrCode, title: "QR check-in", desc: "Signed, short-lived meal passes with duplicate prevention and manual fallback for staff." },
  { icon: Receipt, title: "Transparent billing", desc: "Itemized bills with immutable snapshots, payment history, and downloadable invoices." },
  { icon: MessageSquare, title: "Complaint tracking", desc: "Categorized grievances with priorities, image attachments, and full resolution timelines." },
  { icon: Package, title: "Inventory and wastage", desc: "Stock ledger with low-stock alerts, supplier tracking, and sustainability analytics." },
  { icon: BarChart3, title: "Institutional analytics", desc: "Warden dashboards covering attendance, feedback, financial performance, and food waste." }
];

const steps = [
  { n: "01", title: "Admin publishes menu", desc: "Mess administrator creates today's menu with items for each meal and publishes it." },
  { n: "02", title: "Students register", desc: "Students browse the menu and lock in their seat before the cutoff time." },
  { n: "03", title: "QR check-in at counter", desc: "Show your signed pass. One scan, one meal. Duplicates rejected automatically." }
];

const roles = [
  { icon: GraduationCap, name: "Students", points: ["View menus and register", "QR meal passes", "Bills and payments", "Complaints and leave"] },
  { icon: ShieldCheck, name: "Mess Admins", points: ["Menu management", "Billing and payments", "Complaint resolution", "Inventory control"] },
  { icon: Building2, name: "Wardens", points: ["Institutional oversight", "Policy configuration", "Financial reports", "Audit history"] },
  { icon: UserCog, name: "Kitchen Staff", points: ["Daily meal schedule", "QR verification", "Consumption tracking", "Wastage recording"] }
];

const testimonials = [
  { name: "Aarav Mehta", role: "3rd year, CSE", text: "I used to forget if I'd registered for lunch. Now my QR is on my phone and the whole thing takes 5 seconds." },
  { name: "Sneha Patel", role: "2nd year, ECE", text: "The bill is actually itemized - I can see exactly how many dinners I've had. Way better than the old mess portal." },
  { name: "Rohan Reddy", role: "4th year, IT", text: "Complaints get resolved in hours now. The mess team actually responds because the workflow is visible." }
];

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-nav">
        <Link to="/" className="landing-brand">
          <img src="/favicon.svg" alt="" width="32" height="32" />
          <span>MESSMATE</span>
        </Link>
        <nav className="landing-nav-links">
          <a href="#features">Features</a>
          <a href="#how">How it works</a>
          <a href="#roles">Roles</a>
        </nav>
        <div className="landing-nav-cta">
          <Link to="/login" className="landing-btn landing-btn-ghost">Sign in</Link>
          <Link to="/register" className="landing-btn landing-btn-solid">Get started <ArrowRight size={16} /></Link>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-inner">
          <div className="landing-hero-copy">
            <span className="landing-eyebrow">
              <span className="landing-eyebrow-dot" /> IIIT BHUBANESWAR - LIVE
            </span>
            <h1>
              Smarter meals.<br />
              <span className="hero-accent">Better campus living.</span>
            </h1>
            <p className="landing-hero-sub">
              One platform connecting students, mess administrators, wardens, and kitchen staff.
              Register meals, get QR passes, pay bills, raise complaints - all in real time.
            </p>
            <div className="landing-hero-actions">
              <Link to="/login" className="landing-btn landing-btn-solid landing-btn-lg">
                Open portal <ArrowRight size={18} />
              </Link>
              <Link to="/register" className="landing-btn landing-btn-ghost landing-btn-lg">
                Create account
              </Link>
            </div>
            <div className="landing-trust">
              <span><Lock size={14} /> Role-based access</span>
              <span><Zap size={14} /> Real-time updates</span>
              <span><Check size={14} /> Duplicate-proof</span>
            </div>
          </div>

          <div className="landing-hero-visual">
            <div className="hero-float hero-float-1">
              <div className="hero-mini-head"><span className="hero-pulse" /> Today lunch</div>
              <h4>Lunch, 12:00 to 14:00</h4>
              <ul className="hero-mini-list">
                <li>Rice</li><li>Dal</li><li>Paneer Butter Masala</li>
              </ul>
              <span className="pill pill-green">Registered</span>
            </div>
            <div className="hero-float hero-float-2">
              <QrCode size={32} color="#10a37f" />
              <div>
                <strong>QR check-in</strong>
                <p>Verified, 2s ago</p>
              </div>
            </div>
            <div className="hero-float hero-float-3">
              <div className="hero-mini-head">Current bill</div>
              <strong className="hero-amount">Rs. 2,340</strong>
              <span className="pill pill-amber">Due Nov 15</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-stats">
        <div><strong>4</strong><span>User roles</span></div>
        <div><strong>26</strong><span>Data models</span></div>
        <div><strong>4</strong><span>Daily meals</span></div>
        <div><strong>100%</strong><span>Server-side auth</span></div>
      </section>

      <section id="features" className="landing-section">
        <div className="landing-section-head">
          <span className="landing-eyebrow">Capabilities</span>
          <h2>Everything the mess needs.<br />Nothing it doesn't.</h2>
          <p>Every button triggers a real API call backed by MongoDB. No mock data, no fake state.</p>
        </div>
        <div className="landing-features">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="landing-feature">
              <div className="landing-feature-icon"><Icon size={22} /></div>
              <h3>{title}</h3>
              <p>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how" className="landing-section landing-section-dark">
        <div className="landing-section-head landing-section-head-light">
          <span className="landing-eyebrow landing-eyebrow-light">How it works</span>
          <h2>Three steps. Zero paperwork.</h2>
        </div>
        <div className="landing-steps">
          {steps.map((s) => (
            <div key={s.n} className="landing-step">
              <span className="landing-step-num">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="roles" className="landing-section">
        <div className="landing-section-head">
          <span className="landing-eyebrow">Built for everyone</span>
          <h2>Four roles. One source of truth.</h2>
          <p>Each role sees exactly what it needs - and nothing more.</p>
        </div>
        <div className="landing-roles">
          {roles.map(({ icon: Icon, name, points }) => (
            <div key={name} className="landing-role">
              <Icon size={22} className="landing-role-icon" />
              <h3>{name}</h3>
              <ul>{points.map((p) => <li key={p}><Check size={14} /> {p}</li>)}</ul>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-testimonials">
        <div className="landing-section-head">
          <span className="landing-eyebrow">Student voices</span>
          <h2>What IIITians are saying</h2>
        </div>
        <div className="landing-quotes">
          {testimonials.map((t) => (
            <div key={t.name} className="landing-quote">
              <div className="landing-stars">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="currentColor" />)}</div>
              <p>"{t.text}"</p>
              <div className="landing-quote-author">
                <div className="landing-quote-avatar">{t.name[0]}</div>
                <div><strong>{t.name}</strong><span>{t.role}</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta-inner">
          <h2>Ready to skip the line?</h2>
          <p>Join hundreds of IIITians already using MESSMATE.</p>
          <div className="landing-hero-actions" style={{ justifyContent: "center" }}>
            <Link to="/register" className="landing-btn landing-btn-solid landing-btn-lg">Create free account <ArrowRight size={18} /></Link>
            <Link to="/login" className="landing-btn landing-btn-ghost-light landing-btn-lg">Sign in</Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <img src="/favicon.svg" alt="" width="28" height="28" />
            <span>MESSMATE</span>
            <p>Smarter Meals. Better Campus Living.</p>
          </div>
          <div className="landing-footer-cols">
            <div><strong>Product</strong><a href="#features">Features</a><a href="#how">How it works</a><a href="#roles">Roles</a></div>
            <div><strong>Access</strong><Link to="/login">Sign in</Link><Link to="/register">Register</Link></div>
            <div><strong>Institution</strong><span>IIIT Bhubaneswar</span><span>Odisha, India</span></div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <span>Copyright 2026 MESSMATE - IIIT Bhubaneswar</span>
          <span>Built by Abinash Mishra (B423002)</span>
        </div>
      </footer>
    </div>
  );
  
}