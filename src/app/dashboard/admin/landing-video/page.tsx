"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { UploadDropzone } from "@/lib/uploadthing";
import { Trash2, Video as VideoIcon, Link as LinkIcon, Save, PlaySquare, AlertCircle } from "lucide-react";
import Loader from "@/components/Loader";

export default function LandingVideoPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [videoData, setVideoData] = useState<{ videoType: "UPLOAD" | "URL"; videoUrl: string } | null>(null);
  
  const [inputType, setInputType] = useState<"UPLOAD" | "URL">("URL");
  const [inputUrl, setInputUrl] = useState("");
  const [uploadUrl, setUploadUrl] = useState("");

  useEffect(() => {
    fetchVideo();
  }, []);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/admin/landing-video");
      if (res.data) {
        setVideoData(res.data);
        setInputType(res.data.videoType);
        if (res.data.videoType === "URL") setInputUrl(res.data.videoUrl);
        if (res.data.videoType === "UPLOAD") setUploadUrl(res.data.videoUrl);
      }
    } catch (error) {
      console.error("Failed to fetch landing video", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const urlToSave = inputType === "UPLOAD" ? uploadUrl : inputUrl;
      
      if (!urlToSave) {
        alert("Please provide a valid video URL or upload a file.");
        return;
      }

      await axios.put("/api/admin/landing-video", {
        videoType: inputType,
        videoUrl: urlToSave,
      });

      alert("Landing page video saved successfully.");
      fetchVideo();
    } catch (error) {
      console.error("Failed to save video", error);
      alert("Failed to save video");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete the landing page video? This will remove it from the public landing page.")) return;
    
    try {
      setDeleting(true);
      await axios.delete("/api/admin/landing-video");
      setVideoData(null);
      setInputUrl("");
      setUploadUrl("");
      alert("Video removed successfully.");
    } catch (error) {
      console.error("Failed to delete video", error);
      alert("Failed to delete video");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader /></div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <PlaySquare className="text-indigo-600" />
            Landing Page Video
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage the official system introduction video displayed on the public Landing Page.
          </p>
        </div>
        {videoData && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Trash2 size={16} />
            {deleting ? "Removing..." : "Remove Video"}
          </button>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        
        <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-max">
          <button
            onClick={() => setInputType("URL")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              inputType === "URL"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <LinkIcon size={16} />
            External URL
          </button>
          <button
            onClick={() => setInputType("UPLOAD")}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
              inputType === "UPLOAD"
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <VideoIcon size={16} />
            Direct Upload
          </button>
        </div>

        {inputType === "URL" ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Video URL (YouTube, Vimeo, MP4 link)
              </label>
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Upload MP4 Video
            </label>
            {uploadUrl ? (
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-green-600 dark:text-green-400 font-semibold mb-2 flex items-center gap-2">
                  <VideoIcon size={16} />
                  Video uploaded successfully
                </p>
                <video src={uploadUrl} controls className="w-full max-w-sm rounded-lg shadow-sm" />
                <button
                  onClick={() => setUploadUrl("")}
                  className="mt-3 text-sm text-red-600 font-medium hover:underline"
                >
                  Remove & Upload Another
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6">
                <UploadDropzone
                  endpoint="systemVideoUploader"
                  onClientUploadComplete={(res) => {
                    if (res && res[0]) {
                      setUploadUrl(res[0].url);
                    }
                  }}
                  onUploadError={(error: Error) => {
                    alert(`ERROR! ${error.message}`);
                  }}
                />
              </div>
            )}
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || (inputType === "URL" ? !inputUrl : !uploadUrl)}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Video Settings"}
          </button>
        </div>
      </div>

      {videoData && (
        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <AlertCircle className="text-indigo-600" />
            Currently Live on Landing Page
          </h2>
          <div className="aspect-video w-full max-w-2xl bg-black rounded-xl overflow-hidden shadow-lg mx-auto">
            {videoData.videoType === "URL" && videoData.videoUrl.includes("youtube.com") ? (
              <iframe
                src={videoData.videoUrl.replace("watch?v=", "embed/")}
                className="w-full h-full"
                allowFullScreen
              />
            ) : (
              <video
                src={videoData.videoUrl}
                controls
                controlsList="nodownload"
                className="w-full h-full object-cover"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
