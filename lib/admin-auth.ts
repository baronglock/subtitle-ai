import { getServerSession } from "next-auth";
import { authOptions } from "@/app/lib/auth";
import { NextResponse } from "next/server";

// Admin emails - adicione mais se precisar
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL, // Seu email principal
  // Adicione mais emails admin aqui se necessário
].filter(Boolean);

export async function checkIsAdmin(session: any) {
  if (!session?.user?.email) return false;
  return ADMIN_EMAILS.includes(session.user.email);
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { 
      isAdmin: false, 
      error: "Not authenticated",
      redirect: "/login" 
    };
  }
  
  const isAdmin = await checkIsAdmin(session);
  
  if (!isAdmin) {
    return { 
      isAdmin: false, 
      error: "Not authorized",
      redirect: "/dashboard" 
    };
  }
  
  return { 
    isAdmin: true, 
    session,
    error: null 
  };
}

// Middleware para proteger rotas admin
export async function adminApiMiddleware() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const isAdmin = await checkIsAdmin(session);
  
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  
  return null; // Continue with the request
}