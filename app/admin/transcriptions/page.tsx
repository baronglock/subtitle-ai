"use client";

import { useEffect, useState } from "react";
import { 
  FileText, 
  Clock, 
  User, 
  Globe,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  DollarSign
} from "lucide-react";

export default function AdminTranscriptionsPage() {
  const [transcriptions, setTranscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTranscription, setSelectedTranscription] = useState<any>(null);
  const [filterUser, setFilterUser] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [timeRange, setTimeRange] = useState("24h");

  useEffect(() => {
    fetchTranscriptions();
    // Auto-refresh every minute
    const interval = setInterval(fetchTranscriptions, 60000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const fetchTranscriptions = async () => {
    try {
      const response = await fetch(`/api/admin/transcriptions?range=${timeRange}`);
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setTranscriptions(data.transcriptions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredTranscriptions = transcriptions.filter(trans => {
    let matches = true;
    
    if (filterUser) {
      matches = matches && (
        trans.userEmail?.toLowerCase().includes(filterUser.toLowerCase()) ||
        trans.userId?.includes(filterUser)
      );
    }
    
    if (filterLanguage !== "all") {
      matches = matches && trans.language === filterLanguage;
    }
    
    return matches;
  });

  const totalMinutes = filteredTranscriptions.reduce((sum, trans) => 
    sum + (trans.duration || 0), 0
  );
  
  const totalCost = filteredTranscriptions.reduce((sum, trans) => 
    sum + (trans.cost || 0), 0
  );

  const languages = [...new Set(transcriptions.map(t => t.language).filter(Boolean))];

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
        <h2 className="text-3xl font-bold">Transcriptions History</h2>
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => {
              setTimeRange(e.target.value);
              setLoading(true);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
          </select>
          <button
            onClick={() => {
              setLoading(true);
              fetchTranscriptions();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Transcriptions</p>
              <p className="text-2xl font-bold">{filteredTranscriptions.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Minutes</p>
              <p className="text-2xl font-bold">{totalMinutes.toFixed(1)}</p>
            </div>
            <Clock className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Unique Users</p>
              <p className="text-2xl font-bold">
                {[...new Set(transcriptions.map(t => t.userId))].length}
              </p>
            </div>
            <User className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Cost</p>
              <p className="text-2xl font-bold">R$ {totalCost.toFixed(2)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search by user email or ID..."
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          />
          
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          >
            <option value="all">All Languages</option>
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Transcriptions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  File
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Language
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTranscriptions.map((trans) => (
                <tr key={trans.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{new Date(trans.createdAt).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium">{trans.userEmail}</p>
                      <p className="text-xs text-gray-500 font-mono">ID: {trans.userId?.slice(0, 8)}...</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{trans.fileName || 'Unknown'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span>{trans.duration?.toFixed(1)} min</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span>{trans.language || 'auto'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                      trans.status === 'completed' 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                        : trans.status === 'processing'
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                        : trans.status === 'failed'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                    }`}>
                      {trans.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    R$ {(trans.cost || 0).toFixed(2)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedTranscription(trans)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transcription Details Modal */}
      {selectedTranscription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Transcription Details</h3>
              <button
                onClick={() => setSelectedTranscription(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">User</p>
                <p className="font-medium">{selectedTranscription.userEmail}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">File</p>
                <p className="font-medium">{selectedTranscription.fileName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Duration</p>
                <p className="font-medium">{selectedTranscription.duration?.toFixed(1)} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Language</p>
                <p className="font-medium">{selectedTranscription.language}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-medium">{selectedTranscription.status}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Cost</p>
                <p className="font-medium">R$ {selectedTranscription.cost?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created At</p>
                <p className="font-medium">{new Date(selectedTranscription.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Transcription ID</p>
                <p className="font-mono text-xs">{selectedTranscription.id}</p>
              </div>
            </div>
            
            {selectedTranscription.content && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold">Transcription Content (Preview)</h4>
                  <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                    <Download className="w-4 h-4" />
                    Export
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 max-h-60 overflow-y-auto">
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedTranscription.content?.substring(0, 500)}
                    {selectedTranscription.content?.length > 500 && '...'}
                  </p>
                </div>
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedTranscription(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}