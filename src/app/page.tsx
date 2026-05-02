"use client";

import Link from "next/link";
import {
  BookOpen, FlaskConical, GraduationCap, TrendingUp,
  Users, ChevronRight, Star, CheckCircle2, ArrowRight,
  Microscope, Library, BarChart3, Globe2, Mail, Phone, MapPin
} from "lucide-react";
import { useEffect, useState } from "react";

// ── Simple animated counter ─────────────────────────────────────────────────
function Counter({ end, suffix = "" }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(end / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(start);
    }, 24);
    return () => clearInterval(timer);
  }, [end]);
  return <>{count}{suffix}</>;
}

const features = [
  {
    icon: Microscope,
    title: "Research Lectures",
    desc: "Access curated academic lectures designed by leading researchers and subject-matter experts.",
    color: "from-indigo-500 to-indigo-700",
    bg: "bg-indigo-50",
    text: "text-indigo-600",
  },
  {
    icon: Library,
    title: "Structured Courses",
    desc: "Follow organised learning paths that take you from foundational concepts to advanced research methodologies.",
    color: "from-violet-500 to-violet-700",
    bg: "bg-violet-50",
    text: "text-violet-600",
  },
  {
    icon: BarChart3,
    title: "Progress Tracking",
    desc: "Monitor your academic journey with real-time progress dashboards and lesson completion analytics.",
    color: "from-sky-500 to-sky-700",
    bg: "bg-sky-50",
    text: "text-sky-600",
  },
  {
    icon: GraduationCap,
    title: "Academic Support",
    desc: "Get guided mentorship, peer interaction, and institutional-grade academic resources at your fingertips.",
    color: "from-emerald-500 to-emerald-700",
    bg: "bg-emerald-50",
    text: "text-emerald-600",
  },
];

const steps = [
  { step: "01", title: "Create an Account", desc: "Register in seconds and set up your academic profile to get started." },
  { step: "02", title: "Browse & Enroll", desc: "Explore research courses across disciplines and request enrollment." },
  { step: "03", title: "Learn & Progress", desc: "Attend lectures, complete lessons, and track your academic growth." },
  { step: "04", title: "Achieve Your Goal", desc: "Complete courses and build a research portfolio that advances your career." },
];

