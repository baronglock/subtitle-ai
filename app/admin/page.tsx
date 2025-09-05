"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  DollarSign, 
  Clock, 
  Activity,
  TrendingUp,
  AlertCircle,
  FileText,
  CreditCard
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) {
        throw new Error("Failed to fetch stats");
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err) {
      setError("Failed to load statistics");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">Admin Dashboard</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Users</p>
              <p className="text-2xl font-bold mt-1">{stats?.stats?.totalUsers || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.stats?.activeToday || 0} active today
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Revenue</p>
              <p className="text-2xl font-bold mt-1">
                R$ {(stats?.stats?.totalRevenue || 0).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total earnings</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Minutes Used</p>
              <p className="text-2xl font-bold mt-1">
                {Math.round(stats?.stats?.totalMinutesUsed || 0)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total transcribed</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Plan Distribution</p>
              <div className="text-xs mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Free:</span>
                  <span className="font-semibold">{stats?.stats?.freeUsers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pro:</span>
                  <span className="font-semibold">{stats?.stats?.proUsers || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium:</span>
                  <span className="font-semibold">{stats?.stats?.premiumUsers || 0}</span>
                </div>
              </div>
            </div>
            <CreditCard className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Abuse Detection Alert */}
      {stats?.stats?.ipAbuseDetected?.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Potential Abuse Detected
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {stats.stats.ipAbuseDetected.length} IP addresses have more than 2 free accounts
              </p>
              <div className="mt-3 space-y-2">
                {stats.stats.ipAbuseDetected.slice(0, 3).map((abuse: any, idx: number) => (
                  <div key={idx} className="text-xs bg-white dark:bg-gray-800 rounded p-2">
                    <span className="font-mono">{abuse.ip}</span>
                    <span className="ml-2">→ {abuse.accounts} accounts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Users */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Recent Users</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 dark:text-gray-400">
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Minutes Used</th>
                  <th className="pb-3">Last Active</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.users?.slice(0, 10).map((user: any) => (
                  <tr key={user.id} className="border-t border-gray-200 dark:border-gray-700">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-xs text-gray-500">{user.name}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        user.plan === 'free' 
                          ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          : user.plan === 'pro'
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      }`}>
                        {user.plan}
                      </span>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="text-sm">{user.minutesUsed} / {user.planMinutes}</p>
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-blue-500 h-1.5 rounded-full"
                            style={{ width: `${Math.min(100, (user.minutesUsed / user.planMinutes) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-sm">
                      {user.lastActive 
                        ? new Date(user.lastActive).toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        new Date(user.lastActive || 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {new Date(user.lastActive || 0) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                          ? 'Active'
                          : 'Inactive'
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Transcriptions */}
      {stats?.stats?.recentTranscriptions?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">Recent Transcriptions (24h)</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {stats.stats.recentTranscriptions.slice(0, 5).map((trans: any) => (
                <div key={trans.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{trans.fileName}</p>
                    <p className="text-xs text-gray-500">
                      {trans.userEmail} • {trans.duration} min • {trans.language}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {new Date(trans.createdAt).toLocaleString()}
                    </p>
                    <p className={`text-xs font-semibold ${
                      trans.status === 'completed' ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      {trans.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}