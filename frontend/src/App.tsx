import React, { useState } from "react";
import { BrowserRouter, Routes, Route, NavLink } from "react-router-dom";
import { TrendingUp, Zap, BookOpen, Target, ChevronLeft, ChevronRight } from "lucide-react";
import LiveOdds from "./pages/LiveOdds";
import Arbitrage from "./pages/Arbitrage";
import PaperBets from "./pages/PaperBets";
import ValueBets from "./pages/ValueBets";
import "./App.css";

const NAV_ITEMS = [
  { to: "/",            label: "Live Odds",   icon: TrendingUp, end: true },
  { to: "/arbitrage",   label: "Arbitrage",   icon: Zap },
  { to: "/value-bets",  label: "Value Bets",  icon: Target },
  { to: "/paper-bets",  label: "Paper Bets",  icon: BookOpen },
];

export default function App() {
  const [expanded, setExpanded] = useState(true);

  return (
    <BrowserRouter>
      <div className="app">
        <aside className={`sidebar ${expanded ? "expanded" : "collapsed"}`}>
          <div className="sidebar-header">
            {expanded && <span className="brand">better-platform</span>}
            <button className="toggle-btn" onClick={() => setExpanded((e) => !e)}>
              {expanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className="nav-item">
                <Icon size={18} className="nav-icon" />
                {expanded && <span className="nav-label">{label}</span>}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main className={`main ${expanded ? "main-expanded" : "main-collapsed"}`}>
          <Routes>
            <Route path="/"            element={<LiveOdds />} />
            <Route path="/arbitrage"   element={<Arbitrage />} />
            <Route path="/value-bets"  element={<ValueBets />} />
            <Route path="/paper-bets"  element={<PaperBets />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