const testimonials = [
  {
    name: "Dr. Amina Hassan",
    role: "Researcher, University of Hargiesa",
    quote: "Sahan Research transformed how I access academic materials. The structured lectures are world-class.",
    rating: 5,
  },
  {
    name: "Mohamed Ali",
    role: "MSc Student, Data Science",
    quote: "The progress tracking keeps me accountable. I have completed three research modules in one semester.",
    rating: 5,
  },
  {
    name: "Faadumo Warsame",
    role: "Academic Lecturer",
    quote: "Finally a platform built for Somali researchers. The content is rigorous, relevant, and beautifully organised.",
    rating: 5,
  },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    // Enable smooth scrolling for all anchor links
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.style.scrollBehavior = "";
    };
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.querySelector(href);
      if (el) {
        const offset = 72; // navbar height
        const top = el.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: "smooth" });
      }
      setMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur shadow-sm border-b border-slate-100" : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <FlaskConical size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Sahan <span className="text-indigo-600">Research</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              ["About", "#about"],
              ["Features", "#features"],
              ["How It Works", "#how"],
              ["Testimonials", "#testimonials"],
            ].map(([label, href]) => (
              <a
                key={label}
                href={href}
                onClick={(e) => handleNavClick(e, href)}
                className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors px-4 py-2 rounded-lg hover:bg-indigo-50"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-5 py-2.5 rounded-xl shadow-md hover:shadow-indigo-200 transition-all"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
            <div className="space-y-1.5">
              <span className={`block h-0.5 w-6 bg-slate-700 transition-transform ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block h-0.5 w-6 bg-slate-700 transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 w-6 bg-slate-700 transition-transform ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </div>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-6 py-4 space-y-3">
            {[["About", "#about"], ["Features", "#features"], ["How It Works", "#how"], ["Testimonials", "#testimonials"]].map(([l, h]) => (
              <a key={l} href={h} onClick={(e) => handleNavClick(e, h)} className="block text-sm font-medium text-slate-700 hover:text-indigo-600 py-1 cursor-pointer">{l}</a>
            ))}
            <div className="pt-3 flex flex-col gap-2">
              <Link href="/login" className="text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50">Sign In</Link>
              <Link href="/register" className="text-center text-sm font-semibold text-white bg-indigo-600 rounded-xl py-2.5 hover:bg-indigo-700">Get Started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 lg:pt-44 lg:pb-32">
        {/* Background blobs */}
        <div className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-indigo-100 rounded-full blur-[120px] opacity-50 pointer-events-none" />
        <div className="absolute -bottom-20 -left-40 w-[500px] h-[500px] bg-violet-100 rounded-full blur-[100px] opacity-40 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold px-4 py-1.5 rounded-full mb-8 uppercase tracking-wider">
              <FlaskConical size={12} />
              Academic Research Platform &amp; E-Learning
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight text-slate-900">
              Advance Your{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Research
              </span>
              {" "}and{" "}
              <span className="relative">
                Academic Growth
                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" fill="none">
                  <path d="M1 5.5 Q75 1 150 5.5 Q225 10 299 5.5" stroke="url(#u)" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <defs>
                    <linearGradient id="u" x1="0" y1="0" x2="1" y2="0">
                      <stop stopColor="#6366f1" /><stop offset="1" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </h1>

            <p className="mt-8 text-lg sm:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
              Sahan Research is a structured academic platform offering expert research lectures, 
              organised courses, and progress tracking tools — built for students, lecturers, and researchers.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all text-base"
              >
                Start Learning Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 text-slate-700 font-semibold px-8 py-4 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-base"
              >
                Sign In to Dashboard
                <ChevronRight size={18} />
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
              {["No credit card required", "Free to get started", "Approved by educators"].map(t => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-500" /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 rounded-3xl overflow-hidden shadow-sm border border-slate-100">
            {[
              { label: "Enrolled Students", end: 1240, suffix: "+" },
              { label: "Research Courses", end: 48, suffix: "" },
              { label: "Expert Lecturers", end: 30, suffix: "+" },
              { label: "Completion Rate", end: 94, suffix: "%" },
            ].map((s) => (
              <div key={s.label} className="bg-white px-6 py-8 text-center">
                <p className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  <Counter end={s.end} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-sm font-medium text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────────────────────── */}
      <section id="about" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Text */}
            <div>
              <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-4">Our Mission</p>
              <h2 className="text-4xl font-bold text-slate-900 leading-tight mb-6">
                Democratising Academic Research for Everyone
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-6">
                Sahan Research was founded to bridge the gap between research institutions and learners. 
                We believe that high-quality academic knowledge should be structured, accessible, and impactful 
                — regardless of where you are in the world.
              </p>
              <p className="text-slate-500 text-lg leading-relaxed mb-8">
                Our platform brings together expert lecturers and motivated students in a guided, 
                progress-tracked environment designed to foster genuine academic growth.
              </p>
              <div className="space-y-3">
                {[
                  "Peer-reviewed course materials",
                  "Institution-grade learning structure",
                  "Real-time progress insights",
                  "Dedicated academic support",
                ].map(p => (
                  <div key={p} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 size={12} className="text-indigo-600" />
                    </div>
                    <span className="text-slate-600 font-medium text-sm">{p}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Decorative card grid */}
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: BookOpen, label: "Structured Curriculum", val: "48 Courses", bg: "bg-indigo-600", txt: "text-white" },
                { icon: Users, label: "Active Researchers", val: "1,240+", bg: "bg-white", txt: "text-slate-900" },
                { icon: Globe2, label: "Countries Reached", val: "12 Nations", bg: "bg-white", txt: "text-slate-900" },
                { icon: TrendingUp, label: "Avg. Completion", val: "94%", bg: "bg-violet-600", txt: "text-white" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <div key={c.label} className={`${c.bg} rounded-2xl p-6 shadow-sm border border-slate-100`}>
                    <Icon size={28} className={`mb-3 ${c.bg.includes("indigo") || c.bg.includes("violet") ? "text-white/80" : "text-indigo-600"}`} />
                    <p className={`text-2xl font-extrabold ${c.txt}`}>{c.val}</p>
                    <p className={`text-xs font-medium mt-1 ${c.bg.includes("600") ? "text-white/70" : "text-slate-400"}`}>{c.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-4">Platform Features</p>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Everything You Need to Excel</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Designed specifically for research-oriented learning, our tools help you go deeper, learn faster, and achieve more.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group relative bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all p-7 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <div className={`${f.bg} w-12 h-12 rounded-xl flex items-center justify-center mb-5`}>
                    <Icon size={22} className={f.text} />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-4">Simple Process</p>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">How Sahan Research Works</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Getting started takes minutes. Learning lasts a lifetime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
            {/* Connector line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-indigo-200" />
            
            {steps.map((s, i) => (
              <div key={s.step} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 mb-5">
                  <span className="text-white text-xl font-extrabold">{s.step}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-2xl shadow-md transition-all"
            >
              Join Sahan Research Today <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-indigo-600 font-semibold text-sm uppercase tracking-wider mb-4">Testimonials</p>
            <h2 className="text-4xl font-bold text-slate-900 mb-4">What Our Community Says</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Hear from the researchers, students, and lecturers who rely on Sahan Research every day.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-lg transition-shadow">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-6 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-extrabold text-white mb-5">
            Ready to Begin Your Research Journey?
          </h2>
          <p className="text-indigo-200 text-lg mb-10 max-w-2xl mx-auto">
            Join thousands of students and researchers who are advancing their knowledge on Sahan Research — the premier academic platform built for growth.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold px-8 py-4 rounded-2xl shadow-xl transition-all text-base"
            >
              Create Free Account
            </Link>
            <Link
              href="/login"
              className="text-white border-2 border-white/30 hover:border-white/60 font-semibold px-8 py-4 rounded-2xl transition-all text-base"
            >
              Sign In Instead
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                  <FlaskConical size={18} className="text-white" />
                </div>
                <span className="text-white font-bold text-lg">Sahan <span className="text-indigo-400">Research</span></span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs">
                A structured academic platform for research lectures, courses, and progress tracking. Built for learners who mean business.
              </p>
              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center gap-2"><Mail size={14} className="text-indigo-400" /> contact@sahanresearch.so</div>
                <div className="flex items-center gap-2"><Phone size={14} className="text-indigo-400" /> +252 63 4379036</div>
                <div className="flex items-center gap-2"><MapPin size={14} className="text-indigo-400" /> Hargeisa, Somaliland</div>
              </div>
            </div>

            {/* Platform links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Platform</h4>
              <ul className="space-y-2 text-sm">
                {[["About", "#about"], ["Features", "#features"], ["How It Works", "#how"], ["Testimonials", "#testimonials"]].map(([l, h]) => (
                  <li key={l}><a href={h} onClick={(e) => handleNavClick(e, h)} className="hover:text-indigo-400 transition-colors cursor-pointer">{l}</a></li>
                ))}
              </ul>
            </div>

            {/* Account links */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Account</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/login" className="hover:text-indigo-400 transition-colors">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-indigo-400 transition-colors">Register</Link></li>
                <li><Link href="/dashboard" className="hover:text-indigo-400 transition-colors">Dashboard</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <p>© {new Date().getFullYear()} Sahan Research. All rights reserved.</p>
            <p className="text-slate-600">Built with excellence for academic growth.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
