import { requireAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  Ticket, 
  FileText, 
  AlertTriangle,
  Settings,
  ChevronRight
} from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdmin, error, redirect: redirectPath } = await requireAdmin();
  
  if (!isAdmin && redirectPath) {
    redirect(redirectPath);
  }
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-sm font-semibold">
                ADMIN
              </div>
              <h1 className="text-2xl font-bold">SubtleAI Admin Panel</h1>
            </div>
            <Link 
              href="/dashboard"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Back to Dashboard →
            </Link>
          </div>
        </div>
      </div>
      
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <nav className="p-4 space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dashboard</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Link>
            
            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Users className="w-5 h-5" />
              <span>Users</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Link>
            
            <Link
              href="/admin/tickets"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Ticket className="w-5 h-5" />
              <span>Support Tickets</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Link>
            
            <Link
              href="/admin/transcriptions"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span>Transcriptions</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Link>
            
            <Link
              href="/admin/abuse"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Abuse Detection</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Link>
            
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Link>
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-8">
          {children}
        </div>
      </div>
    </div>
  );
}