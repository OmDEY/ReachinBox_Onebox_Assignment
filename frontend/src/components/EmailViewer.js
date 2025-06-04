import React from "react";

export default function EmailViewer({ email }) {
  return (
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-bold">{email.subject}</h2>
      <p className="text-gray-600 mb-2">From: {email.from}</p>
      <p className="text-sm text-gray-800 whitespace-pre-wrap">{email.body}</p>
      <div className="text-xs text-green-600 mt-2">Category: {email.category}</div>
    </div>
  );
}
