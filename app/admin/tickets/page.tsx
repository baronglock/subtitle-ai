"use client";

import { useEffect, useState } from "react";
import { 
  Ticket, 
  Clock, 
  User, 
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Reply,
  X,
  Send,
  RefreshCw
} from "lucide-react";

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await fetch("/api/admin/tickets");
      if (!response.ok) throw new Error("Failed to fetch");
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyMessage.trim()) return;
    
    setSending(true);
    try {
      const response = await fetch(`/api/support/ticket/${selectedTicket.id}/response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: replyMessage,
        }),
      });
      
      if (!response.ok) throw new Error("Failed to send reply");
      
      const updatedTicket = await response.json();
      
      // Update the ticket in the list
      setTickets(tickets.map(t => 
        t.id === selectedTicket.id ? updatedTicket : t
      ));
      
      // Update selected ticket
      setSelectedTicket(updatedTicket);
      setReplyMessage("");
      
    } catch (err) {
      console.error("Failed to send reply:", err);
      alert("Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const updateTicketStatus = async (ticketId: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/tickets/${ticketId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) throw new Error("Failed to update status");
      
      // Refresh tickets
      await fetchTickets();
      
      // Update selected ticket if it's the one being updated
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
      
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update ticket status");
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus === "all") return true;
    return ticket.status === filterStatus;
  });

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
        <h2 className="text-3xl font-bold">Support Tickets</h2>
        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex gap-4">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900"
          >
            <option value="all">All Tickets</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          
          <div className="flex gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Total: {tickets.length}</span>
            <span>Open: {tickets.filter(t => t.status === 'open').length}</span>
            <span>In Progress: {tickets.filter(t => t.status === 'in_progress').length}</span>
            <span>Resolved: {tickets.filter(t => t.status === 'resolved').length}</span>
          </div>
        </div>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-[600px] overflow-y-auto">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
            <h3 className="font-semibold">Tickets ({filteredTickets.length})</h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors ${
                  selectedTicket?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-4 h-4 text-gray-400" />
                    <span className="font-mono text-sm">#{ticket.id?.slice(-8)}</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    ticket.status === 'open' 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                      : ticket.status === 'in_progress'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600'
                      : ticket.status === 'resolved'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
                
                <h4 className="font-semibold mb-1">{ticket.subject}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                  {ticket.message}
                </p>
                
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{ticket.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>{ticket.responses?.length || 0} replies</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow h-[600px] overflow-hidden">
          {selectedTicket ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">Ticket #{selectedTicket.id?.slice(-8)}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedTicket.subject}</p>
                  </div>
                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'in_progress')}
                    className="text-xs px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 rounded-full hover:bg-yellow-200"
                  >
                    Mark In Progress
                  </button>
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                    className="text-xs px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 rounded-full hover:bg-green-200"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, 'closed')}
                    className="text-xs px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200"
                  >
                    Close Ticket
                  </button>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Original message */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-semibold text-sm">{selectedTicket.name}</span>
                    <span className="text-xs text-gray-500">{selectedTicket.email}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(selectedTicket.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm">{selectedTicket.message}</p>
                  {selectedTicket.phone && (
                    <p className="text-xs text-gray-500 mt-2">Phone: {selectedTicket.phone}</p>
                  )}
                </div>
                
                {/* Responses */}
                {selectedTicket.responses?.map((response: any, idx: number) => (
                  <div key={idx} className={`rounded-lg p-4 ${
                    response.isAdmin 
                      ? 'bg-blue-50 dark:bg-blue-900/20 ml-8' 
                      : 'bg-gray-50 dark:bg-gray-900'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {response.isAdmin ? (
                        <>
                          <Reply className="w-4 h-4 text-blue-500" />
                          <span className="font-semibold text-sm text-blue-600">Admin</span>
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-sm">{selectedTicket.name}</span>
                        </>
                      )}
                      <span className="text-xs text-gray-400 ml-auto">
                        {new Date(response.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{response.message}</p>
                  </div>
                ))}
              </div>
              
              {/* Reply Form */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="flex gap-2">
                  <textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 resize-none"
                    rows={3}
                  />
                  <button
                    onClick={sendReply}
                    disabled={sending || !replyMessage.trim()}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {sending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Ticket className="w-12 h-12 mx-auto mb-3" />
                <p>Select a ticket to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}