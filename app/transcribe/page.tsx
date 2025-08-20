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
      
      console.log("API Response:", result);
      
      setProgress(100);
      setStatus("completed");
      setStatusMessage("Transcription completed successfully!");
      
      // Handle the response structure properly
      if (result.transcription) {
        setTranscription(result.transcription);
      } else if (result.text) {
        setTranscription(result.text);
      }
      
      if (result.srt) {
        setSrtContent(result.srt);
        if (targetLanguage && result.translated) {
          setTranslatedSrtContent(result.srt);
        }
      }
      
      if (result.detected_language) {
        setDetectedLanguage(result.detected_language);
      } else if (result.language) {
        setDetectedLanguage(result.language);
      }
      
      if (result.duration) {
        setDuration(result.duration);
      }

    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "An error occurred");
      console.error("Transcription error:", error);
    }
  };

  const downloadSRT = (content?: string, suffix?: string) => {
    const srtToDownload = content || srtContent;
    if (!srtToDownload) return;
    
    const blob = new Blob([srtToDownload], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = file?.name?.replace(/\.[^/.]+$/, "") || "subtitle";
    a.download = `${baseName}${suffix || ""}.srt`;
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
    setTranslatedSrtContent("");
    setDetectedLanguage("");
    setDuration(0);
    setProgress(0);
    setTranslationStatus("idle");
    setSelectedTranslationLang("");
    setShowSrtPreview(false);
    setPreviewContent("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const translateContent = async () => {
    if (!srtContent || !selectedTranslationLang) {
      alert("Please select a language for translation");
      return;
    }

    setTranslationStatus("translating");
    setStatusMessage("Translating subtitles...");

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
      setStatusMessage("Translation completed!");
    } catch (error) {
      setTranslationStatus("error");
      setStatusMessage("Translation failed. Please try again.");
      console.error("Translation error:", error);
    }
  };

  const previewSrt = (content: string, title: string) => {
    setPreviewContent(content);
    setShowSrtPreview(true);
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
        {status === "completed" && (transcription || srtContent) && (
          <>
            {/* Original Transcription */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Original Transcription</h3>
              
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Transcribed Text:</label>
                <textarea
                  readOnly
                  value={transcription || "No text transcription available"}
                  className="w-full h-32 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 resize-none"
                />
              </div>

              {srtContent && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2">SRT Subtitles Preview:</label>
                  <textarea
                    readOnly
                    value={srtContent.split('\n').slice(0, 12).join('\n') + (srtContent.split('\n').length > 12 ? '\n\n...' : '')}
                    className="w-full h-32 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => downloadSRT(srtContent, "_original")}
                  disabled={!srtContent}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Download Original SRT
                </button>
                <button
                  onClick={downloadTXT}
                  disabled={!transcription}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  Download Text
                </button>
                <button
                  onClick={() => previewSrt(srtContent, "Original SRT")}
                  disabled={!srtContent}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileAudio className="w-4 h-4" />
                  View Full SRT
                </button>
              </div>
            </div>

            {/* Translation Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Translate Subtitles</h3>
              
              {!translatedSrtContent ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Translate to:
                    </label>
                    <select
                      value={selectedTranslationLang}
                      onChange={(e) => setSelectedTranslationLang(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select language</option>
                      {languages.filter(l => l.code !== "auto" && l.code !== detectedLanguage).map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <button
                    onClick={translateContent}
                    disabled={!selectedTranslationLang || translationStatus === "translating"}
                    className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {translationStatus === "translating" ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Translating...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Globe className="w-5 h-5" />
                        Translate Subtitles
                      </span>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      ✓ Successfully translated to {languages.find(l => l.code === selectedTranslationLang)?.name}
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Translated SRT Preview:</label>
                    <textarea
                      readOnly
                      value={translatedSrtContent.split('\n').slice(0, 12).join('\n') + (translatedSrtContent.split('\n').length > 12 ? '\n\n...' : '')}
                      className="w-full h-32 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 resize-none font-mono text-sm"
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => downloadSRT(translatedSrtContent, `_${selectedTranslationLang}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Translated SRT
                    </button>
                    <button
                      onClick={() => previewSrt(translatedSrtContent, "Translated SRT")}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      <FileAudio className="w-4 h-4" />
                      View Full Translation
                    </button>
                    <button
                      onClick={() => {
                        setTranslatedSrtContent("");
                        setSelectedTranslationLang("");
                        setTranslationStatus("idle");
                      }}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Translate to Another Language
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* New Transcription Button */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
              <button
                onClick={resetForm}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
              >
                Start New Transcription
              </button>
            </div>
          </>
        )}

        {/* SRT Preview Modal */}
        {showSrtPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-semibold">SRT File Preview</h3>
              </div>
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                  {previewContent}
                </pre>
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  onClick={() => {
                    const blob = new Blob([previewContent], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "subtitle.srt";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => setShowSrtPreview(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}