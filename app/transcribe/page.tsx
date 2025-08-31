"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  FileAudio, 
  Download, 
  Globe, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Languages,
  Sparkles,
  Zap,
  FileText,
  ChevronRight,
  Eye,
  Copy,
  Check,
  Wand2,
  Cpu,
  Server,
  Shield,
  ArrowRight,
  FileVideo,
  Music,
  Mic,
  Volume2,
  Layers,
  Gauge,
  CloudUpload,
  Info,
  AlertCircle
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

const languages = [
  { code: "auto", name: "Auto-detect", flag: "🌐" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "pt-BR", name: "Portuguese (Brazil)", flag: "🇧🇷" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" }
];

const supportedFormats = [
  { ext: "mp3", icon: Music, color: "text-green-500" },
  { ext: "wav", icon: Volume2, color: "text-blue-500" },
  { ext: "mp4", icon: FileVideo, color: "text-purple-500" },
  { ext: "m4a", icon: FileAudio, color: "text-orange-500" },
  { ext: "webm", icon: Mic, color: "text-red-500" }
];

export default function TranscribePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [status_, setStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [transcription, setTranscription] = useState("");
  const [srtContent, setSrtContent] = useState("");
  const [translatedSrtContent, setTranslatedSrtContent] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [translationStatus, setTranslationStatus] = useState<"idle" | "translating" | "completed" | "error">("idle");
  const [selectedTranslationLang, setSelectedTranslationLang] = useState("");
  const [showSrtPreview, setShowSrtPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [processingInfo, setProcessingInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"transcription" | "subtitles" | "translation">("transcription");

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/login");
    }
  }, [session, status, router]);

  const userPlan = (session?.user as any)?.plan || "free";
  const isFreePlan = userPlan === "free";

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    setStatus("uploading");
    setStatusMessage("Preparing your file for processing...");
    setProgress(10);

    try {
      // Step 1: Get upload URL
      const uploadUrlResponse = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          filename: file.name, 
          contentType: file.type 
        }),
      });

      if (!uploadUrlResponse.ok) throw new Error("Failed to get upload URL");

      const { url } = await uploadUrlResponse.json();
      setStatusMessage("Uploading to secure cloud storage...");
      setProgress(30);

      // Step 2: Upload file to R2
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload file");

      setStatus("processing");
      setStatusMessage(isFreePlan 
        ? "Processing with Gemini 2.5 Flash-Lite..." 
        : "Processing with Gemini 2.5 Flash-Lite (Premium)..."
      );
      setProgress(60);

      // Step 3: Call transcription API
      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          sourceLanguage: sourceLanguage !== "auto" ? sourceLanguage : undefined,
        }),
      });

      if (!transcribeResponse.ok) {
        const error = await transcribeResponse.json();
        throw new Error(error.error || "Transcription failed");
      }

      const result = await transcribeResponse.json();
      
      setProgress(100);
      setStatus("completed");
      setStatusMessage("Transcription completed successfully!");
      
      // Handle response
      setTranscription(result.transcription || result.text || "");
      setSrtContent(result.srt || "");
      setDetectedLanguage(result.detected_language || result.language || "");
      setDuration(result.duration || 0);
      setProcessingInfo(result.processing_info);
      
      // Save to localStorage for dashboard
      const recentTranscriptions = JSON.parse(localStorage.getItem('recentTranscriptions') || '[]');
      recentTranscriptions.unshift({
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        duration: formatDuration(result.duration || 0),
        language: result.detected_language || "Unknown",
        status: "completed"
      });
      localStorage.setItem('recentTranscriptions', JSON.stringify(recentTranscriptions.slice(0, 10)));

    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "An error occurred");
      console.error("Transcription error:", error);
    }
  };

  const translateContent = async () => {
    if (!srtContent || !selectedTranslationLang) {
      alert("Please select a language for translation");
      return;
    }

    setTranslationStatus("translating");
    setStatusMessage(isFreePlan 
      ? "Translating with Google Translate..." 
      : "Translating with Gemini AI for premium quality..."
    );

    try {
      const response = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: srtContent,
          targetLanguage: selectedTranslationLang,
          sourceLanguage: detectedLanguage || sourceLanguage,
          format: "srt"
        }),
      });

      if (!response.ok) {
        throw new Error("Translation failed");
      }

      const result = await response.json();
      setTranslatedSrtContent(result.translatedText || result.srt);
      setTranslationStatus("completed");
      setStatusMessage("Translation completed with " + (isFreePlan ? "Google Translate" : "Gemini AI"));
      setActiveTab("translation");
    } catch (error) {
      setTranslationStatus("error");
      setStatusMessage("Translation failed. Please try again.");
      console.error("Translation error:", error);
    }
  };

  const downloadFile = (content: string, filename: string, extension: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const format = supportedFormats.find(f => f.ext === ext);
    return format || { icon: FileAudio, color: "text-gray-500" };
  };

  const resetForm = () => {
    setFile(null);
    setStatus("idle");
    setStatusMessage("");
    setTranscription("");
    setSrtContent("");
    setTranslatedSrtContent("");
    setDetectedLanguage("");
    setDuration(0);
    setProgress(0);
    setTranslationStatus("idle");
    setSelectedTranslationLang("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-mesh">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin text-indigo-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f0f23] gradient-mesh">
      {/* Premium Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/25">
                <Wand2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  AI Transcription Studio
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Powered by OpenAI Whisper Technology
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Plan Badge */}
              <div className={`px-4 py-2 rounded-xl ${
                isFreePlan 
                  ? 'bg-gray-100 dark:bg-gray-800' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg shadow-amber-500/25'
              }`}>
                <div className="flex items-center gap-2">
                  {isFreePlan ? (
                    <>
                      <Sparkles className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Free Plan</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">• Medium Model</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white">
                        {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
                      </span>
                      <span className="text-xs text-white/80">• Large-V2 GPU</span>
                    </>
                  )}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-green-500" />
                  <span className="text-xs text-gray-600 dark:text-gray-400">API Status</span>
                  <span className="text-xs font-medium text-green-500">Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Sidebar - Upload & Settings */}
          <div className="lg:col-span-4 space-y-6">
            {/* Upload Card */}
            <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden card-hover">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-1">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-t-2xl">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <CloudUpload className="w-5 h-5 text-indigo-500" />
                    Upload Media File
                  </h3>
                </div>
              </div>
              
              <div className="p-6">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 cursor-pointer ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 scale-[1.02]"
                      : file 
                      ? "border-green-500 bg-green-50 dark:bg-green-950/20"
                      : "border-gray-300 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }`}
                  onClick={() => !file && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept="audio/*,video/*"
                    className="hidden"
                    disabled={status_ !== "idle"}
                  />
                  
                  {file ? (
                    <div className="space-y-4 animate-fadeIn">
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/25`}>
                        {(() => {
                          const fileInfo = getFileIcon(file.name);
                          const Icon = fileInfo.icon;
                          return <Icon className="w-8 h-8 text-white" />;
                        })()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white text-lg">{file.name}</p>
                        <div className="flex items-center justify-center gap-4 mt-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatFileSize(file.size)}
                          </span>
                          <span className="text-sm text-gray-400">•</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {file.type || 'Unknown type'}
                          </span>
                        </div>
                      </div>
                      {status_ === "idle" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resetForm();
                          }}
                          className="text-red-500 hover:text-red-600 text-sm font-medium transition-colors"
                        >
                          Remove file
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                        <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 dark:text-gray-300 text-lg">
                          Drop your file here
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          or click to browse
                        </p>
                      </div>
                      
                      {/* Supported Formats */}
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {supportedFormats.map(format => (
                          <div key={format.ext} className="flex items-center gap-1 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <format.icon className={`w-3 h-3 ${format.color}`} />
                            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                              {format.ext.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Maximum file size: 500MB
                      </p>
                    </div>
                  )}
                  
                  {/* Progress Overlay */}
                  {(status_ === "uploading" || status_ === "processing") && (
                    <div className="absolute inset-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mx-auto mb-3" />
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {status_ === "uploading" ? "Uploading..." : "Processing..."}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {progress}% complete
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {file && status_ === "idle" && (
                  <button
                    onClick={handleSubmit}
                    className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 btn-glow"
                  >
                    <Zap className="w-5 h-5" />
                    Start AI Transcription
                  </button>
                )}
              </div>
            </div>

            {/* Language Settings */}
            <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 p-6 card-hover">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <Languages className="w-5 h-5 text-indigo-500" />
                Language Settings
              </h3>
              
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Source Language
              </label>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                disabled={status_ !== "idle"}
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-xl">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Auto-detect analyzes your audio to identify the language automatically for best results.
                  </p>
                </div>
              </div>
            </div>

            {/* Model Information */}
            <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 p-6 card-hover">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                <Cpu className="w-5 h-5 text-indigo-500" />
                AI Model Details
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Model</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {isFreePlan ? "Gemini 2.5 Flash-Lite" : "Gemini 2.5 Flash-Lite Pro"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Processing</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {isFreePlan ? "Standard" : "Priority GPU"}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Accuracy</span>
                  </div>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {isFreePlan ? "~90%" : "~99%"}
                  </span>
                </div>
              </div>

              {!isFreePlan && (
                <div className="mt-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 rounded-xl">
                  <div className="flex items-start gap-2">
                    <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">
                      Premium processing with 3x faster speed and enhanced accuracy
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">
            {/* Processing Status */}
            {status_ !== "idle" && (
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden animate-fadeIn">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Processing Status
                    </h3>
                    <div className="flex items-center gap-2">
                      {status_ === "uploading" || status_ === "processing" ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-950/30 rounded-full">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            In Progress
                          </span>
                        </div>
                      ) : status_ === "completed" ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-950/30 rounded-full">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            Completed
                          </span>
                        </div>
                      ) : status_ === "error" ? (
                        <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-950/30 rounded-full">
                          <XCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium text-red-700 dark:text-red-300">
                            Error
                          </span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-4">{statusMessage}</p>
                  
                  {(status_ === "uploading" || status_ === "processing") && (
                    <div className="space-y-2">
                      <div className="relative">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out relative shimmer"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Progress</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">{progress}%</span>
                      </div>
                    </div>
                  )}

                  {status_ === "completed" && detectedLanguage && (
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Globe className="w-4 h-4 text-blue-500" />
                          <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Detected Language</span>
                        </div>
                        <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                          {detectedLanguage}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-purple-500" />
                          <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Duration</span>
                        </div>
                        <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                          {formatDuration(duration)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Results Section */}
            {status_ === "completed" && transcription && (
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden animate-fadeIn">
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-800">
                  <div className="flex">
                    {[
                      { id: "transcription", label: "Transcription", icon: FileText },
                      { id: "subtitles", label: "Subtitles (SRT)", icon: Layers },
                      { id: "translation", label: "Translation", icon: Globe }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-1 px-6 py-4 font-medium text-sm transition-all relative ${
                          activeTab === tab.id
                            ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30"
                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        }`}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <tab.icon className="w-4 h-4" />
                          {tab.label}
                          {tab.id === "translation" && translatedSrtContent && (
                            <span className="ml-2 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                              Ready
                            </span>
                          )}
                        </div>
                        {activeTab === tab.id && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  {/* Transcription Tab */}
                  {activeTab === "transcription" && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Full Transcription
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(transcription)}
                            className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                            title="Copy to clipboard"
                          >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                          </button>
                          <button
                            onClick={() => downloadFile(transcription, file?.name?.replace(/\.[^/.]+$/, "") || "transcript", "txt")}
                            className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                            title="Download text"
                          >
                            <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 max-h-96 overflow-y-auto">
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {transcription}
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => downloadFile(transcription, file?.name?.replace(/\.[^/.]+$/, "") || "transcript", "txt")}
                          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Download TXT
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Subtitles Tab */}
                  {activeTab === "subtitles" && (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          SRT Subtitles
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(srtContent)}
                            className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                            title="Copy to clipboard"
                          >
                            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                          </button>
                          <button
                            onClick={() => downloadFile(srtContent, file?.name?.replace(/\.[^/.]+$/, "") || "subtitle", "srt")}
                            className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                            title="Download SRT"
                          >
                            <Download className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 max-h-96 overflow-y-auto">
                        <pre className="text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {srtContent}
                        </pre>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={() => downloadFile(srtContent, file?.name?.replace(/\.[^/.]+$/, "") || "subtitle", "srt")}
                          className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all"
                        >
                          <FileText className="w-4 h-4" />
                          Download SRT
                        </button>
                        <button
                          onClick={() => {
                            setPreviewContent(srtContent);
                            setPreviewTitle("SRT Preview");
                            setShowSrtPreview(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-all"
                        >
                          <Eye className="w-4 h-4" />
                          Full Preview
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Translation Tab */}
                  {activeTab === "translation" && (
                    <div className="space-y-4 animate-fadeIn">
                      {!translatedSrtContent ? (
                        <div className="text-center py-12">
                          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 mb-4">
                            <Languages className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Translate Your Subtitles
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            {isFreePlan 
                              ? "Translate your subtitles to any language using Google Translate"
                              : "Get premium quality translations powered by Gemini AI with context awareness"
                            }
                          </p>
                          
                          <div className="max-w-sm mx-auto space-y-4">
                            <select
                              value={selectedTranslationLang}
                              onChange={(e) => setSelectedTranslationLang(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            >
                              <option value="">Select target language</option>
                              {languages.filter(l => l.code !== "auto" && l.code !== detectedLanguage).map((lang) => (
                                <option key={lang.code} value={lang.code}>
                                  {lang.flag} {lang.name}
                                </option>
                              ))}
                            </select>
                            
                            <button
                              onClick={translateContent}
                              disabled={!selectedTranslationLang || translationStatus === "translating"}
                              className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {translationStatus === "translating" ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  Translating...
                                </>
                              ) : (
                                <>
                                  <Languages className="w-5 h-5" />
                                  Start Translation
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-xl">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-500" />
                              <p className="font-medium text-green-700 dark:text-green-300">
                                Successfully translated to {languages.find(l => l.code === selectedTranslationLang)?.name}
                              </p>
                            </div>
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                              {isFreePlan ? "Using Google Translate" : "Enhanced with Gemini AI"}
                            </p>
                          </div>
                          
                          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 max-h-96 overflow-y-auto">
                            <pre className="text-sm font-mono text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {translatedSrtContent}
                            </pre>
                          </div>
                          
                          <div className="flex gap-3">
                            <button
                              onClick={() => downloadFile(translatedSrtContent, `${file?.name?.replace(/\.[^/.]+$/, "") || "subtitle"}_${selectedTranslationLang}`, "srt")}
                              className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all"
                            >
                              <Download className="w-4 h-4" />
                              Download Translated SRT
                            </button>
                            <button
                              onClick={() => {
                                setTranslatedSrtContent("");
                                setSelectedTranslationLang("");
                                setTranslationStatus("idle");
                              }}
                              className="px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all"
                            >
                              Translate to Another Language
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            {status_ === "completed" && (
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold mb-1">Ready for another file?</h3>
                    <p className="text-sm text-white/80">
                      Your transcription is complete. Process another file or explore more features.
                    </p>
                  </div>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-xl font-medium transition-all flex items-center gap-2"
                  >
                    <ArrowRight className="w-5 h-5" />
                    New Transcription
                  </button>
                </div>
              </div>
            )}

            {/* Processing Information */}
            {processingInfo && (
              <div className="bg-white dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 p-6 animate-fadeIn">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                  <Info className="w-5 h-5 text-indigo-500" />
                  Processing Details
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Model Used</p>
                    <p className="font-bold text-gray-900 dark:text-white">{processingInfo.model_used}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Quality</p>
                    <p className="font-bold text-gray-900 dark:text-white">{processingInfo.quality}</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Speed</p>
                    <p className="font-bold text-gray-900 dark:text-white">{processingInfo.processing_speed}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showSrtPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-indigo-500 to-purple-600">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{previewTitle}</h3>
                <button
                  onClick={() => setShowSrtPreview(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XCircle className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-gray-50 dark:bg-gray-800/50">
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 dark:text-gray-300">
                {previewContent}
              </pre>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3">
              <button
                onClick={() => copyToClipboard(previewContent)}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                onClick={() => {
                  const ext = previewTitle.includes("SRT") ? "srt" : "txt";
                  downloadFile(previewContent, "download", ext);
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-medium transition-all"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => setShowSrtPreview(false)}
                className="px-4 py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-xl font-medium transition-all"
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