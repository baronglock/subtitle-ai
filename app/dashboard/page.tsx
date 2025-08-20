"use client";

import { FileText, Clock, TrendingUp, Download, Calendar, Globe } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  // Mock data - in production, this would come from your database
  const stats = [
    {
      icon: <FileText className="w-6 h-6" />,
      label: "Total Transcriptions",
      value: "127",
      change: "+12%",
      trend: "up"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      label: "Minutes Processed",
      value: "2,847",
      change: "+28%",
      trend: "up"
    },
    {
      icon: <Download className="w-6 h-6" />,
      label: "Files Downloaded",
      value: "98",
      change: "+5%",
      trend: "up"
    },
    {
      icon: <Globe className="w-6 h-6" />,
      label: "Languages Used",
      value: "12",
      change: "0%",
      trend: "neutral"
    }
  ];

  const recentFiles = [
    {
      name: "podcast-episode-45.mp3",
      date: "2024-01-15",
      duration: "45:32",
      language: "English",
      status: "completed"
    },
    {
      name: "interview-client.wav",
      date: "2024-01-14",
      duration: "23:15",
      language: "Spanish",
      status: "completed"
    },
    {
      name: "meeting-notes.mp4",
      date: "2024-01-14",
      duration: "67:48",
      language: "English",
      status: "completed"
    },
    {
      name: "lecture-recording.m4a",
      date: "2024-01-13",
      duration: "92:10",
      language: "French",
      status: "completed"
    },
    {
      name: "webinar-2024.webm",
      date: "2024-01-12",
      duration: "55:22",
      language: "German",
      status: "processing"
    }
  ];

  const usageData = {
    used: 847,
    total: 3000,
    percentage: 28.2
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Welcome back! Here's your transcription activity overview.
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
                    {recentFiles.map((file, index) => (
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
                                : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                            }`}
                          >
                            {file.status}
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
                    {usageData.used} / {usageData.total} minutes
                  </span>
                  <span className="font-medium">{usageData.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
                    style={{ width: `${usageData.percentage}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Resets in 15 days
              </p>
              <Link
                href="/pricing"
                className="block w-full text-center mt-4 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
              >
                Upgrade Plan
              </Link>
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
                  href="/settings"
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="font-medium">Billing History</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      View past invoices
                    </p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Pro Tip</h3>
              <p className="text-sm opacity-90 mb-3">
                Upload multiple files at once to save time. Our bulk processing
                feature can handle up to 10 files simultaneously.
              </p>
              <button className="text-sm font-medium underline">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}