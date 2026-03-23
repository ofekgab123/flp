"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Settings,
  Loader2,
  Users,
  RefreshCw,
  Trash2,
  FileText,
  Plus,
  FlaskConical,
} from "lucide-react";
import { toast } from "sonner";
import { YIT_DEFAULT_API_URL } from "@/app/location-pin/lib/yit";

const YIT_BASE_URL_STORAGE_KEY = "location-pin-yitBaseUrl";
const ADMIN_TOKEN_SESSION_KEY = "admin-token-session";
const ADMIN_PASSWORD_SESSION_KEY = "admin-password-session";
const ADMIN_PASSWORD = "6335";
const LFP_PUBLIC_BASE_URL = "https://api.pickmeup.co.il";
const DEFAULT_TEST_CLIENT_TOKEN = "d5f53356-c5df-4849-8c22-8fe560b9023a";

interface ClientItem {
  clientToken: string;
  yitApiToken: string;
  createdAt: string;
}

interface SaveRequestItem {
  id: number;
  clientToken: string;
  city: string;
  street: string;
  house: string | null;
  lat: number;
  lng: number;
  yitApiTokenMasked: string;
  status: string;
  yitResponse: string | null;
  createdAt: string;
}

const STATUS_LABELS: Record<string, string> = {
  not_sent: "לא נשלחה",
  sent: "נשלחה",
  approved: "אושר",
  rejected: "לא אושר",
};

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
  const [activeTab, setActiveTab] = useState<"settings" | "requests" | "test">("settings");
  const [requests, setRequests] = useState<SaveRequestItem[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [testCity, setTestCity] = useState("");
  const [testStreet, setTestStreet] = useState("");
  const [testHouse, setTestHouse] = useState("");
  const [testClientToken, setTestClientToken] = useState(DEFAULT_TEST_CLIENT_TOKEN);
  const [testOpenLoading, setTestOpenLoading] = useState(false);
  const [appOrigin, setAppOrigin] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;
    setAppOrigin(window.location.origin);
  }, [isMounted]);

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

  const getAdminAuthToken = useCallback(() => {
    if (typeof window === "undefined") return "";
    return (
      sessionStorage.getItem(ADMIN_TOKEN_SESSION_KEY)?.trim() ||
      addClientAdminToken.trim() ||
      viewToken.trim() ||
      adminToken.trim()
    );
  }, [addClientAdminToken, viewToken, adminToken]);

  const fetchRequests = useCallback(async () => {
    const token = getAdminAuthToken();
    if (!token) {
      toast.error(
        'הזן טוקן אדמין: לחץ "שמור טוקן אדמין" או הזן בשדה "טוקן אדמין לצפייה" בטבלת הלקוחות ולחץ "הצג לקוחות"'
      );
      return;
    }
    setRequestsLoading(true);
    try {
      const res = await fetch("/api/admin/requests", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        try {
          sessionStorage.setItem(ADMIN_TOKEN_SESSION_KEY, token);
        } catch {
          /* ignore */
        }
        setRequests(data.requests ?? []);
      } else {
        setRequests([]);
        toast.error(data.error || "שגיאה בטעינת בקשות");
      }
    } catch {
      setRequests([]);
      toast.error("שגיאה בטעינת בקשות");
    } finally {
      setRequestsLoading(false);
    }
  }, [getAdminAuthToken]);

  const handleOpenTestLfp = async () => {
    const token = getAdminAuthToken();
    if (!token) {
      toast.error(
        "הזן טוקן אדמין (שמירה למעלה או שדה הצפייה בלקוחות) לפני פתיחת הקישור"
      );
      return;
    }
    const city = testCity.trim();
    const street = testStreet.trim();
    if (!city || !street) {
      toast.error("הזן עיר ורחוב");
      return;
    }
    setTestOpenLoading(true);
    try {
      const res = await fetch("/api/admin/build-location-pin-url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          clientToken: testClientToken.trim() || DEFAULT_TEST_CLIENT_TOKEN,
          city,
          street,
          house: testHouse.trim() || undefined,
          baseUrl: LFP_PUBLIC_BASE_URL,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.url) {
        try {
          sessionStorage.setItem(ADMIN_TOKEN_SESSION_KEY, token);
        } catch {
          /* ignore */
        }
        window.open(data.url as string, "_blank", "noopener,noreferrer");
      } else {
        toast.error(data.error || "שגיאה ביצירת הקישור");
      }
    } catch {
      toast.error("שגיאה ביצירת הקישור");
    } finally {
      setTestOpenLoading(false);
    }
  };

  const fetchClients = useCallback(async () => {
    const token = getAdminAuthToken();
    if (!token) {
      toast.error(
        'הזן טוקן אדמין: "שמור טוקן אדמין" או שדה "הצג לקוחות" ואז רענן'
      );
      return;
    }
    setClientsLoading(true);
    try {
      const res = await fetch("/api/admin/clients", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        try {
          sessionStorage.setItem(ADMIN_TOKEN_SESSION_KEY, token);
        } catch {
          /* ignore */
        }
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
  }, [getAdminAuthToken]);

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
    const token = getAdminAuthToken();
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

        <div className="mb-6 flex gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === "settings"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <Settings className="h-4 w-4" />
            הגדרות
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("requests");
              fetchRequests();
            }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === "requests"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <FileText className="h-4 w-4" />
            בקשות
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("test")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition ${
              activeTab === "test"
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-600 hover:text-slate-800"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            בדיקה
          </button>
        </div>

        {activeTab === "requests" ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-slate-800">
              <FileText className="h-5 w-5 text-slate-600" />
              היסטוריית בקשות שמירת מיקום
            </h2>
            <p className="mb-3 text-sm text-slate-500">
              רשימת הבקשות שנשלחו מ-LFP, עם clientToken, פרמטרים, טוקן YIT (מקוצר), סטטוס ותאריך. נדרש אותו טוקן
              אדמין כמו לטבלת לקוחות: אם אין נתונים, הזן טוקן בשדה "הצג לקוחות" בטאב הגדרות ולחץ "הצג לקוחות",
              או "שמור טוקן אדמין".
            </p>
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
              <span className="font-medium">מאיפה הנתונים: </span>
              {appOrigin || "…"} — הבקשות נקראות מהמסד של <strong>המופע הזה בלבד</strong> (אותו{" "}
              <code className="rounded bg-amber-100 px-1 text-xs" dir="ltr">
                DATABASE_URL
              </code>{" "}
              כמו בשרת שמקבל את שמירת המיקום). אם שמרת מיקום מדומיין אחר (למשל production) ואתה פותח אדמין
              מ-localhost או להפך, הטבלה כאן תישאר ריקה.
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={fetchRequests}
                disabled={requestsLoading}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                {requestsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                רענן
              </button>
              {!requestsLoading && (
                <span className="text-sm text-slate-500">רשומות במסד (מופע זה): {requests.length}</span>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-3 py-2 text-right font-medium text-slate-700">תאריך</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-700">clientToken</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-700">עיר / רחוב / בית</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-700">קואורדינטות</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-700">טוקן YIT</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-700">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {requestsLoading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          טוען…
                        </span>
                      </td>
                    </tr>
                  ) : requests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                        אין בקשות רשומות (או שעדיין לא נשמרה בקשה במסד)
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-2 text-slate-600" dir="ltr">
                          {new Date(r.createdAt).toLocaleString("he-IL")}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-800" dir="ltr">
                          {r.clientToken}
                        </td>
                        <td className="px-3 py-2 text-slate-700">
                          {r.city} / {r.street}
                          {r.house ? ` / ${r.house}` : ""}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-600" dir="ltr">
                          {Number.isFinite(r.lat) && Number.isFinite(r.lng)
                            ? `${r.lat.toFixed(6)}, ${r.lng.toFixed(6)}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-slate-600" dir="ltr">
                          {r.yitApiTokenMasked}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded px-2 py-0.5 text-xs font-medium ${
                              r.status === "approved"
                                ? "bg-green-100 text-green-800"
                                : r.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : r.status === "not_sent"
                                    ? "bg-slate-100 text-slate-700"
                                    : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "test" ? (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-2 flex items-center gap-2 text-base font-semibold text-slate-800">
              <FlaskConical className="h-5 w-5 text-slate-600" />
              בדיקת LFP ({LFP_PUBLIC_BASE_URL.replace(/^https:\/\//, "")})
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              הזן עיר, רחוב ומספר בית. בלחיצה על הפלוס נבנה קישור עם clientToken, otp ו-otphash תקפים, והדפדפן
              יפתח את מסך דקירת המיקום ב-production.
            </p>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="min-w-[140px] flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">clientToken</label>
                <input
                  type="text"
                  value={testClientToken}
                  onChange={(e) => setTestClientToken(e.target.value)}
                  placeholder={DEFAULT_TEST_CLIENT_TOKEN}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  dir="ltr"
                  autoComplete="off"
                />
              </div>
              <div className="min-w-[120px] flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">עיר</label>
                <input
                  type="text"
                  value={testCity}
                  onChange={(e) => setTestCity(e.target.value)}
                  placeholder="למשל תל אביב"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  autoComplete="off"
                />
              </div>
              <div className="min-w-[120px] flex-1">
                <label className="mb-1 block text-xs font-medium text-slate-600">רחוב</label>
                <input
                  type="text"
                  value={testStreet}
                  onChange={(e) => setTestStreet(e.target.value)}
                  placeholder="שם רחוב"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  autoComplete="off"
                />
              </div>
              <div className="min-w-[100px] flex-1 sm:max-w-[140px]">
                <label className="mb-1 block text-xs font-medium text-slate-600">מספר</label>
                <input
                  type="text"
                  value={testHouse}
                  onChange={(e) => setTestHouse(e.target.value)}
                  placeholder="מס׳ בית"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  autoComplete="off"
                />
              </div>
              <button
                type="button"
                onClick={handleOpenTestLfp}
                disabled={testOpenLoading}
                title="פתח קישור בדיקה"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 sm:h-[42px]"
              >
                {testOpenLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-6 w-6" strokeWidth={2.5} />
                )}
              </button>
            </div>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
}
