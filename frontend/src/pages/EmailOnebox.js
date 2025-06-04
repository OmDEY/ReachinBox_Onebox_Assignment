import React, { useState, useEffect } from "react";
import {
  FiSearch,
  FiMail,
  FiInbox,
  FiSend,
  FiStar,
  FiTrash2,
  FiRefreshCw,
  FiChevronDown,
  FiPaperclip,
  FiCornerUpLeft as FiReply,
  FiCalendar,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { sendMailReply, getReplySuggestions, generateReply, searchEmails } from "../api";

const EmailApp = () => {
  // State
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    folder: "inbox",
    account: "",
    category: "",
  });

  // Fetch emails
  const fetchEmails = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.folder) queryParams.append("folder", filters.folder);
      if (filters.account) queryParams.append("account", filters.account);
      if (filters.category) queryParams.append("category", filters.category);

      const data = await searchEmails(queryParams.toString());
      setEmails(data.emails);
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get AI suggestions
  // const getAISuggestions = async () => {
  //   if (!selectedEmail) return;

  //   try {
  //     const data = await getReplySuggestions(
  //       selectedEmail.subject,
  //       selectedEmail.body
  //     );
  //     const dataJson = await data.json();
  //     console.log("dataJson >>>>", dataJson);

  //     setSuggestions([dataJson.reply]); // ✅ wrap it in array for UI
  //     setShowSuggestions(true);
  //   } catch (error) {
  //     console.error("Error getting AI suggestions:", error);
  //   }
  // };
  const getAISuggestions = async () => {
    if (!selectedEmail) return;

    try {
      const data = await generateReply(
        selectedEmail.subject,
        selectedEmail.body
      );
      const dataJson = await data.json();
      console.log("dataJson >>>>", dataJson);

      setSuggestions([dataJson.reply]); // ✅ wrap it in array for UI
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error getting AI suggestions:", error);
    }
  };

  // Send reply
  const sendReply = async () => {
    if (!selectedEmail || !replyContent) return;

    try {
      await sendMailReply(
        selectedEmail.to,
        selectedEmail.subject,
        replyContent,
        selectedEmail.messageId
      );

      // Reset reply state
      setReplyContent("");
      setShowSuggestions(false);
      alert("Reply sent successfully!");
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply");
    }
  };

  // Fetch emails on component mount and when filters change
  useEffect(() => {
    fetchEmails();
  }, [filters]);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Updated categories according to requirements
  const categories = [
    {
      id: "interested",
      name: "Interested",
      color: "bg-green-100 text-green-800",
      icon: <FiStar className="mr-2" />,
    },
    {
      id: "meeting booked",
      name: "Meeting Booked",
      color: "bg-blue-100 text-blue-800",
      icon: <FiCalendar className="mr-2" />,
    },
    {
      id: "not interested",
      name: "Not Interested",
      color: "bg-yellow-100 text-yellow-800",
      icon: <FiMail className="mr-2" />,
    },
    {
      id: "spam",
      name: "Spam",
      color: "bg-red-100 text-red-800",
      icon: <FiTrash2 className="mr-2" />,
    },
    {
      id: "out of office",
      name: "Out of Office",
      color: "bg-purple-100 text-purple-800",
      icon: <FiSend className="mr-2" />,
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">MailBox</h1>
        </div>

        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => setFilters({ ...filters, folder: "inbox" })}
            className={`flex items-center w-full p-2 rounded-lg ${
              filters.folder === "inbox"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FiInbox className="mr-3" />
            Inbox
            <span className="ml-auto bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-full">
              {emails.length}
            </span>
          </button>

          {/* <button
            onClick={() => setFilters({ ...filters, folder: "sent" })}
            className={`flex items-center w-full p-2 rounded-lg mt-2 ${
              filters.folder === "sent"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FiSend className="mr-3" />
            Sent
          </button>

          <button
            onClick={() => setFilters({ ...filters, folder: "starred" })}
            className={`flex items-center w-full p-2 rounded-lg mt-2 ${
              filters.folder === "starred"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FiStar className="mr-3" />
            Starred
          </button>

          <button
            onClick={() => setFilters({ ...filters, folder: "trash" })}
            className={`flex items-center w-full p-2 rounded-lg mt-2 ${
              filters.folder === "trash"
                ? "bg-blue-50 text-blue-600"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <FiTrash2 className="mr-3" />
            Trash
          </button> */}
        </div>

        <div className="p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Categories
          </h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() =>
                  setFilters({ ...filters, category: category.id })
                }
                className={`flex items-center w-full p-2 rounded-lg text-sm ${
                  filters.category === category.id
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {category.icon}
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center">
          <div className="relative flex-1 max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search emails..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
            />
          </div>

          <div className="ml-4 flex items-center">
            <button
              onClick={fetchEmails}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <FiRefreshCw
                className={`text-gray-600 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Email List and Detail View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Email List */}
          <div
            className={`${
              selectedEmail ? "hidden md:block md:w-1/3 lg:w-2/5" : "w-full"
            } border-r border-gray-200 bg-white overflow-y-auto`}
          >
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <FiMail className="text-4xl mb-2" />
                <p>No emails found</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-200">
                {emails.map((email) => (
                  <li
                    key={email.id}
                    className={`hover:bg-gray-50 cursor-pointer ${
                      selectedEmail?.id === email.id ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setSelectedEmail(email)}
                  >
                    <div className="px-4 py-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium truncate">
                          {email.from}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {formatDate(email.date)}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1 truncate">
                        {email.subject}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {email.body?.substring(0, 100)}
                        {email.body?.length > 100 ? "..." : ""}
                      </p>
                      {email.category && (
                        <div className="flex mt-2">
                          <span
                            className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${
                              categories.find((c) => c.id === email.category)
                                ?.color || "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {
                              categories.find((c) => c.id === email.category)
                                ?.icon
                            }
                            {categories.find((c) => c.id === email.category)
                              ?.name || email.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Email Detail View */}
          {selectedEmail ? (
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <button
                    onClick={() => setSelectedEmail(null)}
                    className="md:hidden p-2 rounded-full hover:bg-gray-100"
                  >
                    <FiChevronDown className="transform rotate-90 text-gray-600" />
                  </button>

                  <div className="flex space-x-2">
                    <button
                      onClick={getAISuggestions}
                      className="p-2 rounded-full hover:bg-gray-100"
                      title="Get AI suggestions"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-purple-600"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 8V4l8 8-8 8v-4c-4.418 0-8-3.582-8-8s3.582-8 8-8z" />
                      </svg>
                    </button>
                    {/* <button className="p-2 rounded-full hover:bg-gray-100">
                      <FiTrash2 className="text-gray-600" />
                    </button> */}
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  {selectedEmail.subject}
                </h1>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium">
                      {selectedEmail.from.charAt(0).toUpperCase()}
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">
                        {selectedEmail.from}
                      </p>
                      <p className="text-xs text-gray-500">to me</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(selectedEmail.date)}
                  </p>
                </div>

                <div className="prose max-w-none text-gray-700 mb-8">
                  {selectedEmail.html ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                    />
                  ) : (
                    <p className="whitespace-pre-line">{selectedEmail.body}</p>
                  )}
                </div>

                {selectedEmail.attachments &&
                  selectedEmail.attachments.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">
                        Attachments ({selectedEmail.attachments.length})
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedEmail.attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center p-2 border border-gray-200 rounded-lg"
                          >
                            <FiPaperclip className="text-gray-400 mr-2" />
                            <span className="text-sm text-gray-700">
                              {attachment.filename}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Reply Section */}
                <div className="mt-8 border-t border-gray-200 pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Reply</h3>
                    <button
                      onClick={getAISuggestions}
                      className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M12 8V4l8 8-8 8v-4c-4.418 0-8-3.582-8-8s3.582-8 8-8z" />
                      </svg>
                      Get AI Suggestions
                    </button>
                  </div>

                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          AI Suggestions
                        </h4>
                        <ul className="space-y-2">
                          {suggestions.map((suggestion, index) => (
                            <li
                              key={index}
                              className="bg-gray-100 p-3 rounded-lg cursor-pointer hover:bg-blue-100"
                              onClick={() => setReplyContent(suggestion)} // ✅ just pass suggestion string
                            >
                              {suggestion}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </AnimatePresence>

                  <textarea
                    rows="5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Write your reply here..."
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                  ></textarea>

                  <div className="mt-4 flex justify-between items-center">
                    <div className="flex space-x-2">
                      {categories.map((category) => (
                        <button
                          key={category.id}
                          onClick={() => {
                            // Update the selected email's category
                            const updatedEmails = emails.map((e) =>
                              e.id === selectedEmail.id
                                ? { ...e, category: category.id }
                                : e
                            );
                            setEmails(updatedEmails);
                            setSelectedEmail({
                              ...selectedEmail,
                              category: category.id,
                            });
                          }}
                          className={`flex items-center text-xs px-2 py-1 rounded-full ${
                            selectedEmail.category === category.id
                              ? category.color +
                                " ring-1 ring-offset-1 ring-gray-400"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {category.icon}
                          {category.name}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={sendReply}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FiReply className="mr-2" />
                      Send Reply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
              <div className="text-center">
                <FiMail className="mx-auto text-4xl text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No email selected
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select an email to read and reply
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailApp;
