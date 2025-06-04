export default function EmailList({ emails, onSelectEmail }) {
  return (
    <div className="space-y-2">
      {emails.map((email) => (
        <div
          key={email._id}
          className="p-3 bg-white rounded shadow hover:bg-gray-100 cursor-pointer"
          onClick={() => onSelectEmail(email)}
        >
          <div className="font-semibold truncate">{email.subject}</div>
          <div className="text-sm text-gray-600">{email.from}</div>
          <div className="text-xs text-blue-500">{email.category}</div>
        </div>
      ))}
    </div>
  );
}
