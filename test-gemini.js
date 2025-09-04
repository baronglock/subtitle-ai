#!/usr/bin/env node

/**
 * Script de teste local para Gemini AI
 * Testa transcrição e tradução sem precisar do servidor
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Importar Gemini SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Cores para o console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testGeminiSetup() {
  log('\n========================================', 'cyan');
  log('🧪 TESTE LOCAL DO GEMINI AI', 'cyan');
  log('========================================\n', 'cyan');

  // 1. Verificar API Key
  log('1️⃣  Verificando configuração...', 'yellow');
  
  if (!process.env.GEMINI_API_KEY) {
    log('❌ GEMINI_API_KEY não encontrada no .env.local', 'red');
    log('   Por favor, adicione sua chave em .env.local', 'red');
    process.exit(1);
  }

  const apiKeyLength = process.env.GEMINI_API_KEY.length;
  const apiKeyPreview = process.env.GEMINI_API_KEY.substring(0, 10);
  
  log(`✅ API Key encontrada (${apiKeyLength} caracteres)`, 'green');
  log(`   Preview: ${apiKeyPreview}...`, 'blue');

  // 2. Inicializar Gemini
  log('\n2️⃣  Inicializando Gemini AI...', 'yellow');
  
  let genAI;
  let model;
  
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    log('✅ GoogleGenerativeAI inicializado', 'green');
  } catch (error) {
    log('❌ Erro ao inicializar GoogleGenerativeAI:', 'red');
    log(`   ${error.message}`, 'red');
    process.exit(1);
  }

  // 3. Testar diferentes modelos
  log('\n3️⃣  Testando modelos disponíveis...', 'yellow');
  
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-pro-vision'
  ];

  let workingModel = null;
  
  for (const modelName of modelsToTest) {
    try {
      log(`   Testando: ${modelName}...`, 'blue');
      model = genAI.getGenerativeModel({ model: modelName });
      
      // Fazer um teste simples com texto
      const result = await model.generateContent('Say "Hello World"');
      const response = await result.response;
      const text = response.text();
      
      if (text) {
        log(`   ✅ ${modelName} funcionando!`, 'green');
        workingModel = modelName;
        break;
      }
    } catch (error) {
      log(`   ❌ ${modelName}: ${error.message}`, 'red');
    }
  }

  if (!workingModel) {
    log('\n❌ Nenhum modelo Gemini está funcionando', 'red');
    log('   Verifique sua API key e quota', 'red');
    process.exit(1);
  }

  log(`\n✅ Modelo selecionado: ${workingModel}`, 'green');
  
  return { genAI, model, modelName: workingModel };
}

async function testAudioTranscription(model) {
  log('\n4️⃣  Testando transcrição de áudio...', 'yellow');
  
  // Verificar se existe arquivo de teste
  const testAudioPath = path.join(__dirname, 'samples', 'test-audio.mp3');
  
  if (!fs.existsSync(testAudioPath)) {
    log('⚠️  Arquivo de teste não encontrado', 'yellow');
    log('   Criando arquivo de áudio de teste...', 'blue');
    
    // Criar pasta samples se não existir
    const samplesDir = path.join(__dirname, 'samples');
    if (!fs.existsSync(samplesDir)) {
      fs.mkdirSync(samplesDir);
    }
    
    // Criar um arquivo de teste vazio (você precisará adicionar um arquivo real)
    log('   ℹ️  Por favor, adicione um arquivo MP3 em samples/test-audio.mp3', 'yellow');
    log('   Você pode usar qualquer arquivo MP3/WAV/M4A pequeno (< 5MB)', 'yellow');
    
    // Vamos pular o teste de áudio por enquanto
    log('   Pulando teste de áudio por enquanto...', 'yellow');
    return null;
  }

  try {
    // Ler arquivo de áudio
    const audioData = fs.readFileSync(testAudioPath);
    const audioBase64 = audioData.toString('base64');
    const audioSizeMB = (audioData.length / (1024 * 1024)).toFixed(2);
    
    log(`   📊 Arquivo: test-audio.mp3 (${audioSizeMB} MB)`, 'blue');
    log('   📤 Enviando para Gemini...', 'blue');
    
    // Preparar prompt
    const prompt = `Please transcribe this audio file accurately.
Return the transcription as a valid JSON object with this exact structure:
{
  "transcription": "the complete transcribed text here",
  "detected_language": "the detected language (e.g., English, Portuguese)",
  "duration": 60,
  "confidence": "high"
}

Important: Return ONLY the JSON object, no additional text.`;

    // Criar parte do áudio
    const audioPart = {
      inlineData: {
        data: audioBase64,
        mimeType: 'audio/mpeg'
      }
    };

    // Enviar para Gemini
    const result = await model.generateContent([prompt, audioPart]);
    const response = await result.response;
    const text = response.text();
    
    log('   ✅ Resposta recebida do Gemini', 'green');
    
    // Tentar parsear JSON
    let transcriptionData;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        transcriptionData = JSON.parse(jsonMatch[0]);
      } else {
        transcriptionData = {
          transcription: text,
          detected_language: 'Unknown'
        };
      }
    } catch (e) {
      transcriptionData = {
        transcription: text,
        detected_language: 'Unknown'
      };
    }
    
    log('\n   📝 Transcrição:', 'magenta');
    log(`   "${transcriptionData.transcription.substring(0, 100)}..."`, 'white');
    log(`   🌍 Idioma: ${transcriptionData.detected_language}`, 'blue');
    
    return transcriptionData;
    
  } catch (error) {
    log(`   ❌ Erro na transcrição: ${error.message}`, 'red');
    if (error.stack) {
      log(`   Stack: ${error.stack}`, 'red');
    }
    return null;
  }
}

async function testTranslation(model, text) {
  if (!text) return;
  
  log('\n5️⃣  Testando tradução...', 'yellow');
  
  try {
    const prompt = `Translate the following text to English:

"${text.substring(0, 200)}"

Return only the translated text, nothing else.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text();
    
    log('   ✅ Tradução concluída', 'green');
    log(`   🔤 Texto traduzido: "${translatedText.substring(0, 100)}..."`, 'blue');
    
    return translatedText;
    
  } catch (error) {
    log(`   ❌ Erro na tradução: ${error.message}`, 'red');
    return null;
  }
}

async function testSimplePrompt(model) {
  log('\n6️⃣  Teste simples de prompt...', 'yellow');
  
  try {
    const prompt = 'Write a haiku about coding';
    log(`   Prompt: "${prompt}"`, 'blue');
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    log('   ✅ Resposta:', 'green');
    log(`   ${text}`, 'magenta');
    
    return text;
    
  } catch (error) {
    log(`   ❌ Erro: ${error.message}`, 'red');
    return null;
  }
}

// Função principal
async function main() {
  try {
    // Testar configuração
    const { genAI, model, modelName } = await testGeminiSetup();
    
    // Teste simples primeiro
    await testSimplePrompt(model);
    
    // Testar transcrição de áudio
    const transcription = await testAudioTranscription(model);
    
    // Testar tradução
    if (transcription && transcription.transcription) {
      await testTranslation(model, transcription.transcription);
    }
    
    // Resumo final
    log('\n========================================', 'cyan');
    log('📊 RESUMO DO TESTE', 'cyan');
    log('========================================', 'cyan');
    
    log(`\n✅ Modelo funcionando: ${modelName}`, 'green');
    log('✅ API Key válida', 'green');
    log('✅ Comunicação com Gemini OK', 'green');
    
    if (transcription) {
      log('✅ Transcrição de áudio funcionando', 'green');
    } else {
      log('⚠️  Transcrição de áudio não testada (adicione samples/test-audio.mp3)', 'yellow');
    }
    
    log('\n💡 PRÓXIMOS PASSOS:', 'yellow');
    log('1. Adicione sua GEMINI_API_KEY real no arquivo .env.local', 'blue');
    log('2. Adicione um arquivo de áudio em samples/test-audio.mp3', 'blue');
    log('3. Execute: node test-gemini.js', 'blue');
    log(`4. Use o modelo "${modelName}" no seu código`, 'blue');
    
  } catch (error) {
    log('\n❌ Erro geral no teste:', 'red');
    log(`   ${error.message}`, 'red');
    if (error.stack) {
      log(`   Stack trace: ${error.stack}`, 'red');
    }
    process.exit(1);
  }
}

// Executar
main().catch(console.error);