"use client";

import { User, CreditCard, Bell, Shield, Globe, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
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

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "billing", label: "Billing", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Globe },
  ];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? "text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400"
                    : "text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {activeTab === "account" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    value={session.user?.name || ""}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    readOnly
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <input
                    type="email"
                    value={session.user?.email || ""}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                    readOnly
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Current Plan</label>
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="font-semibold">Free Plan</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">120 minutes per month (2 hours)</p>
                  </div>
                  <button 
                    onClick={() => router.push('/pricing')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Upgrade
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Billing & Subscription</h2>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-blue-700 dark:text-blue-300">
                  You are currently on the Free plan. Upgrade to access more features and transcription minutes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Payment Methods</h3>
                <p className="text-gray-600 dark:text-gray-400">No payment methods on file</p>
                <button 
                  onClick={() => router.push('/checkout?plan=pro')}
                  className="mt-3 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Add Payment Method
                </button>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Billing History</h3>
                <p className="text-gray-600 dark:text-gray-400">No billing history available</p>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Receive updates about your transcriptions</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Usage Alerts</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Get notified when reaching usage limits</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" defaultChecked />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Marketing Emails</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Updates about new features and offers</p>
                  </div>
                  <input type="checkbox" className="w-5 h-5" />
                </label>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Security Settings</h2>
              
              <div>
                <h3 className="font-semibold mb-3">Change Password</h3>
                <button className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                  Update Password
                </button>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Two-Factor Authentication</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-3">Add an extra layer of security to your account</p>
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
                  Enable 2FA
                </button>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Active Sessions</h3>
                <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p className="font-medium">Current Session</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Last active: Just now</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold mb-4">Preferences</h2>
              
              <div>
                <label className="block text-sm font-medium mb-2">Default Language</label>
                <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <option>Portuguese (Brazil)</option>
                  <option>English</option>
                  <option>Spanish</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Time Zone</label>
                <select className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900">
                  <option>America/Sao_Paulo (BRT)</option>
                  <option>America/New_York (EST)</option>
                  <option>Europe/London (GMT)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Theme</label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      if (theme === 'dark') toggleTheme();
                    }}
                    className={`px-4 py-2 border rounded-lg transition-all flex items-center gap-2 ${
                      theme === 'light' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                    Light
                  </button>
                  <button 
                    onClick={() => {
                      if (theme === 'light') toggleTheme();
                    }}
                    className={`px-4 py-2 border rounded-lg transition-all flex items-center gap-2 ${
                      theme === 'dark' 
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                        : 'border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                    Dark
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}