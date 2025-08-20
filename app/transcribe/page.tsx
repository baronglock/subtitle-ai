"use client";

import { useState, useRef } from "react";
import { Upload, FileAudio, Download, Globe, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react";

const languages = [
  { code: "auto", name: "Auto-detect" },
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "ru", name: "Russian" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "zh", name: "Chinese" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "nl", name: "Dutch" },
  { code: "pl", name: "Polish" },
  { code: "tr", name: "Turkish" },
  { code: "sv", name: "Swedish" },
  { code: "da", name: "Danish" },
  { code: "no", name: "Norwegian" },
  { code: "fi", name: "Finnish" }
];

export default function TranscribePage() {
  const [file, setFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "completed" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [transcription, setTranscription] = useState("");
  const [srtContent, setSrtContent] = useState("");
  const [detectedLanguage, setDetectedLanguage] = useState("");
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    setStatusMessage("Preparing upload...");
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
      setStatusMessage("Uploading file to cloud storage...");
      setProgress(30);

      // Step 2: Upload file to R2
      const uploadResponse = await fetch(url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      if (!uploadResponse.ok) throw new Error("Failed to upload file");

      setStatus("processing");
      setStatusMessage("Processing transcription with AI...");
      setProgress(60);

      // Step 3: Call transcription API
      const transcribeResponse = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          sourceLanguage: sourceLanguage !== "auto" ? sourceLanguage : undefined,
          targetLanguage: targetLanguage || undefined,
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
      setTranscription(result.transcription);
      setSrtContent(result.srt);
      setDetectedLanguage(result.detected_language);
      setDuration(result.duration);

    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "An error occurred");
      console.error("Transcription error:", error);
    }
  };

  const downloadSRT = () => {
    if (!srtContent) return;
    
    const blob = new Blob([srtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name?.replace(/\.[^/.]+$/, "") || "subtitle"}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadTXT = () => {
    if (!transcription) return;
    
    const blob = new Blob([transcription], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${file?.name?.replace(/\.[^/.]+$/, "") || "transcript"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setStatus("idle");
    setStatusMessage("");
    setTranscription("");
    setSrtContent("");
    setDetectedLanguage("");
    setDuration(0);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">Transcribe & Generate Subtitles</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your audio or video file and get accurate transcriptions in seconds
          </p>
        </div>

        {/* Language Selection */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Language Settings</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Source Language</label>
              <select
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Target Language (Optional - for translation)
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No translation</option>
                {languages.filter(l => l.code !== "auto").map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                : "border-gray-300 dark:border-gray-700"
            } ${file ? "bg-green-50 dark:bg-green-950/20" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept="audio/*,video/*"
              className="hidden"
            />
            
            {file ? (
              <div className="space-y-4">
                <FileAudio className="w-16 h-16 mx-auto text-green-500" />
                <div>
                  <p className="font-semibold">{file.name}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <button
                  onClick={resetForm}
                  className="text-red-500 hover:text-red-600 font-medium"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="w-16 h-16 mx-auto text-gray-400" />
                <div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Choose File
                  </button>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    or drag and drop your file here
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  Supported formats: MP3, WAV, MP4, M4A, WebM, and more
                </p>
              </div>
            )}
          </div>

          {file && status === "idle" && (
            <button
              onClick={handleSubmit}
              className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Start Transcription
            </button>
          )}
        </div>

        {/* Status Display */}
        {status !== "idle" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Processing Status</h3>
              {status === "uploading" || status === "processing" ? (
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              ) : status === "completed" ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : status === "error" ? (
                <XCircle className="w-6 h-6 text-red-500" />
              ) : null}
            </div>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">{statusMessage}</p>
            
            {(status === "uploading" || status === "processing") && (
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {status === "completed" && detectedLanguage && (
              <div className="mt-4 flex items-center gap-4 text-sm">
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Language: {detectedLanguage}
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration: {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, "0")}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {status === "completed" && transcription && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Transcription Result</h3>
            
            <div className="mb-6">
              <textarea
                readOnly
                value={transcription}
                className="w-full h-48 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 resize-none"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={downloadSRT}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download SRT
              </button>
              <button
                onClick={downloadTXT}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download TXT
              </button>
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                New Transcription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}