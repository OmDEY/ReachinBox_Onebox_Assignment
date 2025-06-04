import React, { useState } from "react";
import EmailList from "../components/EmailList";
import EmailViewer from "../components/EmailViewer";
import { fetchEmails, searchEmails } from "../api";

export default function Dashboard() {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [emails, setEmails] = useState([]);

  const handleSearch = async () => {
    const results = await searchEmails(searchTerm);
    console.log('results >>>> ', results)
    setEmails(results);
    setSelectedEmail(null); // reset viewer
  };

  const handleFetchAll = async () => {
    const allEmails = await fetchEmails();
    console.log('allEmails >>>> ', allEmails)
    setEmails(allEmails);
  };

  React.useEffect(() => {
    handleFetchAll();
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center mb-4">
        <input
          className="border p-2 rounded w-full"
          placeholder="Search emails"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button
          onClick={handleSearch}
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Search
        </button>
      </div>

      <div className="flex gap-4">
        <div className="w-1/3">
          <EmailList emails={emails} onSelectEmail={setSelectedEmail} />
        </div>
        <div className="w-2/3">
          {selectedEmail ? (
            <EmailViewer email={selectedEmail} />
          ) : (
            <div className="text-gray-600 p-4">Select an email to view</div>
          )}
        </div>
      </div>
    </div>
  );
}