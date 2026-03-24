import { useState, useCallback } from "react";

const BASE_URL = "/api/contactAPI";

// ─── Helper ───────────────────────────────────────────────────────────────────
const request = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.message || `Request failed with status ${res.status}`);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
export const useContactAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const run = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      let errorMessage = err.message || "Something went wrong";
      
      // Handle specific error cases
      if (err.status === 409 && err.data?.errors) {
        // Return the specific field errors for 409 conflicts
        return { error: true, fieldErrors: err.data.errors, message: err.message };
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── GET all contacts ──────────────────────────────────────────────────────
  // GET /api/contactAPI
  const fetchContacts = useCallback(() =>
    run(() => request(BASE_URL)),
  [run]);

  // ── GET single contact ────────────────────────────────────────────────────
  // GET /api/contactAPI/:id
  const fetchContactById = useCallback((id) =>
    run(() => request(`${BASE_URL}/${id}`)),
  [run]);

  // ── POST — add single contact manually ───────────────────────────────────
  // POST /api/contactAPI
  // body: { name, phone, source }
  const addContactManually = useCallback((form) =>
    run(() =>
      request(`${BASE_URL}/addManually`, {   // ← template literal with backticks
        method: "POST",
        headers: {
          "Content-Type": "application/json", // ← ADD THIS — critical for body parsing
        },
        body: JSON.stringify({
          name:   form.name,
          phone:  form.phone,
          source: form.source,
        }),
      })
    ),
  [run]);

  // ── POST — bulk import contacts from CSV ──────────────────────────────────
  // POST /api/contactAPI/import
  // body: { contacts: [...] }
  const importContacts = useCallback((rows) =>
    run(() =>
      request(`${BASE_URL}/importContact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ contacts: rows }),
      })
    ),
  [run]);

  // ── PUT — update a contact ────────────────────────────────────────────────
  // PUT /api/contactAPI/:id
  // body: { name, phone, source }
  const updateContact = useCallback((id, form) =>
    run(() =>
      request(`${BASE_URL}/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          name:   form.name,
          phone:  form.phone,
          source: form.source,
        }),
      })
    ),
  [run]);

  // ── DELETE — remove a contact ─────────────────────────────────────────────
  // DELETE /api/contactAPI/:id
  const deleteContact = useCallback((id) =>
    run(() =>
      request(`${BASE_URL}/${id}`, { method: "DELETE" })
    ),
  [run]);

  // ── DELETE — bulk delete contacts ─────────────────────────────────────────
  // DELETE /api/contactAPI
  // body: { ids: [...] }
  const deleteContacts = useCallback((ids) =>
    run(() =>
      request(BASE_URL, {
        method: "DELETE",
        body: JSON.stringify({ ids }),
      })
    ),
  [run]);

  return {
    // state
    loading,
    error,
    clearError: () => setError(null),

    // methods
    fetchContacts,
    fetchContactById,
    addContactManually,
    importContacts,
    updateContact,
    deleteContact,
    deleteContacts,
  };
};