import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Mail,
  Phone,
  Clock,
  User,
  ChevronDown,
  Trash2,
} from "lucide-react";
import Layout from "../Components/Layout";

export default function ContactQur() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [checkingUser, setCheckingUser] = useState(true);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteMessageId, setDeleteMessageId] = useState(null);
  const [deleteButtonPosition, setDeleteButtonPosition] = useState(null);

  const allowedRoles = ["super_admin", "admin"];

  // Helper function to format time with AM/PM
  const formatDateTime = (date) => {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const dateStr = `${day}/${month}/${year}`;
    const timeStr = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    return { dateStr, timeStr, fullStr: `${dateStr} ${timeStr}` };
  };

  // 🔐 Auth check (UPDATED: Always fetch from server)
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        setCheckingUser(true);
        const response = await fetch(
          `${import.meta.env.VITE_SERVER}/admin/auth/profile`,
          { credentials: "include" }
        );
        if (response.status === 401) {
          setRedirecting(true);
          navigate("/login", { replace: true });
          return;
        }
        const data = await response.json();
        if (data.tokenValid === false) {
          setRedirecting(true);
          navigate("/login", { replace: true });
          return;
        }
        if (response.ok && data.admin) {
          setCurrentUser(data.admin);
        } else {
          setRedirecting(true);
          navigate("/login", { replace: true });
          return;
        }
      } catch (err) {
        console.error("Failed to fetch current user", err);
        setRedirecting(true);
        navigate("/login", { replace: true });
      } finally {
        setCheckingUser(false);
      }
    };

    fetchCurrentUser();
  }, [navigate]);

  // 📩 Fetch Contact Us messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER}/web/contact-us`,
          { credentials: "include" }
        );
        const data = await res.json();

        if (data.success) {
          setMessages(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch contact messages", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    if (currentUser && allowedRoles.includes(currentUser.role)) {
      fetchMessages();
    }
  }, [currentUser]);

  const toggleMessage = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDeleteClick = (id, event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setDeleteButtonPosition({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX
    });
    setDeleteMessageId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteMessageId) return;

    setShowDeleteConfirm(false);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER}/web/contact-us/${deleteMessageId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      if (res.status === 403) {
        alert("You are not allowed to delete this message");
        return;
      }

      if (res.ok) {
        setMessages((prev) => prev.filter((m) => m._id !== deleteMessageId));
      } else {
        alert("Failed to delete message");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("Server error");
    } finally {
      setDeleteMessageId(null);
      setDeleteButtonPosition(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setDeleteMessageId(null);
    setDeleteButtonPosition(null);
  };

  // ⏳ Checking auth
  if (checkingUser) {
    return (
      <Layout title="Contact Us">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout title="Contact Us">
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unauthorized Access</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </Layout>
    );
  }

  // 🚫 Access denied
  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <Layout title="Contact Us">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Shield className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  // ✅ MAIN VIEW (CONTACT US DATA)
  return (
    <Layout title="Contact Queries">
      <div className="p-3 sm:p-6 bg-gray-50 min-h-screen">
        <div className="max-w-5xl mx-auto">
          {/* Simple Header */}
          <div className="mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-800 flex items-center gap-2">
              <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              Contact Messages
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {messages.length} total messages
            </p>
          </div>

          {/* Messages List */}
          {loadingMessages ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-500 text-sm">Loading messages...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
              <Mail className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm sm:text-base">
                No messages received yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isExpanded = expandedId === msg._id;
                const { dateStr, timeStr } = formatDateTime(
                  msg.createdAt
                );

                return (
                  <div
                    key={msg._id}
                    className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* Clickable Header */}
                    <button
                      onClick={() => toggleMessage(msg._id)}
                      className="w-full p-3 sm:p-4 flex items-start sm:items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start sm:items-center gap-2 sm:gap-3 flex-1 text-left min-w-0">
                        <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm sm:text-base text-gray-900 truncate">
                            {msg.firstName} {msg.lastName}
                          </h3>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1 truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{msg.email}</span>
                            </span>
                            <span className="flex items-center gap-1 text-gray-600">
                              <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 flex-shrink-0" />
                              {msg.phone}
                            </span>
                            <span className="hidden sm:flex items-center gap-1">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              {dateStr} at {timeStr}
                            </span>
                            <span className="flex sm:hidden items-center gap-1">
                              <Clock className="h-3 w-3 flex-shrink-0" />
                              {timeStr}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* RIGHT SIDE ACTIONS */}
                      <div className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-3 flex-shrink-0">
                        {/* DELETE – ONLY super_admin */}
                        {currentUser.role === "super_admin" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // 🚨 IMPORTANT (prevents expand toggle)
                              handleDeleteClick(msg._id, e);
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete message"
                          >
                            <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                          </button>
                        )}

                        <ChevronDown
                          style={{
                            transform: isExpanded
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            transition:
                              "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                          className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
                        />
                      </div>
                    </button>

                    {/* Expandable Content */}
                    <div
                      style={{
                        maxHeight: isExpanded ? "500px" : "0",
                        opacity: isExpanded ? "1" : "0",
                        transition:
                          "max-height 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s ease-in-out",
                      }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100">
                        {/* Message */}
                        <div className="bg-gray-50 rounded p-3 text-gray-700 text-sm leading-relaxed break-words">
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom Delete Confirmation Dialog */}
        {showDeleteConfirm && deleteButtonPosition && (
          <div
            className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 p-3 min-w-48"
            style={{
              top: deleteButtonPosition.top + 8,
              left: deleteButtonPosition.left - 100
            }}
          >
            <p className="text-sm text-gray-700 mb-3 font-medium">
              Are you sure you want to delete this message?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={handleDeleteCancel}
                className="px-3 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}

      </div>
    </Layout>
  );
}
