const BASE_URL = "http://localhost:5000/api/";
// const BASE_URL = "https://reachinbox-onebox-assignment.onrender.com/api/";

export async function fetchEmails() {
  const res = await fetch(BASE_URL);
  const data = await res.json();
  return data;
}

export async function searchEmails(query) {
  const params = new URLSearchParams(query).toString();
  const res = await fetch(`${BASE_URL}emails?${params}`);
  const data = await res.json();
  return data;
}

export const getReplySuggestions = async (subject, body) => {
  const res = await fetch(`${BASE_URL}ai-reply/generate-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, body })
  });

  if (!res.ok) {
    throw new Error('Failed to fetch reply suggestions');
  }

  return res;
};

export const generateReply = async (subject, body) => {
  const res = await fetch(`${BASE_URL}generate-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, body })
  });

  if (!res.ok) {
    throw new Error('Failed to fetch reply suggestions');
  }

  return res;
};

export const sendMailReply = async (to, subject, text, messageId) => {
  const res = await fetch(`${BASE_URL}send-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, text, messageId })
  });

  if (!res.ok) {
    throw new Error('Failed to send reply');
  }

  const data = await res.json();
  return data;
};
