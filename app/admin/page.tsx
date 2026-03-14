"use client";

import { useEffect, useState, useCallback } from "react";
import { Settings, Loader2, Users, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { YIT_DEFAULT_API_URL } from "@/app/location-pin/lib/yit";

const YIT_BASE_URL_STORAGE_KEY = "location-pin-yitBaseUrl";
const ADMIN_TOKEN_SESSION_KEY = "admin-token-session";
const ADMIN_PASSWORD_SESSION_KEY = "admin-password-session";
const ADMIN_PASSWORD = "6335";

interface ClientItem {
  clientToken: string;
  yitApiToken: string;
  createdAt: string;
}

export default function AdminPage() {
  const [yitBaseUrl, setYitBaseUrl] = useState(YIT_DEFAULT_API_URL);
  const [adminToken, setAdminToken] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [tokenExists, setTokenExists] = useState(false);
  const [saveTokenLoading, setSaveTokenLoading] = useState(false);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [viewToken, setViewToken] = useState("");
  const [newYitApiToken, setNewYitApiToken] = useState("");
  const [addClientAdminToken, setAddClientAdminToken] = useState("");
  const [addClientLoading, setAddClientLoading] = useState(false);
  const [lastCreatedClientToken, setLastCreatedClientToken] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;
    setUnlocked(sessionStorage.getItem(ADMIN_PASSWORD_SESSION_KEY) === "1");
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;
    const storedYit = localStorage.getItem(YIT_BASE_URL_STORAGE_KEY);
    if (storedYit) setYitBaseUrl(storedYit);
    fetch("/api/admin/token-exists")
      .then((r) => r.json())
      .then((data) => setTokenExists(!!data.exists))
      .catch(() => setTokenExists(false));
  }, [isMounted]);

  const fetchClients = useCallback(async () => {
    const token = typeof window !== "undefined" ? sessionStorage.getItem(ADMIN_TOKEN_SESSION_KEY) : null;
    if (!token) {
      toast.error("הזן טוקן אדמין לצפייה בלקוחות");
      return;
    }
    setClientsLoading(true);
    try {
      const res = await fetch("/api/admin/clients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setClients(data.clients ?? []);
      } else {
        setClients([]);
        toast.error(data.error || "שגיאה בטעינת לקוחות");
      }
    } catch {
      setClients([]);
      toast.error("שגיאה בטעינת לקוחות");
    } finally {
      setClientsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;
    const token = sessionStorage.getItem(ADMIN_TOKEN_SESSION_KEY);
    if (token) {
      fetchClients();
    }
  }, [isMounted, fetchClients]);

  const handleSetAdminToken = async () => {
    const token = adminToken.trim();
    if (!token) {
      toast.error("יש להזין טוקן");
      return;
    }
    setSaveTokenLoading(true);
    try {
      const res = await fetch("/api/admin/set-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setTokenExists(true);
        setAdminToken("");
        try {
          sessionStorage.setItem(ADMIN_TOKEN_SESSION_KEY, token);
        } catch {
          /* ignore */
        }
        toast.success("טוקן אדמין נשמר. השתמש ב-Authorization: Bearer עם POST /api/admin/init-client");
      } else {
        toast.error(data.error || "שמירה נכשלה");
      }
    } catch {
      toast.error("שגיאה בשמירה");
    } finally {
      setSaveTokenLoading(false);
    }
  };

  const handleViewClients = () => {
    const token = viewToken.trim();
    if (!token) {
      toast.error("הזן טוקן אדמין");
      return;
    }
    try {
      sessionStorage.setItem(ADMIN_TOKEN_SESSION_KEY, token);
    } catch {
      /* ignore */
    }
    fetchClients();
  };

  const handleAddClient = async () => {
    const yitToken = newYitApiToken.trim();
    if (!yitToken) {
      toast.error("הזן את ה-yitApiToken שקיבלת ממאיה תור");
      return;
    }
    const adminTok =
      sessionStorage.getItem(ADMIN_TOKEN_SESSION_KEY) ||
      addClientAdminToken.trim() ||
      viewToken.trim() ||
      adminToken.trim();
    if (!adminTok) {
      toast.error("הזן קודם טוקן אדמין (למעלה) ושמור, או הזן טוקן אדמין לצפייה");
      return;
    }
    setAddClientLoading(true);
    setLastCreatedClientToken("");
    try {
      const res = await fetch("/api/admin/init-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminTok}`,
        },
        body: JSON.stringify({ yitApiToken: yitToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setNewYitApiToken("");
        setLastCreatedClientToken(data.clientToken ?? "");
        fetchClients();
        toast.success("לקוח נוסף! העבר את ה-clientToken למאיה תור");
      } else if (res.status === 401) {
        toast.error("טוקן אדמין לא נכון. וודא שהזנת את אותו טוקן ששמרת בסעיף 'טוקן אדמין' למעלה.");
      } else if (res.status === 500) {
        toast.error("טוקן אדמין לא הוגדר. קודם הזן טוקן אדמין בסעיף למעלה ולחץ 'שמור טוקן אדמין'.");
      } else {
        toast.error(data.error || "שגיאה בהוספת לקוח");
      }
    } catch {
      toast.error("שגיאה בהוספת לקוח");
    } finally {
      setAddClientLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword.trim() === ADMIN_PASSWORD) {
      try {
        sessionStorage.setItem(ADMIN_PASSWORD_SESSION_KEY, "1");
        setUnlocked(true);
        setAdminPassword("");
        toast.success("נכנסת בהצלחה");
      } catch {
        toast.error("שגיאה");
      }
    } else {
      toast.error("סיסמה שגויה");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(ADMIN_PASSWORD_SESSION_KEY);
    setUnlocked(false);
    toast.success("יצאת מהמערכת");
  };

  const handleDeleteClient = async (clientToken: string) => {
    const token = sessionStorage.getItem(ADMIN_TOKEN_SESSION_KEY);
    if (!token) {
      toast.error("הזן טוקן אדמין לצפייה בלקוחות");
      return;
    }
    if (!confirm(`למחוק את הלקוח ${clientToken}?`)) return;
    setDeleteLoading(clientToken);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ clientToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setClients((prev) => prev.filter((c) => c.clientToken !== clientToken));
        toast.success("הלקוח נמחק");
      } else {
        toast.error(data.error || "שגיאה במחיקה");
      }
    } catch {
      toast.error("שגיאה במחיקה");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleSaveBaseUrl = () => {
    const value = yitBaseUrl.trim() || YIT_DEFAULT_API_URL;
    try {
      localStorage.setItem(YIT_BASE_URL_STORAGE_KEY, value);
      toast.success("Base URL נשמר");
    } catch {
      toast.error("שמירה נכשלה");
    }
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
        <form
          onSubmit={handlePasswordSubmit}
          className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="mb-4 text-center text-lg font-semibold text-slate-800">כניסה לאדמין</h2>
          <label className="mb-2 block text-sm font-medium text-slate-600">סיסמה</label>
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="הזן סיסמה"
            className="mb-4 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            autoComplete="off"
            autoFocus
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            כניסה
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-slate-600" />
            <h1 className="text-xl font-semibold text-slate-800">הגדרות אדמין</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            יציאה
          </button>
        </div>

        <div className="space-y-6">
          {/* YIT Base URL */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-base font-semibold text-slate-800">
              כתובת API – שמירת מיקום
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Base URL לבקשות שמירת מיקום ל-YIT. הבקשה הבאה בלחיצה על &quot;שמור מיקום&quot; תפנה לכתובת הזאת.
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Base URL
                </label>
                <input
                  type="url"
                  value={yitBaseUrl}
                  onChange={(e) => setYitBaseUrl(e.target.value)}
                  placeholder={YIT_DEFAULT_API_URL}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  dir="ltr"
                />
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <span className="text-xs font-medium text-slate-500">כתובת מלאה: </span>
                <code className="break-all text-xs text-slate-700" dir="ltr">
                  {yitBaseUrl.trim() || YIT_DEFAULT_API_URL}
                </code>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveBaseUrl}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                שמור Base URL
              </button>
              <button
                type="button"
                onClick={() => setYitBaseUrl(YIT_DEFAULT_API_URL)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                איפוס לברירת מחדל
              </button>
            </div>
          </div>

          {/* Admin Token */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-base font-semibold text-slate-800">
              טוקן אדמין
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              הטוקן נשמר בשרת ומשמש ל-POST /api/admin/init-client (Authorization: Bearer).
            </p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  טוקן אדמין
                </label>
                <input
                  type="password"
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSetAdminToken()}
                  placeholder="הזן טוקן לאבטחת init-client"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  dir="ltr"
                  autoComplete="off"
                />
              </div>
            </div>
            <div className="mt-4">
              <button
                type="button"
                onClick={handleSetAdminToken}
                disabled={saveTokenLoading}
                className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saveTokenLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                שמור טוקן אדמין
              </button>
            </div>
          </div>

          {/* Add Client */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 text-base font-semibold text-slate-800">הוסף לקוח חדש</h2>
            <p className="mb-4 text-sm text-slate-500">
              מאיה תור נתנו לך yitApiToken? הזן אותו כאן. תקבל clientToken להעברה אליהם.
            </p>
            <div className="mb-4 flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  טוקן אדמין (אותו טוקן ששמרת למעלה)
                </label>
                <input
                  type="password"
                  value={addClientAdminToken}
                  onChange={(e) => setAddClientAdminToken(e.target.value)}
                  placeholder="הזן טוקן אדמין – חייב להתאים לזה ששמרת"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  dir="ltr"
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  yitApiToken (שקיבלת ממאיה תור)
                </label>
                <input
                  type="password"
                  value={newYitApiToken}
                  onChange={(e) => setNewYitApiToken(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddClient()}
                  placeholder="הדבק כאן את הטוקן שקיבלת"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  dir="ltr"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={handleAddClient}
                disabled={addClientLoading}
                className="flex items-center justify-center gap-2 self-start rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {addClientLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                הוסף לקוח
              </button>
              {lastCreatedClientToken && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="mb-1 text-xs font-medium text-green-800">clientToken שנוצר – העבר למאיה תור:</p>
                  <code className="block break-all font-mono text-sm text-green-900" dir="ltr">
                    {lastCreatedClientToken}
                  </code>
                </div>
              )}
            </div>
          </div>

          {/* Clients Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-800">
              <Users className="h-5 w-5 text-slate-600" />
              טבלת לקוחות
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              רשימת כל הלקוחות הרשומים במערכת. clientToken מועבר ב-URL של LFP. yitApiToken נשמר בשרת ומשמש לשליחה ל-YIT.
            </p>
            <div className="mb-4 flex flex-wrap gap-2">
              <input
                type="password"
                value={viewToken}
                onChange={(e) => setViewToken(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleViewClients()}
                placeholder="הזן טוקן אדמין לצפייה"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                dir="ltr"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={handleViewClients}
                className="rounded-lg bg-slate-600 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                הצג לקוחות
              </button>
              <button
                type="button"
                onClick={fetchClients}
                disabled={clientsLoading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {clientsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                רענן
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-right font-medium text-slate-700">clientToken</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-700">yitApiToken</th>
                    <th className="px-4 py-3 text-right font-medium text-slate-700">נוצר בתאריך</th>
                    <th className="w-12 px-2 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {clients.length === 0 && !clientsLoading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                        אין לקוחות או הזן טוקן אדמין למעלה
                      </td>
                    </tr>
                  ) : (
                    clients.map((c) => (
                      <tr key={c.clientToken} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3 font-mono text-xs text-slate-800" dir="ltr">
                          {c.clientToken}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-slate-600" dir="ltr">
                          {c.yitApiToken}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{c.createdAt}</td>
                        <td className="px-2 py-3">
                          <button
                            type="button"
                            onClick={() => handleDeleteClient(c.clientToken)}
                            disabled={deleteLoading === c.clientToken}
                            className="rounded p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
                            title="מחק לקוח"
                          >
                            {deleteLoading === c.clientToken ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
