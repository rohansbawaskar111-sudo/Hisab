import React, { useState, useEffect } from 'react';
import {
  Shield,
  Users,
  Heart,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Check,
  X,
  Eye,
  RotateCcw,
} from 'lucide-react';
import { AdminStats, Report, VerificationRequest } from '../types';
import { api } from '../api/client';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'verifications' | 'users'>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, rep, ver, usr] = await Promise.all([
        api.getAdminStats(),
        api.getAdminReports(),
        api.getAdminVerifications(),
        api.getAdminUsers(),
      ]);
      setStats(s);
      setReports(rep);
      setVerifications(ver);
      setUsersList(usr);
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveReport = async (reportId: string, action: string) => {
    try {
      await api.resolveAdminReport(reportId, action);
      setActionMessage(`Report resolved: ${action}`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to resolve report');
    }
  };

  const handleResolveVerification = async (
    verifId: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      await api.resolveAdminVerification(verifId, status);
      setActionMessage(`Verification ${status} successfully!`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to resolve verification');
    }
  };

  const handleUserAction = async (userId: string, action: string) => {
    const reason = window.prompt(`Enter reason for ${action}:`, 'Violation of community terms');
    if (!reason) return;

    try {
      await api.takeAdminUserAction(userId, action, reason);
      setActionMessage(`User action executed: ${action}`);
      setTimeout(() => setActionMessage(null), 3000);
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed user action');
    }
  };

  const handleResetData = async () => {
    if (
      !window.confirm(
        'Reset database to initial demo profiles and seed data? All custom test data will be refreshed.'
      )
    ) {
      return;
    }

    try {
      await api.resetData();
      alert('Database reset to initial demo seeds successfully!');
      loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to reset seed data');
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.profile?.firstName?.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div id="admin-dashboard-container" className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6 text-white pb-24">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#141926] p-5 rounded-3xl border border-white/10 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-rose-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">VibeMatch Admin & Safety Center</h1>
            <p className="text-xs text-gray-400">Content moderation, trust review, and member operations</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-colors border border-white/5"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            id="btn-admin-reset-data"
            onClick={handleResetData}
            className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo Seed Data</span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs text-center font-medium animate-fade-in">
          {actionMessage}
        </div>
      )}

      {/* Metrics Row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-4 rounded-2xl bg-[#151A26] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs">Members</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.totalUsers}</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#151A26] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs">Matches</span>
              <Heart className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.matches}</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#151A26] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs">Messages</span>
              <MessageSquare className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.messages}</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#151A26] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs">Reports</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-amber-400">{stats.pendingReports}</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#151A26] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs">Verification</span>
              <CheckCircle2 className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-bold text-sky-400">{stats.verificationRequests}</div>
          </div>

          <div className="p-4 rounded-2xl bg-[#151A26] border border-white/5 space-y-1">
            <div className="flex items-center justify-between text-gray-400">
              <span className="text-xs">Banned</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-rose-400">{stats.bannedUsers}</div>
          </div>
        </div>
      )}

      {/* Internal Navigation Tabs */}
      <div className="flex p-1 bg-[#151A26] rounded-2xl border border-white/5 max-w-md gap-1 text-xs">
        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'reports' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          Reports Queue ({reports.filter((r) => r.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('verifications')}
          className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'verifications' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          Verifications ({verifications.filter((v) => v.status === 'pending').length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 rounded-xl font-medium transition-all ${
            activeTab === 'users' ? 'bg-rose-500 text-white shadow-md' : 'text-gray-400 hover:text-white'
          }`}
        >
          User Accounts ({usersList.length})
        </button>
      </div>

      {/* TAB: Reports Moderation */}
      {activeTab === 'reports' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Member Flagged Reports</h3>
          {reports.length === 0 ? (
            <div className="p-8 text-center text-gray-400 bg-[#151A26] rounded-2xl border border-white/5">
              No reports submitted yet. Everything is clean!
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div
                  key={report.id}
                  className={`p-4 rounded-2xl border ${
                    report.status === 'pending'
                      ? 'bg-[#181E2C] border-rose-500/30'
                      : 'bg-[#121622] border-white/5 opacity-70'
                  } space-y-3`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold">
                        {report.reason}
                      </span>
                      <span className="text-xs text-gray-400">
                        Target: <strong className="text-white">{report.reportedUserName || report.reportedUserId}</strong>
                      </span>
                      <span className="text-xs text-gray-500">• Reported by: {report.reporterName || report.reporterId}</span>
                    </div>

                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full capitalize font-semibold ${
                        report.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {report.status}
                    </span>
                  </div>

                  {report.details && (
                    <p className="text-xs text-gray-300 bg-black/30 p-2.5 rounded-xl border border-white/5">
                      "{report.details}"
                    </p>
                  )}

                  {report.status === 'pending' && (
                    <div className="flex flex-wrap gap-2 pt-1 border-t border-white/5">
                      <button
                        onClick={() => handleResolveReport(report.id, 'Warned user for policy breach')}
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-medium"
                      >
                        Issue Warning
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, 'User account suspended for 7 days')}
                        className="px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-300 hover:bg-orange-500/30 text-xs font-medium"
                      >
                        Suspend User
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, 'User permanently banned for severe violation')}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-medium"
                      >
                        Ban User
                      </button>
                      <button
                        onClick={() => handleResolveReport(report.id, 'Reviewed and dismissed: No violation found')}
                        className="px-3 py-1.5 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 text-xs font-medium"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  {report.actionTaken && (
                    <p className="text-[11px] text-gray-400">Resolution: {report.actionTaken}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: Photo Verification */}
      {activeTab === 'verifications' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Selfie Verification Queue</h3>
          {verifications.length === 0 ? (
            <div className="p-8 text-center text-gray-400 bg-[#151A26] rounded-2xl border border-white/5">
              No verification requests in queue.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verifications.map((v) => (
                <div
                  key={v.id}
                  className="p-4 rounded-2xl bg-[#181E2C] border border-white/10 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{v.userName || 'User'}</h4>
                      <p className="text-xs text-gray-400">{v.userEmail}</p>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-semibold ${
                        v.status === 'pending'
                          ? 'bg-amber-500/20 text-amber-300'
                          : v.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  <div className="text-xs text-sky-300 bg-sky-500/10 p-2 rounded-xl border border-sky-500/20">
                    Requested pose challenge: <strong>{v.poseType}</strong>
                  </div>

                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-black border border-white/10">
                    <img src={v.selfieUrl} alt="Verification Selfie" className="w-full h-full object-cover" />
                  </div>

                  {v.status === 'pending' && (
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleResolveVerification(v.id, 'approved')}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Grant Badge</span>
                      </button>
                      <button
                        onClick={() => handleResolveVerification(v.id, 'rejected')}
                        className="flex-1 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: User Management */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-gray-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 bg-[#151A26] rounded-xl border border-white/10 text-white text-xs focus:outline-none focus:border-rose-500"
              />
            </div>
            <span className="text-xs text-gray-400">{filteredUsers.length} accounts found</span>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#151A26]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#1C2333] text-gray-400 border-b border-white/5">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Verified</th>
                  <th className="p-3 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-white/5">
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={
                            u.profile?.photos?.[0]?.url ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                          }
                          alt=""
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-semibold text-white">
                            {u.profile?.firstName || 'No name'}
                          </div>
                          <div className="text-[10px] text-gray-400">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-mono text-[10px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.isBanned ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px]">
                          BANNED
                        </span>
                      ) : u.isSuspended ? (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                          SUSPENDED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-medium text-[10px]">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {u.isVerified ? (
                        <span className="text-sky-400 font-semibold">✓ Verified</span>
                      ) : (
                        <span className="text-gray-500">Unverified</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {u.role !== 'admin' && (
                        <div className="flex items-center justify-end gap-1.5">
                          {u.isBanned || u.isSuspended ? (
                            <button
                              onClick={() => handleUserAction(u.id, 'restore')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-medium text-[11px]"
                            >
                              Restore
                            </button>
                          ) : (
                            <>
                              <button
                                onClick={() => handleUserAction(u.id, 'warn')}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-medium text-[11px]"
                              >
                                Warn
                              </button>
                              <button
                                onClick={() => handleUserAction(u.id, 'suspend')}
                                className="px-2.5 py-1 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 font-medium text-[11px]"
                              >
                                Suspend
                              </button>
                              <button
                                onClick={() => handleUserAction(u.id, 'ban')}
                                className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium text-[11px]"
                              >
                                Ban
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
