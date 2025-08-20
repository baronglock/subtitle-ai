// app/page.tsx

"use client"; // Obrigatório no Next.js para páginas com interatividade

import { useState } from "react";

export default function HomePage() {
  // 'useState' é como a memória do componente.
  // 'file' vai guardar o arquivo que o usuário escolher. Inicia como nulo (null).
  // 'setFile' é a função que usamos para atualizar o valor de 'file'.
  const [file, setFile] = useState<File | null>(null);
  
  // 'status' vai guardar a mensagem que mostramos para o usuário (ex: "Enviando...").
  const [status, setStatus] = useState("Aguardando arquivo...");
  
  // 'transcription' vai guardar o texto final da transcrição.
  const [transcription, setTranscription] = useState("");
  
  // 'srtContent' vai guardar o conteúdo SRT com timestamps
  const [srtContent, setSrtContent] = useState("");
  
  // 'selectedLanguage' para futuras traduções
  const [selectedLanguage, setSelectedLanguage] = useState("");

  // Esta função será executada quando o formulário for enviado (clique no botão)
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  if (!file) {
    alert("Por favor, selecione um arquivo primeiro!");
    return;
  }

  setStatus("1/4 - Preparando upload...");

  try {
    // 1. Pede a URL segura para o nosso backend
    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: file.name, contentType: file.type }),
    });

    if (!response.ok) throw new Error("Falha ao obter URL de upload.");

    const { url } = await response.json();
    setStatus("2/4 - Enviando arquivo para o armazenamento...");

    // 2. Envia o arquivo DIRETAMENTE para a URL segura da Cloudflare
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });

    if (!uploadResponse.ok) throw new Error("Falha no upload para o R2.");

    setStatus("3/4 - Arquivo enviado com sucesso! Iniciando transcrição...");

    // 3. Chama a API do RunPod para transcrever
    const transcribeResponse = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        fileName: file.name,
        targetLanguage: selectedLanguage || null
      }),
    });

    if (!transcribeResponse.ok) {
      const errorData = await transcribeResponse.json();
      throw new Error(errorData.error || "Falha na transcrição.");
    }

    const transcriptionData = await transcribeResponse.json();
    
    setStatus("4/4 - Transcrição concluída com sucesso!");
    setTranscription(transcriptionData.transcription);
    setSrtContent(transcriptionData.srt);
    
    console.log("Idioma detectado:", transcriptionData.detected_language);
    console.log("Duração:", transcriptionData.duration, "segundos");

  } catch (error) {
    console.error(error);
    setStatus(`Erro: ${error instanceof Error ? error.message : String(error)}`);
    alert("Ocorreu um erro. Veja o console para detalhes.");
  }
};

  // Esta função é executada toda vez que o usuário seleciona um arquivo no <input>
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      setFile(files[0]);
      setStatus("Arquivo selecionado. Clique em 'Transcrever'.");
    }
  };

  // Função para baixar o arquivo SRT
  const downloadSRT = () => {
    if (!srtContent) return;
    
    const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file?.name?.replace(/\.[^/.]+$/, '') || 'subtitle'}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">SubtitleAI</h1>
      <p className="mb-8 text-lg text-gray-400">Transcreva áudios e vídeos com IA</p>

      <form onSubmit={handleSubmit} className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-lg">
        <div className="mb-6">
          <label htmlFor="file-upload" className="block mb-2 text-sm font-medium text-gray-300">
            Selecione seu arquivo de áudio ou vídeo
          </label>
          <input
            id="file-upload"
            name="file"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300"
        >
          Transcrever Agora
        </button>
      </form>

      <div className="w-full max-w-md mt-8">
        <h2 className="text-xl font-semibold mb-2">Status:</h2>
        <p className="text-gray-400 bg-gray-800 p-4 rounded-lg">{status}</p>
      </div>
      
      {transcription && (
        <>
          <div className="w-full max-w-md mt-8">
            <h2 className="text-xl font-semibold mb-2">Transcrição:</h2>
            <textarea
              readOnly
              value={transcription}
              className="w-full h-48 bg-gray-800 p-4 rounded-lg text-gray-300 resize-none"
            />
          </div>
          
          {srtContent && (
            <div className="w-full max-w-md mt-6">
              <button
                onClick={downloadSRT}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Baixar Arquivo SRT
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}