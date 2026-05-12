"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { Lock, FileQuestion, Award } from "lucide-react";
import { getUserEnrollments } from "@/redux/slice/enrollmentSlice";

type CourseItem = { id: number; name: string };

export default function ExamsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { enrollments } = useSelector((state: RootState) => state.enrollment);
  const [courseId, setCourseId] = useState<number | "">("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeExam, setActiveExam] = useState<any>(null);
  const [examDetail, setExamDetail] = useState<any>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [requestingCert, setRequestingCert] = useState(false);
  const [certificateStatus, setCertificateStatus] = useState<string | null>(null);

  const courses: CourseItem[] = useMemo(
    () =>
      enrollments
        .filter((e) => e.status === "APPROVED" && e.course)
        .map((e) => ({ id: e.courseId, name: e.course?.name || "Unknown Course" })),
    [enrollments]
  );

  useEffect(() => {
    dispatch(getUserEnrollments());
  }, [dispatch]);

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

      <div className="mb-6">
        <select
          value={courseId}
          onChange={(e) => setCourseId(e.target.value ? Number(e.target.value) : "")}
          className="w-full md:w-96 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
        >
          <option value="">Select enrolled course</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading exams...</p>
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

