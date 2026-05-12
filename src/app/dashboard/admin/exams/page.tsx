"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Plus, Trash2, ArrowUp, ArrowDown, FileQuestion, ShieldCheck } from "lucide-react";

type Course = { id: number; name: string };
type Module = { id: number; title: string; order: number };
type QuestionInput = {
  id: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: number;
  marks: number;
};

const emptyQuestion = (): QuestionInput => ({
  id: crypto.randomUUID(),
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: 0,
  marks: 1,
});

export default function AdminExamsPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const [exams, setExams] = useState<any[]>([]);
  const [editingExamId, setEditingExamId] = useState<number | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    courseId: "",
    moduleId: "",
    type: "MODULE" as "MODULE" | "FINAL",
    passingMarks: 70,
  });
  const [questions, setQuestions] = useState<QuestionInput[]>([emptyQuestion()]);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const [courseRes, examsRes] = await Promise.all([
          axios.get("/api/courses"),
          axios.get("/api/admin/exams"),
        ]);
        setCourses(courseRes.data.courses || []);
        setExams(examsRes.data.exams || []);
      } catch {
        toast.error("Failed to load exam management data");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [refreshToken]);

  useEffect(() => {
    if (!form.courseId) {
      setModules([]);
      setForm((prev) => ({ ...prev, moduleId: "" }));
      return;
    }
    const fetchModules = async () => {
      try {
        const res = await axios.get(`/api/admin/modules?courseId=${form.courseId}`);
        setModules(res.data.modules || []);
      } catch {
        setModules([]);
      }
    };
    fetchModules();
  }, [form.courseId]);

  const totalMarks = useMemo(
    () => questions.reduce((sum, q) => sum + Number(q.marks || 0), 0),
    [questions]
  );

  const resetForm = () => {
    setEditingExamId(null);
    setForm({
      title: "",
      description: "",
      courseId: "",
      moduleId: "",
      type: "MODULE",
      passingMarks: 70,
    });
    setQuestions([emptyQuestion()]);
  };

  const fillForEdit = (exam: any) => {
    setEditingExamId(exam.id);
    setForm({
      title: exam.title,
      description: exam.description || "",
      courseId: String(exam.courseId),
      moduleId: exam.moduleId ? String(exam.moduleId) : "",
      type: exam.type,
      passingMarks: exam.passingMarks,
    });
    setQuestions(
      (exam.questions || []).map((q: any) => ({
        id: crypto.randomUUID(),
        questionText: q.questionText,
        optionA: q.options?.[0] || "",
        optionB: q.options?.[1] || "",
        optionC: q.options?.[2] || "",
        optionD: q.options?.[3] || "",
        correctOption: q.correctOptions?.[0] ?? 0,
        marks: q.marks ?? 1,
      }))
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.courseId) return toast.error("Select a course");
    if (form.type === "MODULE" && !form.moduleId) return toast.error("Select a module for module exam");
    if (!form.title.trim()) return toast.error("Exam title is required");
    if (!questions.length) return toast.error("Add at least one question");

    const invalid = questions.some(
      (q) =>
        !q.questionText.trim() ||
        !q.optionA.trim() ||
        !q.optionB.trim() ||
        !q.optionC.trim() ||
        !q.optionD.trim() ||
        q.marks <= 0
    );
    if (invalid) return toast.error("Complete all question fields");

    setSaving(true);
    try {
      await axios.post("/api/admin/exams", {
        id: editingExamId ?? undefined,
        title: form.title,
        description: form.description,
        type: form.type,
        courseId: Number(form.courseId),
        moduleId: form.type === "MODULE" ? Number(form.moduleId) : null,
        passingMarks: Number(form.passingMarks),
        totalMarks,
        questions,
      });
      toast.success(editingExamId ? "Exam updated" : "Exam created");
      resetForm();
      setRefreshToken((n) => n + 1);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to save exam");
    } finally {
      setSaving(false);
    }
  };

  const deleteExam = async (id: number) => {
    if (!confirm("Delete this exam?")) return;
    try {
      await axios.delete(`/api/admin/exams?id=${id}`);
      toast.success("Exam deleted");
      if (editingExamId === id) resetForm();
      setRefreshToken((n) => n + 1);
    } catch {
      toast.error("Failed to delete exam");
    }
  };

  const updateQuestion = (id: string, patch: Partial<QuestionInput>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...patch } : q)));
  };

  const moveQuestion = (idx: number, direction: -1 | 1) => {
    const next = [...questions];
    const target = idx + direction;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setQuestions(next);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Exams Management</h1>
        <p className="text-gray-500 dark:text-slate-400">Create module exams and final exams with dynamic MCQ questions.</p>
      </div>

      <form onSubmit={saveExam} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <select
            value={form.courseId}
            onChange={(e) => setForm((p) => ({ ...p, courseId: e.target.value, moduleId: "" }))}
            className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent"
            required
          >
            <option value="">Select course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={form.type}
            onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as "MODULE" | "FINAL", moduleId: "" }))}
            className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent"
            required
          >
            <option value="MODULE">Module Exam</option>
            <option value="FINAL">Final Exam</option>
          </select>
          {form.type === "MODULE" ? (
            <select
              value={form.moduleId}
              onChange={(e) => setForm((p) => ({ ...p, moduleId: e.target.value }))}
              className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent"
              required
            >
              <option value="">Select module</option>
              {modules.map((m) => {
                const prefix = `Module ${m.order}`;
                const displayTitle = m.title.toLowerCase().startsWith(prefix.toLowerCase()) 
                  ? m.title 
                  : `${prefix} - ${m.title}`;
                return (
                  <option key={m.id} value={m.id}>
                    {displayTitle}
                  </option>
                );
              })}
            </select>
          ) : (
            <div className="px-4 py-3 rounded-xl border border-dashed border-indigo-300 text-indigo-600 dark:text-indigo-400 text-sm font-bold flex items-center gap-2">
              <ShieldCheck size={16} /> Final Exam (no module required)
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            className="md:col-span-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent"
            placeholder="Exam title"
            required
          />
          <input
            type="number"
            min={1}
            max={100}
            value={form.passingMarks}
            onChange={(e) => setForm((p) => ({ ...p, passingMarks: Number(e.target.value) }))}
            className="px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent"
            placeholder="Passing marks %"
          />
        </div>

        <textarea
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent min-h-24"
          placeholder="Exam description (optional)"
        />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <FileQuestion size={18} /> Questions
          </h2>
          <button
            type="button"
            onClick={() => setQuestions((p) => [...p, emptyQuestion()])}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-bold"
          >
            <Plus size={16} /> Add Question
          </button>
        </div>

        <div className="space-y-4">
          {questions.map((q, idx) => (
            <div key={q.id} className="border border-gray-200 dark:border-slate-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-sm">Question {idx + 1}</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => moveQuestion(idx, -1)} className="p-2 rounded-lg border border-gray-200">
                    <ArrowUp size={14} />
                  </button>
                  <button type="button" onClick={() => moveQuestion(idx, 1)} className="p-2 rounded-lg border border-gray-200">
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuestions((p) => p.filter((item) => item.id !== q.id))}
                    className="p-2 rounded-lg border border-red-200 text-red-500"
                    disabled={questions.length === 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <textarea
                value={q.questionText}
                onChange={(e) => updateQuestion(q.id, { questionText: e.target.value })}
                className="w-full mb-3 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent"
                placeholder="Question text"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <input value={q.optionA} onChange={(e) => updateQuestion(q.id, { optionA: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent" placeholder="Option A" />
                <input value={q.optionB} onChange={(e) => updateQuestion(q.id, { optionB: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent" placeholder="Option B" />
                <input value={q.optionC} onChange={(e) => updateQuestion(q.id, { optionC: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent" placeholder="Option C" />
                <input value={q.optionD} onChange={(e) => updateQuestion(q.id, { optionD: e.target.value })} className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent" placeholder="Option D" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={q.correctOption}
                  onChange={(e) => updateQuestion(q.id, { correctOption: Number(e.target.value) })}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent"
                >
                  <option value={0}>Correct: A</option>
                  <option value={1}>Correct: B</option>
                  <option value={2}>Correct: C</option>
                  <option value={3}>Correct: D</option>
                </select>
                <input
                  type="number"
                  min={1}
                  value={q.marks}
                  onChange={(e) => updateQuestion(q.id, { marks: Number(e.target.value) })}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-transparent"
                  placeholder="Marks"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <p className="text-sm font-bold text-gray-600 dark:text-slate-300">Total marks: {totalMarks}</p>
          <div className="flex items-center gap-2">
            {editingExamId && (
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl border border-gray-300 font-bold text-sm">
                Cancel Edit
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-sm disabled:opacity-60"
            >
              {saving ? "Saving..." : editingExamId ? "Update Exam" : "Create Exam"}
            </button>
          </div>
        </div>
      </form>

      <div className="mt-8 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">Existing Exams</h2>
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : exams.length === 0 ? (
          <p className="text-sm text-gray-500">No exams created yet.</p>
        ) : (
          <div className="space-y-3">
            {exams.map((exam) => (
              <div key={exam.id} className="border border-gray-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <p className="font-black text-gray-900 dark:text-white">{exam.title}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400">
                    {exam.course?.name} · {exam.type} 
                    {exam.module && (
                      (() => {
                        const m = exam.module;
                        const prefix = `Module ${m.order}`;
                        const display = m.title.toLowerCase().startsWith(prefix.toLowerCase())
                          ? m.title
                          : `${prefix}: ${m.title}`;
                        return ` · ${display}`;
                      })()
                    )}
                    · {exam.questions?.length || 0} questions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => fillForEdit(exam)} className="px-3 py-2 rounded-xl border border-gray-300 text-sm font-bold">
                    Edit
                  </button>
                  <button onClick={() => deleteExam(exam.id)} className="px-3 py-2 rounded-xl border border-red-300 text-red-600 text-sm font-bold">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

