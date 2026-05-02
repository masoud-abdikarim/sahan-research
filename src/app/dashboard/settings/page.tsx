"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import { getCurrentUser } from "@/redux/slice/userSlice";
import Loader from "@/components/Loader";
import { User, Mail, Phone, Calendar, Shield, BadgeCheck } from "lucide-react";

export default function SettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { currentUser, loading, error } = useSelector((state: RootState) => state.user);

  useEffect(() => {
    dispatch(getCurrentUser());
  }, [dispatch]);

  if (loading && !currentUser) return <Loader />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <p className="text-red-500 font-medium mb-4">{error}</p>
        <button 
          onClick={() => dispatch(getCurrentUser())}
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
        <p className="text-gray-500 mt-1">Manage your personal information and security preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Col: Profile Card */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="relative mx-auto w-24 h-24 mb-4">
              <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <User size={48} />
              </div>
              <div className="absolute bottom-0 right-0 bg-white p-1 rounded-full border border-gray-100 shadow-sm">
                <BadgeCheck size={20} className="text-indigo-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-gray-900 truncate">{currentUser.name}</h2>
            <p className="text-sm text-gray-500 mb-6">{currentUser.email}</p>
            
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              currentUser.role === "ADMIN" 
                ? "bg-red-50 text-red-600 border border-red-100" 
                : "bg-green-50 text-green-600 border border-green-100"
            }`}>
              {currentUser.role === "ADMIN" ? <Shield size={12} /> : <User size={12} />}
              {currentUser.role}
            </div>
          </div>
        </div>

        {/* Right Col: Details Grid */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50">
              <h3 className="font-bold text-gray-900">Personal Information</h3>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Email Address</p>
                  <p className="text-sm font-semibold text-gray-900">{currentUser.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-purple-50 p-2 rounded-lg text-purple-600">
                  <Phone size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Phone Number</p>
                  <p className="text-sm font-semibold text-gray-900">{currentUser.phone}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-amber-50 p-2 rounded-lg text-amber-600">
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Joined Date</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {new Date(currentUser.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                  <Shield size={18} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Account Role</p>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{currentUser.role.toLowerCase()}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Account Security: Your information is protected by industry-standard encryption and role-based access controls.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
