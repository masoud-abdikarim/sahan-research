"use client";

import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Loader from "@/components/Loader";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { 
  Search, 
  User, 
  Shield, 
  ShieldAlert, 
  Edit, 
  Trash2, 
  X, 
  Plus, 
  Loader2, 
  ShieldCheck,
  UserCheck,
  Filter
} from "lucide-react";

type UserData = {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: "USER" | "ADMIN" | "SUPERADMIN";
  createdAt: string;
  _count?: {
    enrollments: number;
  };
};

export default function ManageAdminsPage() {
  const { currentUser } = useSelector((state: RootState) => state.user);
  
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "ADMIN" as "USER" | "ADMIN" | "SUPERADMIN"
  });

  // Edit Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "ADMIN" as "USER" | "ADMIN" | "SUPERADMIN"
  });

  // Delete Modal State
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserData | null>(null);

  // Bootstrap form state (for regular ADMINs)
  const [bootstrapForm, setBootstrapForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: ""
  });

  const fetchUsers = async () => {
    if (currentUser?.role !== "SUPERADMIN") {
      setLoading(false);
      return;
    }
    try {
      const res = await axios.get("/api/admin/users");
      setUsers(res.data.users || []);
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load user list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  // Filters & Search
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Exclude students from manage admins page
      if (u.role === "USER") return false;

      const matchesSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.phone && u.phone.includes(searchQuery));
      
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  // Pagination Math
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter]);

  // Handlers
  const handleOpenCreate = () => {
    setCreateForm({
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "ADMIN"
    });
    setIsCreateOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.phone.trim() || !createForm.password.trim()) {
      toast.error("All fields are required");
      return;
    }
    setActionLoading(true);
    try {
      await axios.post("/api/admin/users", createForm);
      toast.success(`${createForm.role} account created successfully!`);
      setIsCreateOpen(false);
      fetchUsers();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to create user";
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (user: UserData) => {
    setEditingUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      role: user.role
    });
    setIsEditOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!editForm.name.trim() || !editForm.email.trim() || !editForm.phone.trim()) {
      toast.error("Name, email, and phone are required");
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        role: editForm.role,
        password: editForm.password ? editForm.password : undefined
      };
      await axios.put(`/api/admin/users/${editingUser.id}`, payload);
      toast.success("User updated successfully");
      setIsEditOpen(false);
      fetchUsers();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to update user";
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDelete = (user: UserData) => {
    if (user.id === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }
    setDeletingUser(user);
    setIsDeleteOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;
    setActionLoading(true);
    try {
      await axios.delete(`/api/admin/users/${deletingUser.id}`);
      toast.success("User successfully deleted");
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to delete user";
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBootstrapCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bootstrapForm.name.trim() || !bootstrapForm.email.trim() || !bootstrapForm.phone.trim() || !bootstrapForm.password.trim()) {
      toast.error("All fields are required");
      return;
    }
    setActionLoading(true);
    try {
      const payload = {
        ...bootstrapForm,
        role: "SUPERADMIN"
      };
      await axios.post("/api/admin/users", payload);
      toast.success("SUPERADMIN bootstrap account created successfully!");
      setBootstrapForm({ name: "", email: "", phone: "", password: "" });
    } catch (error: any) {
      const errMsg = error.response?.data?.message || "Failed to bootstrap Superadmin";
      toast.error(errMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPERADMIN":
        return <span className="px-3 py-1.5 rounded-full text-xs font-black bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800/30 tracking-wider">SUPERADMIN</span>;
      case "ADMIN":
        return <span className="px-3 py-1.5 rounded-full text-xs font-black bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800/30 tracking-wider">ADMIN</span>;
      case "USER":
        return <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/30">STUDENT</span>;
      default:
        return <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{role}</span>;
    }
  };

  if (loading) return <Loader />;

  // ────────────────────────────────────────────────────────
  // RENDER INTERFACE FOR REGULAR ADMIN (BOOTSTRAPPING ONLY)
  // ────────────────────────────────────────────────────────
  if (currentUser?.role !== "SUPERADMIN") {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <Shield className="text-indigo-600 dark:text-indigo-400" size={32} />
            Manage Admins
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">Configure administrator roles and system hierarchies.</p>
        </div>

        {/* Informative Banner */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-3xl p-6 sm:p-8 flex items-start gap-4 mb-8">
          <ShieldAlert className="text-amber-600 dark:text-amber-400 shrink-0 mt-1" size={24} />
          <div>
            <h2 className="text-lg font-black text-amber-900 dark:text-amber-300 uppercase tracking-wide mb-1">
              Bootstrap Access Enabled
            </h2>
            <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed font-medium">
              You are currently logged in as a regular <strong>ADMIN</strong>. Full listing of administrative accounts is restricted.
              However, to establish system ownership, you are temporarily authorized to bootstrap/create <strong>SUPERADMIN</strong> accounts.
            </p>
          </div>
        </div>

        {/* Bootstrap Creation Form */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800/80 rounded-[2.5rem] shadow-xl p-8 max-w-xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-[1.5rem] flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4 border border-indigo-100 dark:border-indigo-900/20 shadow-inner">
              <Plus size={28} />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Create Superadmin</h3>
            <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium">Deploy the first unrestricted master control account.</p>
          </div>

          <form onSubmit={handleBootstrapCreate} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5 ml-1">Full Name</label>
              <input 
                type="text"
                required
                value={bootstrapForm.name}
                onChange={(e) => setBootstrapForm({ ...bootstrapForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/10 focus:border-indigo-500 dark:focus:border-indigo-400 text-sm font-medium text-gray-900 dark:text-white outline-none transition-all"
                placeholder="e.g. Master Administrator"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5 ml-1">Email Address</label>
                <input 
                  type="email"
                  required
                  value={bootstrapForm.email}
                  onChange={(e) => setBootstrapForm({ ...bootstrapForm, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/10 focus:border-indigo-500 dark:focus:border-indigo-400 text-sm font-medium text-gray-900 dark:text-white outline-none transition-all"
                  placeholder="admin@sahan.so"
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5 ml-1">Phone Number</label>
                <input 
                  type="text"
                  required
                  value={bootstrapForm.phone}
                  onChange={(e) => setBootstrapForm({ ...bootstrapForm, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/10 focus:border-indigo-500 dark:focus:border-indigo-400 text-sm font-medium text-gray-900 dark:text-white outline-none transition-all"
                  placeholder="e.g. +25263..."
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5 ml-1">Master Password</label>
              <input 
                type="password"
                required
                value={bootstrapForm.password}
                onChange={(e) => setBootstrapForm({ ...bootstrapForm, password: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/10 focus:border-indigo-500 dark:focus:border-indigo-400 text-sm font-medium text-gray-900 dark:text-white outline-none transition-all"
                placeholder="Minimum 6 characters"
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 bg-indigo-600 dark:bg-indigo-500 text-white font-black text-xs uppercase tracking-widest py-4 px-6 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10 dark:shadow-indigo-950/20"
            >
              {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              {actionLoading ? "Deploying Superadmin..." : "Deploy Superadmin Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────
  // RENDER INTERFACE FOR SUPERADMIN (FULL MANAGEMENT CONTROL)
  // ────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-purple-600 dark:text-purple-400" size={32} />
            User Management
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">Master command panel for all platform accounts and credentials.</p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-xl shadow-lg shadow-purple-600/10 dark:shadow-none transition-all hover:-translate-y-0.5"
        >
          <Plus size={16} />
          Create User
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-purple-500" />
          <h2 className="font-bold text-gray-900 dark:text-white">Filter Parameters</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 text-sm font-medium"
            />
          </div>

          <select 
            value={roleFilter} 
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 text-sm font-bold text-gray-700 dark:text-slate-300"
          >
            <option value="ALL">All Roles</option>
            <option value="SUPERADMIN">Superadmins</option>
            <option value="ADMIN">Administrators</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-[2rem] shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">User Account</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Role</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400">Joined Date</th>
              <th className="p-5 text-xs font-black uppercase tracking-widest text-gray-500 dark:text-slate-400 text-right">Control Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-800/50">
            {paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">No users match your filters.</td>
              </tr>
            ) : (
              paginatedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold overflow-hidden border border-purple-200 dark:border-purple-800/30 flex-shrink-0">
                        <User size={18}/>
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white leading-snug">{u.name} {u.id === currentUser?.id && <span className="text-[10px] text-purple-500 bg-purple-100 dark:bg-purple-950/50 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">You</span>}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-400">{u.email} • {u.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-5">
                    {getRoleBadge(u.role)}
                  </td>
                  <td className="p-5">
                    <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
                      {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </td>
                  <td className="p-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleOpenEdit(u)}
                        className="inline-flex items-center justify-center bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 h-8 px-3 rounded-lg text-xs font-bold hover:bg-amber-600 hover:text-white transition-all"
                      >
                        <Edit size={14} className="mr-1" /> Edit
                      </button>

                      <button 
                        onClick={() => handleOpenDelete(u)}
                        disabled={u.id === currentUser?.id}
                        className="inline-flex items-center justify-center bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 h-8 px-3 rounded-lg text-xs font-bold hover:bg-red-600 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Trash2 size={14} className="mr-1" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900">
            <p className="text-sm text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of <span className="font-bold text-gray-900 dark:text-white">{filteredUsers.length}</span> users
            </p>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                &larr;
              </button>
              <span className="text-sm font-bold px-4">{currentPage} / {totalPages}</span>
              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-600 disabled:opacity-50 hover:bg-gray-50 transition-colors"
              >
                &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New User</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Deploy new administrator, superadmin, or student user.</p>
              </div>
              <button onClick={() => setIsCreateOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5">Full Name</label>
                <input 
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                  placeholder="Full Name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                    placeholder="name@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5">Phone Number</label>
                  <input 
                    type="text"
                    required
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                    placeholder="+252..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5">Default Password</label>
                <input 
                  type="password"
                  required
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                  placeholder="Minimum 6 characters"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5">Account Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 text-sm font-bold text-gray-800 dark:text-slate-200 outline-none"
                >
                  <option value="ADMIN">Administrator (ADMIN)</option>
                  <option value="SUPERADMIN">Superadmin (SUPERADMIN)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 -mx-6 -my-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all"
                >
                  {actionLoading && <Loader2 size={16} className="animate-spin" />}
                  Deploy User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit User Settings</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">Modify parameters or update security credentials.</p>
              </div>
              <button onClick={() => setIsEditOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5">Full Name</label>
                <input 
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5">Email Address</label>
                  <input 
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5">Phone Number</label>
                  <input 
                    type="text"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5">
                  Update Password <span className="text-gray-400 font-normal lowercase">(leave blank to keep current)</span>
                </label>
                <input 
                  type="password"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 text-sm font-medium text-gray-900 dark:text-white outline-none"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-gray-400 dark:text-slate-500 mb-1.5">Account Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  disabled={editingUser.id === currentUser?.id}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 focus:ring-2 focus:ring-purple-500 text-sm font-bold text-gray-800 dark:text-slate-200 outline-none disabled:opacity-50"
                >
                  <option value="ADMIN">Administrator (ADMIN)</option>
                  <option value="SUPERADMIN">Superadmin (SUPERADMIN)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 -mx-6 -my-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-slate-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl text-sm transition-all"
                >
                  {actionLoading && <Loader2 size={16} className="animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteOpen && deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-100 dark:border-slate-800 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-4 border border-red-200 dark:border-red-500/20 animate-bounce">
                <ShieldAlert size={28} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 uppercase tracking-tight">Delete User Account?</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 leading-relaxed font-medium">
                Are you sure you want to permanently remove <span className="font-extrabold text-gray-900 dark:text-white">{deletingUser.name}</span> ({deletingUser.email}) from the platform? This cannot be undone.
              </p>
              
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setIsDeleteOpen(false)}
                  className="px-5 py-2.5 text-sm font-bold text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-850 rounded-xl"
                >
                  No, Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  disabled={actionLoading}
                  className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-all"
                >
                  {actionLoading && <Loader2 size={16} className="animate-spin" />}
                  Confirm Deletion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
