"use client";

import Link from "next/link";
import {
  BookOpen, FlaskConical, GraduationCap, TrendingUp,
  Users, ChevronRight, Star, CheckCircle2, ArrowRight,
  Microscope, Library, BarChart3, Globe2, Mail, Phone, MapPin,
  Clock, DollarSign, Zap, UserPlus, Search, LineChart
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { Course } from "@/redux/slice/courseSlice";
import CourseCard from "@/components/CourseCard";
import Loader from "@/components/Loader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { motion, AnimatePresence } from "framer-motion";
import MovingBackground from "@/components/MovingBackground";

// ── Animation Variants ──────────────────────────────────────────────────────
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-100px" },
  transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }
};

const fadeInScale = {
  initial: { opacity: 0, scale: 0.9 },
  whileInView: { opacity: 1, scale: 1 },
  viewport: { once: true },
  transition: { duration: 0.6, ease: "easeOut" }
};

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  viewport: { once: true }
};

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
  const [activeSection, setActiveSection] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  
  // Access auth state from 
  const { currentUser } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await axios.get("/api/courses");
        setCourses(res.data.courses);
      } catch (error) {
        console.error("Failed to fetch courses:", error);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    
    // Intersection Observer for active section highlighting
    const sections = ["about", "courses", "features", "how", "testimonials"];
    const observers: IntersectionObserver[] = [];

    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -70% 0px", // Trigger when section is in the upper part of the viewport
      threshold: 0
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    // Enable smooth scrolling for all anchor links
    document.documentElement.style.scrollBehavior = "smooth";
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
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
    <div className="min-h-screen font-sans transition-colors duration-500 relative">
      <MovingBackground />

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 flex flex-col transition-all duration-500 ${
          scrolled 
            ? "bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl shadow-lg border-b border-slate-200/50 dark:border-slate-800/50 py-3" 
            : "bg-white/50 dark:bg-slate-950/20 backdrop-blur-sm py-5"
        }`}
      >
        
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between w-full">
            {/* Left: Logo */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center shrink-0"
            >
              <Link href="/" className="flex items-center gap-2 sm:gap-3 group">
                <img 
                  src="/logo.jpeg" 
                  alt="Sahan Research Logo" 
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-cover shadow-lg shadow-indigo-100 dark:shadow-indigo-950/50 group-hover:scale-105 transition-all duration-500" 
                />
                <span className="text-lg sm:text-2xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                  Sahan <span className="text-indigo-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-300">Research</span>
                </span>
              </Link>
            </motion.div>

            {/* Middle: Nav */}
            <nav className="md:flex items-center justify-center flex-1 mx-4 gap-4 lg:gap-8">
              {[
                ["About", "#about", "about"],
                ["Courses", "#courses", "courses"],
                ["Features", "#features", "features"],
                ["How It Works", "#how", "how"],
                ["Testimonials", "#testimonials", "testimonials"],
              ].map(([label, href, id], index) => (
                <motion.a
                  key={label}
                  href={href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  onClick={(e) => handleNavClick(e, href)}
                  className={`text-[10px] lg:text-[12px] font-black tracking-[0.1em] lg:tracking-[0.2em] transition-all duration-300 relative py-1 uppercase group whitespace-nowrap ${
                    activeSection === id 
                      ? "text-indigo-600 dark:text-indigo-400" 
                      : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                  }`}
                >
                  {label}
                  <span className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-500 ${activeSection === id ? "w-full" : "w-0 group-hover:w-full"}`} />
                </motion.a>
              ))}
            </nav>

            {/* Right: Auth Buttons & Mobile Toggle */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2 sm:gap-4 shrink-0"
            >
              <div className="md:flex items-center gap-1 lg:gap-3">
                <span className="hidden md:inline-flex items-center gap-1 text-slate-500 dark:text-slate-400">
                  <ThemeToggle />
                </span>
               
                <Link
                  href="/login"
                  className="text-[11px] lg:text-[13px] font-black tracking-widest text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all px-4 lg:px-6 py-2.5 lg:py-3 rounded-2xl hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 uppercase"
                >
                  Login
                </Link>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href="/register"
                    className="text-[11px] lg:text-[13px] font-black tracking-widest text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 px-5 lg:px-8 py-2.5 lg:py-3.5 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-indigo-950/50 hover:shadow-indigo-200 dark:hover:shadow-indigo-900/50 transition-all duration-500 uppercase whitespace-nowrap inline-block"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </div>

              {/* Mobile hamburger toggle - Hidden on md and up */}
              <div className="md:hidden flex items-center gap-2">
                <ThemeToggle />
                <button 
                  className="p-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all" 
                  onClick={() => setMenuOpen(!menuOpen)} 
                  aria-label="Toggle menu"
                >
                  <div className="space-y-1.5">
                    <span className={`block h-0.5 w-6 bg-current transition-transform duration-300 ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
                    <span className={`block h-0.5 w-6 bg-current transition-opacity duration-300 ${menuOpen ? "opacity-0" : ""}`} />
                    <span className={`block h-0.5 w-6 bg-current transition-transform duration-300 ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
                  </div>
                </button>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="md:hidden bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 px-6 py-8 space-y-6 shadow-2xl overflow-hidden"
            >
              {[
                ["About", "#about", "about"],
                ["Courses", "#courses", "courses"],
                ["Features", "#features", "features"],
                ["How It Works", "#how", "how"],
                ["Testimonials", "#testimonials", "testimonials"]
              ].map(([label, href, id]) => (
                <a 
                  key={label} 
                  href={href} 
                  onClick={(e) => handleNavClick(e, href)} 
                  className={`block text-lg font-black tracking-tighter transition-all ${
                    activeSection === id ? "text-indigo-600 dark:text-indigo-400 translate-x-2" : "text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400"
                  }`}
                >
                  {label}
                </a>
              ))}
              <div className="pt-6 flex flex-col gap-4 border-t border-slate-100 dark:border-slate-800">
                <Link href="/login" className="text-center text-sm font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-2xl py-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all uppercase tracking-widest">Login</Link>
                <Link href="/register" className="text-center text-sm font-bold text-white bg-indigo-600 dark:bg-indigo-500 rounded-2xl py-4 hover:bg-indigo-700 dark:hover:bg-indigo-600 shadow-lg shadow-indigo-100 dark:shadow-indigo-950/50 transition-all uppercase tracking-widest">Sign Up</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 lg:pt-44 lg:pb-32 transition-colors duration-500">
        {/* Background blobs */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-indigo-100 dark:bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            duration: 10, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-20 -left-40 w-[500px] h-[500px] bg-violet-100 dark:bg-violet-900/10 rounded-full blur-[100px] pointer-events-none" 
        />
        


        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial="initial"
            animate="whileInView"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >

            {/* Badge */}
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black px-4 py-2 rounded-full mb-8 uppercase tracking-[0.15em] shadow-sm"
            >
              <img src="/logo.jpeg" alt="Icon" className="w-4 h-4 rounded-md object-cover" />
              Academic Research Platform &amp; E-Learning
            </motion.div>

            <motion.h1 
              variants={fadeInUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight text-slate-900 dark:text-white"
            >
              Sahan Research{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                And
              </span>
              {" "}
              <span className="relative inline-block">
                Studies Center
                <svg className="absolute -bottom-2 left-0 w-full" height="8" viewBox="0 0 300 8" fill="none">
                  <motion.path 
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    d="M1 5.5 Q75 1 150 5.5 Q225 10 299 5.5" stroke="url(#u)" strokeWidth="3" strokeLinecap="round" fill="none" 
                  />
                  <defs>
                    <linearGradient id="u" x1="0" y1="0" x2="1" y2="0">
                      <stop stopColor="#6366f1" /><stop offset="1" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
            </motion.h1>

            <motion.p 
              variants={fadeInUp}
              className="mt-8 text-lg sm:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium"
            >
              Sahan Research is a structured academic platform offering expert research lectures, 
              organised courses, and progress tracking tools — built for students, lecturers, and researchers.
            </motion.p>

            <motion.div 
              variants={fadeInUp}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5"
            >
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/register"
                  className="group flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black px-8 py-4 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-indigo-950/50 hover:shadow-indigo-200 dark:hover:shadow-indigo-900/50 transition-all text-sm uppercase tracking-widest"
                >
                  Start Learning Free
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-black px-8 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all text-sm uppercase tracking-widest shadow-sm"
                >
                  Sign In to Dashboard
                  <ChevronRight size={18} />
                </Link>
              </motion.div>
            </motion.div>

            {/* Trust badges */}
            <motion.div 
              variants={fadeInUp}
              className="mt-12 flex flex-wrap items-center justify-center gap-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"
            >
              {["No credit card required", "Free to get started", "Approved by educators"].map(t => (
                <span key={t} className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-500" /> {t}
                </span>
              ))}
            </motion.div>
          </motion.div>

          {/* Stats row */}
          <motion.div 
            variants={fadeInUp}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 dark:bg-slate-800 rounded-3xl overflow-hidden shadow-2xl shadow-indigo-100/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800"
          >
            {[
              { label: "Enrolled Students", end: 1240, suffix: "+" },
              { label: "Research Courses", end: 48, suffix: "" },
              { label: "Expert Lecturers", end: 30, suffix: "+" },
              { label: "Completion Rate", end: 94, suffix: "%" },
            ].map((s) => (
              <div key={s.label} className="bg-white dark:bg-slate-900 px-6 py-10 text-center transition-colors">
                <p className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent mb-2">
                  <Counter end={s.end} suffix={s.suffix} />
                </p>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────────────────────── */}
      <section id="about" className="py-32 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 transition-colors duration-500 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Text */}
            <motion.div
              initial="initial"
              whileInView="whileInView"
              variants={staggerContainer}
              viewport={{ once: true }}
            >
              <motion.div 
                variants={fadeInUp}
                className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black px-4 py-2 rounded-full mb-8 uppercase tracking-widest shadow-sm"
              >
                <Users size={12} />
                About Sahan Research
              </motion.div>
              <motion.h2 
                variants={fadeInUp}
                className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tight"
              >
                Democratising Academic Research for Everyone
              </motion.h2>
              <motion.p 
                variants={fadeInUp}
                className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-6 font-medium"
              >
                Sahan Research was founded to bridge the gap between research institutions and learners. 
                We believe that high-quality academic knowledge should be structured, accessible, and impactful 
                — regardless of where you are in the world.
              </motion.p>
              <motion.p 
                variants={fadeInUp}
                className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-10 font-medium"
              >
                Our platform brings together expert lecturers and motivated students in a guided, 
                progress-tracked environment designed to foster genuine academic growth.
              </motion.p>
              <motion.div 
                variants={staggerContainer}
                className="space-y-4"
              >
                {[
                  "Peer-reviewed course materials",
                  "Institution-grade learning structure",
                  "Real-time progress insights",
                  "Dedicated academic support",
                ].map(p => (
                  <motion.div 
                    key={p} 
                    variants={fadeInUp}
                    className="flex items-center gap-4 group"
                  >
                    <div className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                      <CheckCircle2 size={14} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="text-slate-600 dark:text-slate-300 font-bold text-sm uppercase tracking-wide">{p}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
            {/* Decorative card grid */}
            <motion.div 
              initial="initial"
              whileInView="whileInView"
              variants={staggerContainer}
              viewport={{ once: true }}
              className="grid grid-cols-2 gap-6"
            >
              {[
                { icon: BookOpen, label: "Structured Curriculum", val: "48 Courses", bg: "bg-indigo-600", txt: "text-white" },
                { icon: Users, label: "Active Researchers", val: "1,240+", bg: "bg-white dark:bg-slate-900", txt: "text-slate-900 dark:text-white" },
                { icon: Globe2, label: "Countries Reached", val: "12 Nations", bg: "bg-white dark:bg-slate-900", txt: "text-slate-900 dark:text-white" },
                { icon: TrendingUp, label: "Avg. Completion", val: "94%", bg: "bg-violet-600", txt: "text-white" },
              ].map((c) => {
                const Icon = c.icon;
                return (
                  <motion.div 
                    key={c.label} 
                    variants={fadeInScale}
                    whileHover={{ y: -5, scale: 1.02 }}
                    className={`${c.bg} rounded-[2rem] p-8 shadow-xl shadow-indigo-100/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 transition-all`}
                  >
                    <Icon size={32} className={`mb-4 ${c.bg.includes("indigo") || c.bg.includes("violet") ? "text-white/80" : "text-indigo-600 dark:text-indigo-400"}`} />
                    <p className={`text-2xl font-black ${c.txt} tracking-tight`}>{c.val}</p>
                    <p className={`text-[10px] font-black mt-1 uppercase tracking-widest ${c.bg.includes("600") ? "text-white/70" : "text-slate-400 dark:text-slate-500"}`}>{c.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── COURSES SECTION ────────────────────────────────────────────────── */}
      <section id="courses" className="py-32 bg-white dark:bg-slate-950 border-t border-slate-50 dark:border-slate-800 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial="initial"
            whileInView="whileInView"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black px-4 py-2 rounded-full mb-6 uppercase tracking-widest shadow-sm"
            >
              <BookOpen size={12} />
              Academic Programs
            </motion.div>
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight"
            >
              Explore Our Research Courses
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium"
            >
              Choose from a wide range of structured academic courses designed to elevate your research skills.
            </motion.p>
          </motion.div>

          {coursesLoading ? (
            <div className="py-20 flex justify-center">
              <Loader />
            </div>
          ) : (
            <motion.div 
              initial="initial"
              whileInView="whileInView"
              variants={staggerContainer}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
            >
              {courses.map((course) => (
                <motion.div 
                  key={course.id} 
                  variants={fadeInUp}
                  whileHover={{ y: -10 }}
                  className="group transition-all duration-500"
                >
                  <CourseCard 
                    course={course} 
                    actionLabel={currentUser ? "Enroll Now" : "View Details & Enroll"}
                    onAction={() => window.location.href = currentUser ? '/dashboard/courses' : '/login'}
                  />
                </motion.div>
              ))}
              {courses.length === 0 && (
                <motion.div 
                  variants={fadeInUp}
                  className="col-span-full py-32 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 transition-colors"
                >
                  <BookOpen className="mx-auto text-slate-300 dark:text-slate-700 mb-6" size={64} />
                  <p className="text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs">No courses are currently available.</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" className="py-32 bg-white dark:bg-slate-950 border-t border-slate-50 dark:border-slate-800 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial="initial"
            whileInView="whileInView"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black px-4 py-2 rounded-full mb-6 uppercase tracking-widest shadow-sm"
            >
              <TrendingUp size={12} />
              Platform Excellence
            </motion.div>
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight"
            >
              Everything You Need to Excel
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium"
            >
              Designed specifically for research-oriented learning, our tools help you go deeper, learn faster, and achieve more.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="initial"
            whileInView="whileInView"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeInUp}
                  whileHover={{ y: -8 }}
                  className="group relative bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 dark:hover:shadow-black/40 transition-all p-8 overflow-hidden"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                  <div className={`${f.bg} dark:bg-opacity-10 w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform`}>
                    <Icon size={28} className={f.text} />
                  </div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">{f.title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{f.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how" className="py-32 bg-slate-50 dark:bg-slate-950/50 border-y border-slate-100 dark:border-slate-800 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial="initial"
            whileInView="whileInView"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black px-4 py-2 rounded-full mb-6 uppercase tracking-widest shadow-sm"
            >
              <Zap size={12} />
              The Sahan Method
            </motion.div>
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight"
            >
              Your Journey to Research Mastery
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium"
            >
              We've simplified the complex process of academic research into four clear, manageable steps.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="initial"
            whileInView="whileInView"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative"
          >
            {/* Connection Line */}
            <motion.div 
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: 0.5 }}
              className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-800 -translate-y-1/2 origin-left" 
            />
            
            {[
                { step: "01", title: "Join Sahan", desc: "Create your academic profile and join our growing research community.", icon: UserPlus, color: "bg-blue-600" },
                { step: "02", title: "Choose Course", desc: "Select from our curated list of expert-led research modules.", icon: Search, color: "bg-indigo-600" },
                { step: "03", title: "Learn & Apply", desc: "Watch lectures, complete assignments, and apply skills to your work.", icon: GraduationCap, color: "bg-violet-600" },
                { step: "04", title: "Track Growth", desc: "Monitor your progress and earn recognition for your research achievements.", icon: LineChart, color: "bg-fuchsia-600" },
              ].map((s) => (
              <motion.div 
                key={s.step} 
                variants={fadeInUp}
                className="relative flex flex-col items-center text-center group"
              >
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 3 }}
                  className="relative z-10 w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100/50 dark:shadow-black/20 transition-all mb-8"
                >
                  <span className="text-white text-2xl font-black tracking-tighter">{s.step}</span>
                </motion.div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 uppercase tracking-tight">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{s.desc}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 text-center"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-700 dark:hover:bg-indigo-600 text-white font-black px-10 py-5 rounded-[2rem] shadow-xl shadow-indigo-100 dark:shadow-indigo-950/50 transition-all text-xs uppercase tracking-widest"
              >
                Join Sahan Research Today <ArrowRight size={18} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────────────────────── */}
      <section id="testimonials" className="py-32 bg-white dark:bg-slate-950 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial="initial"
            whileInView="whileInView"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black px-4 py-2 rounded-full mb-6 uppercase tracking-widest shadow-sm"
            >
              <Star size={12} />
              Student Success
            </motion.div>
            <motion.h2 
              variants={fadeInUp}
              className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight"
            >
              What Our Community Says
            </motion.h2>
            <motion.p 
              variants={fadeInUp}
              className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium"
            >
              Hear from the researchers, students, and lecturers who rely on Sahan Research every day.
            </motion.p>
          </motion.div>

          <motion.div 
            initial="initial"
            whileInView="whileInView"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {testimonials.map((t) => (
              <motion.div 
                key={t.name} 
                variants={fadeInUp}
                whileHover={{ y: -10 }}
                className="bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] p-10 border border-slate-100 dark:border-slate-800 hover:shadow-2xl dark:hover:shadow-indigo-950/20 transition-all group"
              >
                {/* Stars */}
                <div className="flex gap-1 mb-8 group-hover:scale-105 transition-transform origin-left">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-lg leading-relaxed mb-8 italic font-medium">"{t.quote}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white text-xl font-black shadow-lg">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{t.name}</p>
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 bg-indigo-600 dark:bg-indigo-900 pointer-events-none" />
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-white dark:bg-indigo-400 rounded-full blur-[120px]" />
        </motion.div>

        <motion.div 
          initial="initial"
          whileInView="whileInView"
          variants={staggerContainer}
          viewport={{ once: true }}
          className="relative max-w-4xl mx-auto px-6 text-center"
        >
          <motion.h2 variants={fadeInUp} className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-8 tracking-tight">
            Ready to Begin Your <br /> Research Journey?
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-indigo-100 text-xl mb-12 max-w-2xl mx-auto opacity-90 font-medium leading-relaxed">
            Join thousands of students and researchers who are advancing their knowledge on Sahan Research — the premier academic platform built for growth.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Link
                href="/register"
                className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-indigo-50 font-black px-12 py-5 rounded-[2rem] shadow-2xl transition-all text-sm uppercase tracking-widest block text-center"
              >
                Create Free Account
              </Link>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full sm:w-auto">
              <Link
                href="/login"
                className="w-full sm:w-auto bg-indigo-700/50 dark:bg-black/20 text-white hover:bg-indigo-700/80 dark:hover:bg-black/40 font-black px-12 py-5 rounded-[2rem] border border-white/20 transition-all text-sm uppercase tracking-widest backdrop-blur-sm block text-center"
              >
                Sign In Instead
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-white dark:bg-slate-950 py-20 border-t border-slate-100 dark:border-slate-800 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial="initial"
            whileInView="whileInView"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16"
          >
            {/* Brand */}
            <motion.div variants={fadeInUp} className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img 
                  src="/logo.jpeg" 
                  alt="Sahan Research Logo" 
                  className="w-10 h-10 rounded-xl object-cover shadow-lg" 
                />
                <span className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sahan <span className="text-indigo-600 dark:text-indigo-400">Research</span></span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs font-medium leading-relaxed">
                A structured academic platform for research lectures, courses, and progress tracking. Built for learners who mean business.
              </p>
              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                   <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                     <Mail size={16} />
                   </div>
                   contact@sahanresearch.so
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                   <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                     <Phone size={16} />
                   </div>
                   +252 63 4379036
                </div>
              </div>
            </motion.div>

            {/* Platform links */}
            <motion.div variants={fadeInUp}>
              <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">Platform</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                {[["About Us", "#about"], ["Features", "#features"], ["How It Works", "#how"], ["Success Stories", "#testimonials"]].map(([l, h]) => (
                  <li key={l}><a href={h} onClick={(e) => handleNavClick(e, h)} className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest text-[10px]">{l}</a></li>
                ))}
              </ul>
            </motion.div>

            {/* Account links */}
            <motion.div variants={fadeInUp}>
              <h4 className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] mb-6">Account</h4>
              <ul className="space-y-4 text-sm font-bold text-slate-500 dark:text-slate-400">
                <li><Link href="/login" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest text-[10px]">Sign In</Link></li>
                <li><Link href="/register" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest text-[10px]">Register</Link></li>
                <li><Link href="/dashboard" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors uppercase tracking-widest text-[10px]">Dashboard</Link></li>
              </ul>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="border-t border-slate-100 dark:border-slate-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6"
          >
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              &copy; {new Date().getFullYear()} Sahan Research System. All rights reserved.
            </p>
            <div className="flex gap-8 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Terms of Service</a>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}
