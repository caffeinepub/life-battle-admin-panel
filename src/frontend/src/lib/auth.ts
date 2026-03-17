import { get, ref } from "firebase/database";
import { db } from "./firebase";

const ADMIN_SESSION_KEY = "lb_admin_session";
const HOST_SESSION_KEY = "lb_host_session";
const ADMIN_ID = "abhi@16";
const ADMIN_PASSWORD = "hagh9876";

export function loginAdmin(id: string, password: string): boolean {
  if (id === ADMIN_ID && password === ADMIN_PASSWORD) {
    localStorage.setItem(ADMIN_SESSION_KEY, "authenticated");
    localStorage.removeItem(HOST_SESSION_KEY);
    return true;
  }
  return false;
}

export async function loginHost(
  username: string,
  password: string,
): Promise<{ success: boolean; hostId?: string; hostName?: string }> {
  try {
    const snap = await get(ref(db, "/hosts"));
    const data = snap.val() || {};
    for (const [id, h] of Object.entries(data) as [string, any][]) {
      if (h.username === username && h.password === password) {
        const session = JSON.stringify({ hostId: id, hostName: h.hostName });
        localStorage.setItem(HOST_SESSION_KEY, session);
        localStorage.removeItem(ADMIN_SESSION_KEY);
        return { success: true, hostId: id, hostName: h.hostName };
      }
    }
    return { success: false };
  } catch {
    return { success: false };
  }
}

// Legacy alias for ProtectedRoute
export function login(id: string, password: string): boolean {
  return loginAdmin(id, password);
}

export function logout(): void {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(HOST_SESSION_KEY);
}

export function isAuthenticated(): boolean {
  return (
    localStorage.getItem(ADMIN_SESSION_KEY) === "authenticated" ||
    !!localStorage.getItem(HOST_SESSION_KEY)
  );
}

export function isAdmin(): boolean {
  return localStorage.getItem(ADMIN_SESSION_KEY) === "authenticated";
}

export function getHostSession(): {
  hostId: string;
  hostName: string;
} | null {
  const s = localStorage.getItem(HOST_SESSION_KEY);
  if (!s) return null;
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
