import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function GET(request: NextRequest) {
  console.log("=== Test Gemini API ===");
  
  const results = {
    apiKeyExists: false,
    apiKeyLength: 0,
    modelTests: [] as any[],
    simpleTest: null as any,
    error: null as any
  };

  try {
    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ 
        error: "GEMINI_API_KEY not found in environment variables" 
      }, { status: 500 });
    }

    results.apiKeyExists = true;
    results.apiKeyLength = process.env.GEMINI_API_KEY.length;

    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Test different models
    const modelsToTest = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest", 
      "gemini-1.5-pro",
      "gemini-pro"
    ];

    for (const modelName of modelsToTest) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello");
        const response = result.response;
        const text = response.text();
        
        results.modelTests.push({
          model: modelName,
          success: true,
          response: text.substring(0, 50)
        });

        // If successful, do a simple test
        if (!results.simpleTest) {
          results.simpleTest = {
            model: modelName,
            prompt: "What is 2+2?",
            response: ""
          };

          const testResult = await model.generateContent("What is 2+2?");
          results.simpleTest.response = testResult.response.text();
        }

      } catch (error: any) {
        results.modelTests.push({
          model: modelName,
          success: false,
          error: error.message
        });
      }
    }

    return NextResponse.json(results);

  } catch (error: any) {
    console.error("Test error:", error);
    results.error = {
      message: error.message,
      stack: error.stack
    };
    return NextResponse.json(results, { status: 500 });
  }
}