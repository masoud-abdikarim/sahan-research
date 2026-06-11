"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { Lock, FileQuestion, Award, BookOpen } from "lucide-react";
import Loader from "@/components/Loader";

export default function ExamsPage() {
  const { enrollments, initialized: enrollInitialized } = useSelector((state: RootState) => state.enrollment);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [examDetail, setExamDetail] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [requestingCert, setRequestingCert] = useState(false);
  const [certificateStatus, setCertificateStatus] = useState<string | null>(null);

  const activeEnrollment = useMemo(() => {
    const inProgress = enrollments.filter((e) => e.status === "APPROVED" && !e.isCompleted);
    if (inProgress.length > 0) return inProgress[0];
    return enrollments.find((e) => e.status === "APPROVED") ?? null;
  }, [enrollments]);

  const courseId = activeEnrollment?.courseId ?? null;
  const courseName = activeEnrollment?.course?.name ?? null;

  useEffect(() => {
    if (!courseId) return;
    const run = async () => {
      setLoading(true);
      try {
        const [examRes, certRes] = await Promise.all([
          axios.get(`/api/user/exams?courseId=${courseId}`),
          axios.get(`/api/certificates`),
        ]);
        setData(examRes.data);
        const cert = (certRes.data.certificates || []).find((c: any) => c.courseId === Number(courseId));
        setCertificateStatus(cert?.status || null);
      } catch (error: any) {
        toast.error(error?.response?.data?.message || "Failed to load exams");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [courseId]);

  const openExam = async (exam: any) => {
    if (!exam.unlocked) return;
    try {
      const res = await axios.get(`/api/exam?examId=${exam.id}`);
      setExamDetail(res.data.exam);
      setAnswers({});
      setActiveExam(exam);
    } catch {
      toast.error("Failed to load exam questions");
    }
  };

  const submitExam = async () => {
    if (!activeExam || !examDetail) return;
    const unanswered = examDetail.questions.some((q: any) => answers[q.id] === undefined);
    if (unanswered) return toast.error("Answer all questions before submitting");

    setSubmitting(true);
    try {
      const res = await axios.post("/api/exam", {
        examId: activeExam.id,
        answers,
      });
      toast.success(
        res.data.passed
          ? `Passed! ${res.data.totalEarned}/${res.data.totalPossible}`
          : `Submitted. Current total ${res.data.totalEarned}/${res.data.totalPossible}`
      );
      setActiveExam(null);
      setExamDetail(null);
      const [updatedExamRes, certRes] = await Promise.all([
        axios.get(`/api/user/exams?courseId=${courseId}`),
        axios.get(`/api/certificates`),
      ]);
      setData(updatedExamRes.data);
      const cert = (certRes.data.certificates || []).find((c: any) => c.courseId === Number(courseId));
      setCertificateStatus(cert?.status || null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  };

  const requestCertificate = async () => {
    if (!courseId) return;
    setRequestingCert(true);
    try {
      const res = await axios.post("/api/certificates", { courseId: Number(courseId) });
      setCertificateStatus(res.data.certificate?.status || "PENDING");
      toast.success("Certificate request submitted");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Certificate request failed");
    } finally {
      setRequestingCert(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Exams Center</h1>
        <p className="text-gray-500 dark:text-slate-400">Complete module exams, unlock the final exam, and become certificate eligible.</p>
      </div>

      {!enrollInitialized ? (
        <div className="flex justify-center py-20"><Loader /></div>
      ) : !courseId ? (
        <div className="py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
          <BookOpen className="mx-auto text-gray-300 dark:text-slate-600 mb-4" size={48} />
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Active Course</h2>
          <p className="text-gray-500 dark:text-slate-400 font-medium max-w-sm mx-auto">
            Exams will appear here once your enrollment is approved and you begin a course.
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 inline-flex items-center gap-3 px-5 py-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/30">
            <BookOpen size={18} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
            <div>
              <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Your Course</p>
              <p className="font-black text-gray-900 dark:text-white">{courseName}</p>
            </div>
          </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader /></div>
      ) : data ? (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Module score</p>
              <p className="text-2xl font-black">{data.summary.moduleEarned}/{data.summary.moduleTotal}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Final score</p>
              <p className="text-2xl font-black">{data.summary.finalEarned}/{data.summary.finalTotal}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
              <p className="text-2xl font-black">{data.summary.totalEarned}/{data.summary.totalPossible}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
              <p className={`text-2xl font-black ${data.summary.status === "PASSED" ? "text-emerald-600" : "text-amber-600"}`}>
                {data.summary.status}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {data.modules.map((m: any) => (
              <div key={m.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <p className="font-black text-gray-900 dark:text-white">
                      {(() => {
                        const prefix = `Module ${m.order}`;
                        return m.title.toLowerCase().startsWith(prefix.toLowerCase())
                          ? m.title
                          : `${prefix}: ${m.title}`;
                      })()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Lessons: {m.completedLessonCount}/{m.lessonCount}
                    </p>
                  </div>
                  {m.exam ? (
                    <button
                      onClick={() => openExam(m.exam)}
                      disabled={!m.exam.unlocked || m.exam.attempts > 0}
                      className="px-4 py-2 rounded-xl text-sm font-bold border border-indigo-300 text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
                    >
                      {m.exam.unlocked ? <FileQuestion size={16} /> : <Lock size={16} />}
                      {m.exam.attempts > 0 
                        ? (m.exam.passed ? `Passed (${m.exam.earnedMarks}/${m.exam.totalMarks})` : `Completed (${m.exam.earnedMarks}/${m.exam.totalMarks})`)
                        : "Take Module Exam"}
                    </button>
                  ) : (
                    <p className="text-xs text-gray-500">No exam configured</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data.finalExam && (
            <div className="bg-indigo-600 text-white rounded-3xl p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest font-bold text-indigo-200">Final Exam</p>
                  <p className="text-xl font-black">{data.finalExam.title}</p>
                  <p className="text-sm text-indigo-100">
                    {data.finalExam.passed
                      ? `Passed (${data.finalExam.earnedMarks}/${data.finalExam.totalMarks})`
                      : `${data.finalExam.earnedMarks}/${data.finalExam.totalMarks} · ${data.finalExam.attempts} attempt(s)`}
                  </p>
                </div>
                <button
                  onClick={() => openExam(data.finalExam)}
                  disabled={!data.finalExam.unlocked}
                  className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-bold disabled:opacity-60 inline-flex items-center gap-2"
                >
                  {data.finalExam.unlocked ? <FileQuestion size={16} /> : <Lock size={16} />}
                  {data.finalExam.unlocked ? "Take Final Exam" : "Locked"}
                </button>
              </div>
            </div>
          )}

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-500 font-bold">Certificate</p>
              <p className="font-black text-gray-900 dark:text-white">
                {certificateStatus
                  ? `Request status: ${certificateStatus}`
                  : data.summary.certificateEligible
                    ? "Eligible to request certificate"
                    : "Locked until 70+ total"}
              </p>
            </div>
            {data.summary.certificateEligible && !certificateStatus ? (
              <button
                onClick={requestCertificate}
                disabled={requestingCert}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold disabled:opacity-60"
              >
                {requestingCert ? "Requesting..." : "Request Certificate"}
              </button>
            ) : (
              <Award className={data.summary.certificateEligible ? "text-emerald-500" : "text-gray-400"} />
            )}
          </div>
        </div>
      ) : null}
        </>
      )}

      {activeExam && examDetail && (
        <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl border border-gray-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 p-4 flex items-center justify-between">
              <p className="font-black">{examDetail.title}</p>
              <button className="text-sm font-bold" onClick={() => setActiveExam(null)}>
                Close
              </button>
            </div>
            <div className="p-5 space-y-5">
              {examDetail.questions.map((q: any, idx: number) => (
                <div key={q.id} className="border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
                  <p className="font-bold mb-3">{idx + 1}. {q.questionText}</p>
                  <div className="space-y-2">
                    {q.options.map((opt: string, i: number) => (
                      <label key={i} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[q.id] === i}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Marks: {q.marks}</p>
                </div>
              ))}
              <button
                onClick={submitExam}
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Exam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

