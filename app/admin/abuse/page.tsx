"use client";

import { useEffect, useState } from "react";
import { 
  AlertTriangle,
  Shield,
  Ban,
  Eye,
  RefreshCw,
  User,
  Clock,
  MapPin,
  Activity
} from "lucide-react";

export default function AdminAbusePage() {
  const [abuseData, setAbuseData] = useState<any>({
    ipAbuse: [],
    rateLimitViolations: [],
    suspiciousPatterns: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedIP, setSelectedIP] = useState<any>(null);
  const [blockedIPs, setBlockedIPs] = useState<string[]>([]);

  useEffect(() => {
    fetchAbuseData();
    // Refresh every 2 minutes
    const interval = setInterval(fetchAbuseData, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchAbuseData = async () => {
    try {
      const response = await fetch("/api/admin/abuse");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setAbuseData(data);
      setBlockedIPs(data.blockedIPs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const blockIP = async (ip: string) => {
    try {
      const response = await fetch("/api/admin/abuse/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ip, action: "block" }),
      });
      
      if (!response.ok) throw new Error("Failed to block IP");
      
      setBlockedIPs([...blockedIPs, ip]);
      alert(`IP ${ip} has been blocked`);
      await fetchAbuseData();
    } catch (err) {
      console.error("Failed to block IP:", err);
      alert("Failed to block IP");
    }
  };

  const unblockIP = async (ip: string) => {
    try {
      const response = await fetch("/api/admin/abuse/block", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ip, action: "unblock" }),
      });
      
      if (!response.ok) throw new Error("Failed to unblock IP");
      
      setBlockedIPs(blockedIPs.filter(blockedIp => blockedIp !== ip));
      alert(`IP ${ip} has been unblocked`);
      await fetchAbuseData();
    } catch (err) {
      console.error("Failed to unblock IP:", err);
      alert("Failed to unblock IP");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Abuse Detection</h2>
        <button
          onClick={() => {
            setLoading(true);
            fetchAbuseData();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Alert Banner */}
      {abuseData.ipAbuse?.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200">
                Potential Abuse Detected
              </h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {abuseData.ipAbuse.length} IP addresses have multiple free accounts. Review and take action as needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Suspicious IPs</p>
              <p className="text-3xl font-bold mt-1">{abuseData.ipAbuse?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Multiple free accounts</p>
            </div>
            <MapPin className="w-8 h-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Blocked IPs</p>
              <p className="text-3xl font-bold mt-1">{blockedIPs.length}</p>
              <p className="text-xs text-gray-500 mt-1">Currently blocked</p>
            </div>
            <Ban className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rate Limit Hits</p>
              <p className="text-3xl font-bold mt-1">{abuseData.rateLimitViolations?.length || 0}</p>
              <p className="text-xs text-gray-500 mt-1">Last 24 hours</p>
            </div>
            <Activity className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* IP Abuse Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">IP Address Analysis</h3>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3">IP Address</th>
                  <th className="pb-3">Free Accounts</th>
                  <th className="pb-3">Total Usage</th>
                  <th className="pb-3">Last Activity</th>
                  <th className="pb-3">Risk Level</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {abuseData.ipAbuse?.map((abuse: any) => (
                  <tr key={abuse.ip} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm">{abuse.ip}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-semibold">{abuse.accounts}</p>
                        <p className="text-xs text-gray-500">accounts</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="text-sm">{abuse.totalMinutes?.toFixed(1) || 0} min</p>
                        <p className="text-xs text-gray-500">{abuse.totalTranscriptions || 0} transcriptions</p>
                      </div>
                    </td>
                    <td className="py-3 text-sm">
                      {abuse.lastActivity 
                        ? new Date(abuse.lastActivity).toLocaleDateString()
                        : 'Unknown'
                      }
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                        abuse.accounts > 5 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                          : abuse.accounts > 3
                          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600'
                          : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                      }`}>
                        {abuse.accounts > 5 ? 'High' : abuse.accounts > 3 ? 'Medium' : 'Low'}
                      </span>
                    </td>
                    <td className="py-3">
                      {blockedIPs.includes(abuse.ip) ? (
                        <span className="inline-flex px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full">
                          Blocked
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-600 rounded-full">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedIP(abuse)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {blockedIPs.includes(abuse.ip) ? (
                          <button
                            onClick={() => unblockIP(abuse.ip)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => blockIP(abuse.ip)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Suspicious Patterns */}
      {abuseData.suspiciousPatterns?.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold">Suspicious Patterns Detected</h3>
          </div>
          <div className="p-6 space-y-3">
            {abuseData.suspiciousPatterns.map((pattern: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">{pattern.type}</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">{pattern.description}</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                    Detected: {new Date(pattern.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IP Details Modal */}
      {selectedIP && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">IP Address Details</h3>
              <button
                onClick={() => setSelectedIP(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">IP Address</p>
                  <p className="font-mono font-medium">{selectedIP.ip}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">
                    {blockedIPs.includes(selectedIP.ip) ? 'Blocked' : 'Active'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Free Accounts</p>
                  <p className="font-medium">{selectedIP.accounts}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Usage</p>
                  <p className="font-medium">{selectedIP.totalMinutes?.toFixed(1) || 0} minutes</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Associated Email Accounts</h4>
                <div className="space-y-2">
                  {selectedIP.emails?.map((email: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{email}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedIP(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
                {blockedIPs.includes(selectedIP.ip) ? (
                  <button
                    onClick={() => {
                      unblockIP(selectedIP.ip);
                      setSelectedIP(null);
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    Unblock IP
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      blockIP(selectedIP.ip);
                      setSelectedIP(null);
                    }}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    Block IP
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}