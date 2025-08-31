"use client";

import { FileText, Clock, TrendingUp, Download, Calendar, Globe, AlertCircle, User } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userStats, setUserStats] = useState<any>({
    minutesUsed: 0,
    minutesLimit: 30,
    plan: "free",
    transcriptions: 0
  });
  const [recentFiles, setRecentFiles] = useState<any[]>([]);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
      return;
    }

    // Get user data from session
    const userData = session.user as any;
    setUserStats({
      minutesUsed: userData?.minutesUsed || 0,
      minutesLimit: userData?.minutesLimit || 30,
      plan: userData?.plan || "free",
      transcriptions: userData?.transcriptions || 0
    });

    // Get recent files from localStorage
    const stored = localStorage.getItem('recentTranscriptions');
    if (stored) {
      try {
        setRecentFiles(JSON.parse(stored));
      } catch (e) {
        setRecentFiles([]);
      }
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const daysUntilReset = Math.max(0, 30 - new Date().getDate());
  const usagePercentage = (userStats.minutesUsed / userStats.minutesLimit) * 100;

  const stats = [
    {
      icon: <FileText className="w-6 h-6" />,
      label: "Total Transcriptions",
      value: userStats.transcriptions.toString(),
      change: "This month",
      trend: "neutral"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: "Minutes Used",
      value: userStats.minutesUsed.toString(),
      change: `of ${userStats.minutesLimit}`,
      trend: usagePercentage > 80 ? "down" : "up"
    },
    {
      icon: <User className="w-6 h-6" />,
      label: "Current Plan",
      value: userStats.plan.toUpperCase(),
      change: "Active",
      trend: "neutral"
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      label: "Days Until Reset",
      value: daysUntilReset.toString(),
      change: "days left",
      trend: "neutral"
    }
  ];

  const displayFiles = recentFiles.length > 0 ? recentFiles : [
    {
      name: "No transcriptions yet",
      date: new Date().toISOString().split('T')[0],
      duration: "00:00",
      language: "—",
      status: "pending"
    }
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back, {session.user?.name || session.user?.email?.split('@')[0]}! Here&apos;s your activity overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white">
                  {stat.icon}
                </div>
                <span
                  className={`text-sm font-medium ${
                    stat.trend === "up"
                      ? "text-green-500"
                      : stat.trend === "down"
                      ? "text-red-500"
                      : "text-gray-500"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-1">{stat.value}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Files */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recent Transcriptions</h2>
                <Link
                  href="/transcribe"
                  className="text-blue-500 hover:text-blue-600 font-medium"
                >
                  New Transcription
                </Link>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-600 dark:text-gray-400 border-b dark:border-gray-700">
                      <th className="pb-3">File Name</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Duration</th>
                      <th className="pb-3">Language</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayFiles.slice(0, 5).map((file, index) => (
                      <tr
                        key={index}
                        className="border-b dark:border-gray-700 last:border-0"
                      >
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{file.name}</span>
                          </div>
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">
                          {file.date}
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">
                          {file.duration}
                        </td>
                        <td className="py-3 text-gray-600 dark:text-gray-400">
                          {file.language}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              file.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                                : file.name === "No transcriptions yet"
                                ? "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                          >
                            {file.status === "pending" && file.name === "No transcriptions yet" ? "—" : file.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Usage & Quick Actions */}
          <div className="space-y-6">
            {/* Usage Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Monthly Usage</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">
                    {userStats.minutesUsed} / {userStats.minutesLimit} minutes
                  </span>
                  <span className="font-medium">{Math.min(usagePercentage, 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      usagePercentage > 80
                        ? "bg-gradient-to-r from-red-500 to-orange-500"
                        : usagePercentage > 50
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                        : "bg-gradient-to-r from-blue-500 to-purple-600"
                    }`}
                    style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                  />
                </div>
              </div>
              
              {usagePercentage > 80 && (
                <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      You&apos;ve used {usagePercentage.toFixed(0)}% of your monthly limit.
                    </p>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Resets in {daysUntilReset} days
              </p>
              
              {userStats.plan === "free" && (
                <Link
                  href="/pricing"
                  className="block w-full text-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                >
                  Upgrade Plan
                </Link>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/transcribe"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">New Transcription</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Start a new transcription
                    </p>
                  </div>
                </Link>
                
                <Link
                  href="/pricing"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium">View Plans</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Upgrade for more features
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Account Details</h3>
              <div className="space-y-2 text-sm opacity-90">
                <p>Email: {session.user?.email}</p>
                <p>Plan: {userStats.plan.toUpperCase()}</p>
                <p>Member since: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}