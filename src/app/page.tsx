"use client";

import Link from "next/link";
import {
  BookOpen, FlaskConical, GraduationCap, TrendingUp,
  Users, ChevronRight, Star, CheckCircle2, ArrowRight,
  Microscope, Library, BarChart3, Globe2, Mail, Phone, MapPin,
  Clock, DollarSign, Zap, UserPlus, Search, LineChart, Menu, PlaySquare, MonitorPlay
} from "lucide-react";
import { useEffect, useState } from "react";
import axios from "axios";
import { Course } from "@/redux/slice/courseSlice";
import CourseCard from "@/components/CourseCard";
import Loader from "@/components/Loader";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import MovingBackground from "@/components/MovingBackground";
import { usePathname } from "next/navigation";

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
    icon: MonitorPlay,
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
    icon: TrendingUp,
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
    quote: "Sahan transformed how I access academic materials. The structured lectures are world-class.",
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
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  
  // Access auth state from 
  const { currentUser } = useSelector((state: RootState) => state.user);

  // Auto-close menu on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

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
    if (!shouldReduceMotion) {
      document.documentElement.style.scrollBehavior = "smooth";
    }
    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      document.documentElement.style.scrollBehavior = "";
    };
  }, [shouldReduceMotion]);

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

      {/* ── MODERN NAVBAR ────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled 
            ? "bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl shadow-sm border-b border-slate-200/50 dark:border-slate-800/50 py-2" 
            : "bg-transparent py-4"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* ── LOGO SECTION ── */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="shrink-0"
            >
              <Link href="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <img 
                    src="/logo.jpeg" 
                    alt="Logo" 
                    className="w-9 h-9 rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-indigo-600/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="text-[14px] font-black tracking-tight text-slate-900 dark:text-white uppercase">Sahan Research</span>
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.1em]">Studies Center</span>
                </div>
              </Link>
            </motion.div>

            {/* ── NAVIGATION & AUTH ── */}
            <div className="flex items-center gap-8">
              {/* Desktop Nav */}
              <nav className="hidden md:flex items-center gap-7">
                {[
                  ["About", "#about", "about"],
                  ["Courses", "#courses", "courses"],
                  ["Features", "#features", "features"],
                  ["How It Works", "#how", "how"],
                  ["Testimonials", "#testimonials", "testimonials"],
                ].map(([label, href, id]) => (
                  <a
                    key={label}
                    href={href}
                    onClick={(e) => handleNavClick(e, href)}
                    className={`text-[11px] font-black uppercase tracking-[0.15em] transition-all duration-300 relative py-1 group ${
                      activeSection === id 
                        ? "text-indigo-600 dark:text-indigo-400" 
                        : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                    }`}
                  >
                    {label}
                    <span className={`absolute -bottom-1 left-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-500 ${activeSection === id ? "w-full" : "w-0 group-hover:w-full"}`} />
                  </a>
                ))}
              </nav>

              {/* Desktop Auth */}
              <div className="hidden md:flex items-center gap-4 pl-4 border-l border-slate-200 dark:border-slate-800">
                <ThemeToggle />
                <Link
                  href="/login"
                  className="px-6 py-2 rounded-full text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-white bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-500 transition-all duration-300"
                >
                  Login
                </Link>
              </div>

              {/* Mobile Actions */}
              <div className="md:hidden flex items-center gap-3">
                <ThemeToggle />
                <button 
                  className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg transition-all" 
                  onClick={() => setMenuOpen(!menuOpen)} 
                >
                  <Menu size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE MENU ── */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 overflow-hidden shadow-2xl"
            >
              <div className="px-6 py-8 flex flex-col gap-5">
                {[
                  ["About", "#about"],
                  ["Courses", "#courses"],
                  ["Features", "#features"],
                  ["How It Works", "#how"],
                  ["Testimonials", "#testimonials"]
                ].map(([label, href]) => (
                  <a 
                    key={label} 
                    href={href} 
                    onClick={(e) => handleNavClick(e, href)} 
                    className="text-sm font-black text-slate-600 dark:text-slate-400 uppercase tracking-widest hover:text-indigo-600"
                  >
                    {label}
                  </a>
                ))}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-900 flex flex-col gap-3">
                  <Link 
                    href="/login" 
                    className="w-full py-4 rounded-xl bg-indigo-600 text-white text-center text-xs font-black uppercase tracking-widest"
                  >
                    Login
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>


      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-32 pb-24 lg:pt-44 lg:pb-32 transition-colors duration-500">
        {/* Background blobs */}
        <motion.div
          animate={
            shouldReduceMotion
              ? { scale: 1, opacity: 0.25 }
              : { scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 8, repeat: Infinity, ease: "easeInOut" }
          }
          className="absolute -top-40 -right-40 w-[700px] h-[700px] bg-indigo-100 dark:bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" 
        />
        <motion.div
          animate={
            shouldReduceMotion
              ? { scale: 1, opacity: 0.2 }
              : { scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }
          }
          className="absolute -bottom-20 -left-40 w-[500px] h-[500px] bg-violet-100 dark:bg-violet-900/10 rounded-full blur-[100px] pointer-events-none" 
        />

        {/* Watermark background logo (subtle, centered, masked) */}
        <motion.div
          aria-hidden
          initial={{ opacity: 0, scale: 0.98 }}
          animate={
            shouldReduceMotion
              ? { opacity: 1, scale: 1 }
              : { opacity: 1, scale: 1 }
          }
          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.8, ease: "easeOut" }}
          className="absolute inset-0 pointer-events-none z-0 flex items-center justify-center"
        >
          <div
            className={[
              "relative",
              // Responsive sizing
              "w-[420px] sm:w-[560px] lg:w-[760px] xl:w-[860px]",
              // Mobile: smaller + lighter
              "opacity-[0.035] sm:opacity-[0.055] dark:opacity-[0.03] dark:sm:opacity-[0.05]",
              // Premium softness
              "blur-2xl sm:blur-3xl",
              // Subtle polish transitions
              "transition-opacity duration-700",
              // Fade into background via radial mask
              "[mask-image:radial-gradient(circle_at_center,rgba(0,0,0,1)_0%,rgba(0,0,0,0.7)_35%,rgba(0,0,0,0)_70%)]",
              "dark:[mask-image:radial-gradient(circle_at_center,rgba(0,0,0,1)_0%,rgba(0,0,0,0.55)_35%,rgba(0,0,0,0)_70%)]",
            ].join(" ")}
          >
            <img
              src="/logo.jpeg"
              alt=""
              className="w-full h-auto select-none"
              draggable={false}
            />
          </div>
        </motion.div>
        


        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <motion.div 
            initial="initial"
            animate="whileInView"
            variants={staggerContainer}
            className="max-w-4xl mx-auto text-center"
          >

            {/* Badge */}
            {/* <motion.div 
              variants={fadeInUp}
              className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-[10px] font-black px-4 py-2 rounded-full mb-8 uppercase tracking-[0.15em] shadow-sm"
            >
              <img src="/logo.jpeg" alt="Icon" className="w-4 h-4 rounded-md object-cover" />
              Academic Research Platform &amp; E-Learning
            </motion.div> */}

            <motion.h1 
              variants={fadeInUp}
              className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.08] tracking-tight text-slate-900 dark:text-white"
            >
              Sahan Research{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent">
                &
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

            {/* Buttons and Trust badges removed as per request */}
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
              Explore Our Academic Courses
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
                    actionLabel={currentUser ? "Enroll Now" : "Quick Enroll"}
                    onAction={() => window.location.href = currentUser ? '/dashboard/active-courses' : '/login'}
                    secondaryActionLabel="View Details"
                    onSecondaryAction={() => window.location.href = `/courses/${course.id}`}
                    onCardClick={() => window.location.href = `/courses/${course.id}`}
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
                About Sahan
              </motion.div>
              <motion.h2 
                variants={fadeInUp}
                className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tight"
              >
                Democratising Academic Courses for Everyone
              </motion.h2>
              <motion.p 
                variants={fadeInUp}
                className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed mb-6 font-medium"
              >
                Sahan was founded to bridge the gap between research institutions and learners. 
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
                Join Sahan Today <ArrowRight size={18} />
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
              Hear from the researchers, students, and lecturers who rely on Sahan every day.
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
            Ready to Begin Your <br /> Academic Journey?
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
      <footer className="relative bg-slate-900 pt-24 pb-12 overflow-hidden transition-colors duration-500">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-950 pointer-events-none" />
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
            {/* Brand & Mission */}
            <motion.div variants={fadeInUp} className="space-y-8">
              <div className="flex items-center gap-3">
                <div className="bg-white p-1.5 rounded-xl">
                  <img src="/logo.jpeg" alt="Logo" className="w-8 h-8 rounded-lg object-cover" />
                </div>
                <span className="text-xl font-black text-white uppercase tracking-tight">Sahan <span className="text-indigo-400"></span></span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs font-medium">
                Imagine your academic journey accelerating with structured research, expert lectures, and guided excellence.
              </p>
            </motion.div>

            {/* Pages */}
            <motion.div variants={fadeInUp}>
              <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-8">Pages</h3>
              <ul className="space-y-4">
                {["Home", "Services", "Features", "Projects", "Demo"].map((item) => (
                  <li key={item}>
                    <a href={item === "Home" ? "#" : `#${item.toLowerCase()}`} onClick={(e) => item !== "Home" && handleNavClick(e, `#${item.toLowerCase()}`)} className="text-slate-400 hover:text-indigo-400 transition-colors text-[11px] font-black uppercase tracking-widest">{item}</a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Services */}
            <motion.div variants={fadeInUp}>
              <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-8">Services</h3>
              <ul className="space-y-4">
                {["Web design", "Web Development", "Web Apps", "Desktop apps", "Mobile apps"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-[11px] font-black uppercase tracking-widest">{item}</a>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Information */}
            <motion.div variants={fadeInUp}>
              <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em] mb-8">Information</h3>
              <ul className="space-y-4">
                {["Developers", "Features", "About us"].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-slate-400 hover:text-indigo-400 transition-colors text-[11px] font-black uppercase tracking-widest">{item}</a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>

          {/* Bottom Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="pt-12 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-10"
          >
            {/* Socials */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Also we are available on:</span>
              <div className="flex gap-4">
                <a href="https://www.facebook.com/share/1AiVQKQPmS/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:bg-sky-500 hover:text-white transition-all shadow-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:bg-pink-600 hover:text-white transition-all shadow-lg">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </a>
                <a href="https://wa.me/252637736519" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-lg">
                  <Phone size={18} />
                </a>
                <a href="mailto:SahanResearch252@gmail.com" className="w-10 h-10 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:bg-indigo-600 hover:text-white transition-all shadow-lg">
                  <Mail size={18} />
                </a>
              </div>
            </div>

          </motion.div>

          {/* Copyright Section - Centered */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-12 text-center"
          >
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
              © Sahan Research and Studies Center 2026
            </p>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}