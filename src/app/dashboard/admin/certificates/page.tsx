"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/Loader";
import { Award, Check, X, Download, User, BookOpen, ExternalLink, ShieldCheck, Filter } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function AdminCertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      const res = await axios.get("/api/certificates");
      setCertificates(res.data.certificates);
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
      toast.error("Failed to load certificate requests");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      let pdfUrl = "";
      if (status === "APPROVED") {
        pdfUrl = prompt("Please enter the PDF URL for the certificate:") || "";
        if (!pdfUrl) {
          toast.error("PDF URL is required for approval");
          return;
        }
      }

      await axios.patch("/api/certificates", { certificateId: id, status, pdfUrl });
      toast.success(`Certificate ${status.toLowerCase()} successfully`);
      fetchCertificates();
    } catch (error) {
      toast.error("Failed to update certificate status");
    }
  };

  const filteredCerts = certificates.filter(c => filter === "ALL" || c.status === filter);

  if (loading) return <div className="flex justify-center py-20"><Loader /></div>;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Credential Management</h1>
          <p className="text-gray-500 dark:text-slate-400 font-medium text-lg">Review and approve academic certificate requests from students.</p>
        </div>

        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-slate-900 rounded-2xl w-fit border border-gray-200 dark:border-slate-800">
          {["ALL", "PENDING", "APPROVED", "REJECTED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                filter === f 
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm" 
                  : "text-gray-500 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800">
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Student</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Course</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Result</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Request Date</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-800">
              {filteredCerts.map((cert) => (
                <tr key={cert.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-950/50 transition-all group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{cert.user.name}</div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase tracking-widest">{cert.user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-indigo-500" />
                      <span className="text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">{cert.course.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    {cert.result ? (
                      <div className="text-xs font-bold text-gray-600 dark:text-slate-300">
                        <div>{cert.result.totalEarned}/{cert.result.totalPossible}</div>
                        <div className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                          M {cert.result.moduleEarned}/{cert.result.moduleTotal} · F {cert.result.finalEarned}/{cert.result.finalTotal}
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">{new Date(cert.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      cert.status === "APPROVED" 
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                        : cert.status === "PENDING"
                        ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                        : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30"
                    }`}>
                      {cert.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {cert.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(cert.id, "APPROVED")}
                            className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-100 dark:border-emerald-900/30 hover:bg-emerald-600 hover:text-white transition-all"
                            title="Approve Request"
                          >
                            <Check size={16} />
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(cert.id, "REJECTED")}
                            className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg border border-red-100 dark:border-red-900/30 hover:bg-red-600 hover:text-white transition-all"
                            title="Reject Request"
                          >
                            <X size={16} />
                          </button>
                        </>
                      )}
                      {cert.status === "APPROVED" && cert.pdfUrl && (
                        <a
                          href={cert.pdfUrl}
                          target="_blank"
                          className="p-2 bg-gray-100 dark:bg-slate-800 text-gray-500 hover:text-indigo-600 rounded-lg transition-all"
                          title="View Certificate"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCerts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 rounded-3xl bg-gray-50 dark:bg-slate-950 flex items-center justify-center text-gray-200 dark:text-slate-800">
                        <Filter size={40} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-widest">No matching requests</p>
                        <p className="text-gray-500 dark:text-slate-500 font-medium">There are currently no certificate requests in this category.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
