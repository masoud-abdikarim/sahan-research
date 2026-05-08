"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import Loader from "@/components/Loader";
import { Award, CheckCircle, Clock, Download, ExternalLink, ShieldCheck } from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";

export default function StudentCertificatesPage() {
  const { currentUser } = useSelector((state: RootState) => state.user);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      fetchCertificates();
    }
  }, [currentUser]);

  const fetchCertificates = async () => {
    try {
      const res = await axios.get(`/api/certificates?userId=${currentUser?.id}`);
      setCertificates(res.data.certificates);
    } catch (error) {
      console.error("Failed to fetch certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader /></div>;

  return (
    <div className="max-w-7xl mx-auto pb-20">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Academic Recognition</h1>
        <p className="text-gray-500 dark:text-slate-400 font-medium text-lg">Manage your earned certificates and track your achievement requests.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {certificates.map((cert) => (
          <div key={cert.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-gray-100 dark:border-slate-800 shadow-xl shadow-indigo-100/20 dark:shadow-none transition-all hover:shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <Award size={32} />
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                cert.status === "APPROVED" 
                  ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                  : cert.status === "PENDING"
                  ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30"
                  : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30"
              }`}>
                {cert.status}
              </span>
            </div>

            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-4 leading-tight">{cert.course.name}</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                <ShieldCheck size={14} className="text-indigo-500" />
                Verified Credential
              </div>
              {cert.issueDate && (
                <div className="flex items-center gap-3 text-xs font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">
                  <Clock size={14} className="text-indigo-500" />
                  Issued {new Date(cert.issueDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {cert.status === "APPROVED" ? (
              <a 
                href={cert.pdfUrl || "#"} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-gray-900 dark:bg-white text-white dark:text-slate-900 py-4 rounded-2xl font-black hover:bg-black dark:hover:bg-slate-100 transition-all shadow-xl uppercase tracking-widest text-[10px]"
              >
                <Download size={16} />
                Download Certificate
              </a>
            ) : (
              <div className="text-center py-4 bg-gray-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black text-gray-400 uppercase tracking-widest border border-gray-100 dark:border-slate-700">
                {cert.status === "PENDING" ? "Processing Verification..." : "Request Rejected"}
              </div>
            )}
          </div>
        ))}
        {certificates.length === 0 && (
          <div className="col-span-full py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-dashed border-gray-200 dark:border-slate-800">
            <Award className="mx-auto text-gray-200 dark:text-slate-800 mb-6" size={64} />
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">No Certificates Yet</h3>
            <p className="text-gray-500 dark:text-slate-500 max-w-sm mx-auto font-medium">Complete your course modules and final exam with 70% or higher to become eligible for academic recognition.</p>
          </div>
        )}
      </div>
    </div>
  );
}
