import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { adminApiMiddleware } from "@/lib/admin-auth";

export async function GET(request: Request) {
  // Check admin auth
  const authError = await adminApiMiddleware();
  if (authError) return authError;
  
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "24h";
    
    // Calculate time range
    let hoursAgo = 24;
    switch(range) {
      case "1h": hoursAgo = 1; break;
      case "6h": hoursAgo = 6; break;
      case "24h": hoursAgo = 24; break;
      case "7d": hoursAgo = 24 * 7; break;
      default: hoursAgo = 24;
    }
    
    const cutoffTime = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    
    // Get all transcription keys
    const transcriptionKeys = await kv.keys("transcription:*");
    
    const transcriptions = [];
    
    for (const key of transcriptionKeys) {
      const transcriptionData = await kv.get(key);
      if (transcriptionData) {
        const trans = transcriptionData as any;
        const transDate = new Date(trans.createdAt || trans.timestamp || 0);
        
        // Only include transcriptions within the time range
        if (transDate > cutoffTime) {
          // Get user info if available
          const userId = trans.userId;
          let userEmail = trans.userEmail;
          
          if (!userEmail && userId) {
            const userData = await kv.get(`user:${userId}`);
            if (userData) {
              userEmail = (userData as any).email;
            }
          }
          
          transcriptions.push({
            id: key.replace('transcription:', ''),
            userId: trans.userId,
            userEmail: userEmail || 'Unknown',
            fileName: trans.fileName || trans.filename || 'Unknown',
            duration: trans.duration || trans.minutes || 0,
            language: trans.language || 'auto',
            status: trans.status || 'completed',
            createdAt: trans.createdAt || trans.timestamp,
            cost: trans.cost || (trans.duration ? trans.duration * 0.1 : 0), // Estimate cost if not stored
            content: trans.content?.substring(0, 1000), // Include partial content
          });
        }
      }
    }
    
    // Sort by creation date (newest first)
    transcriptions.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
    
    return NextResponse.json({
      transcriptions,
      total: transcriptions.length,
      range,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error("Error fetching transcriptions:", error);
    return NextResponse.json(
      { error: "Failed to fetch transcriptions" },
      { status: 500 }
    );
  }
}