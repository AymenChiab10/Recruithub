import { useEffect, useState } from "react";
import {
  Activity,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Command,
  LayoutDashboard,
  Moon,
  Sun,
  Trophy,
  Users,
  Workflow,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Suspense, type ReactNode } from "react";
import { useGatewayHealth } from "../api/queries";
import { Skeleton } from "./Feedback";

const navigation = [
  { to: "/", label: "Vue d’ensemble", icon: LayoutDashboard },
  { to: "/candidates", label: "Candidats", icon: Users },
  { to: "/offers", label: "Offres", icon: BriefcaseBusiness },
  { to: "/applications", label: "Candidatures", icon: Workflow },
  { to: "/ranking", label: "Classement", icon: Trophy },
  { to: "/system", label: "Système", icon: Activity },
];

const routeTitles: Record<string, string> = {
  "/": "Vue d’ensemble",
  "/candidates": "Candidats",
  "/offers": "Offres",
  "/applications": "Candidatures",
  "/ranking": "Classement",
  "/system": "État du système",
};

function BrandMark() {
  return (
    <span aria-hidden="true" className="brand-mark">
      <span />
      <span />
      <span />
    </span>
  );
}

function NavigationLink({
  to,
  label,
  icon: Icon,
  compact,
}: {
  to: string;
  label: string;
  icon: typeof Users;
  compact?: boolean;
}) {
  return (
    <NavLink
      aria-label={compact ? label : undefined}
      className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
      end={to === "/"}
      title={compact ? label : undefined}
      to={to}
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
      {!compact && <span>{label}</span>}
      {!compact && to === "/" && <span className="nav-indicator" />}
    </NavLink>
  );
}

function Sidebar({
  compact,
  onToggle,
}: {
  compact: boolean;
  onToggle: () => void;
}) {
  return (
    <aside className={`sidebar ${compact ? "sidebar-compact" : ""}`}>
      <NavLink aria-label="RecruitHub — accueil" className="brand" to="/">
        <BrandMark />
        {!compact && (
          <span>
            <strong>Recruit<span>Hub</span></strong>
            <small>TALENT OPERATIONS</small>
          </span>
        )}
      </NavLink>
      <div className="sidebar-rule" />
      <p className="sidebar-label">{compact ? "•" : "ESPACE DE TRAVAIL"}</p>
      <nav aria-label="Navigation principale" className="sidebar-nav">
        {navigation.map((item) => (
          <NavigationLink key={item.to} {...item} compact={compact} />
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="protocol-legend">
          {!compact && <p className="sidebar-label">PROTOCOLES</p>}
          <span><i className="legend-dot rest-dot" />{!compact && "REST API"}</span>
          <span><i className="legend-dot soap-dot" />{!compact && "SOAP · Diplôme"}</span>
          <span><i className="legend-dot grpc-dot" />{!compact && "gRPC · Score"}</span>
        </div>
        <button
          aria-label={compact ? "Développer la navigation" : "Réduire la navigation"}
          className="sidebar-toggle"
          onClick={onToggle}
          type="button"
        >
          {compact ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          {!compact && <span>Réduire le menu</span>}
        </button>
      </div>
    </aside>
  );
}

function MobileNavigation() {
  return (
    <nav aria-label="Navigation mobile" className="mobile-nav">
      {navigation.slice(0, 5).map((item) => (
        <NavigationLink key={item.to} {...item} compact />
      ))}
    </nav>
  );
}

function ThemeSwitch() {
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    const saved = window.localStorage.getItem("recruithub-theme");
    return saved === "light" ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("light-theme", theme === "light");
    window.localStorage.setItem("recruithub-theme", theme);
  }, [theme]);

  return (
    <button
      aria-label={theme === "dark" ? "Activer le thème clair" : "Activer le thème sombre"}
      className="icon-button theme-switch"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      type="button"
    >
      {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
    </button>
  );
}

function ViewSelector() {
  const [view, setView] = useState("recruteur");
  return (
    <label className="view-selector">
      <span className="sr-only">Vue actuelle</span>
      <select aria-label="Choisir la vue" onChange={(event) => setView(event.target.value)} value={view}>
        <option value="recruteur">Recruteur</option>
        <option value="candidat">Candidat</option>
      </select>
    </label>
  );
}

export function PageMotion({ children }: { children: ReactNode }) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0 }}
      className="page-motion"
      initial={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}

export function AppLayout() {
  const [compact, setCompact] = useState(false);
  const location = useLocation();
  const health = useGatewayHealth();
  const title = routeTitles[location.pathname] ?? "RecruitHub";

  return (
    <div className={`app-shell ${compact ? "app-shell-compact" : ""}`}>
      <Sidebar compact={compact} onToggle={() => setCompact((current) => !current)} />
      <div className="main-column">
        <a className="skip-link" href="#main-content">Aller au contenu</a>
        <header className="topbar">
          <div className="topbar-context">
            <span className="context-icon"><Command size={15} /></span>
            <span>WORKSPACE</span>
            <span className="context-divider">/</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <span className={`api-indicator ${health.data?.status === "UP" ? "api-up" : health.isError ? "api-down" : ""}`}>
              <i /> {health.data?.status === "UP" ? "API CONNECTÉE" : health.isError ? "API HORS LIGNE" : "API EN COURS"}
            </span>
            <ViewSelector />
            <ThemeSwitch />
          </div>
        </header>
        <main className="main-content" id="main-content">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 8 }}
              key={location.pathname}
              transition={{ duration: 0.2 }}
            >
              <Suspense fallback={<Skeleton rows={4} />}>
                <Outlet />
              </Suspense>
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <MobileNavigation />
    </div>
  );
}
