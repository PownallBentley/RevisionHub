// src/contexts/AuthContext.tsx

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: "parent" | "child" | string;
  country: string | null;
  created_at: string | null;
  updated_at: string | null;
  avatar_url?: string | null;
  first_name?: string | null;
  preferred_name?: string | null;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  loading: boolean;

  profile: Profile | null;
  activeChildId: string | null;
  parentChildCount: number | null;

  isParent: boolean;
  isChild: boolean;
  isUnresolved: boolean;

  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;

  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timeoutId: any;
  const timeout = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`Timeout: ${label}`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

// Bolt/StackBlitz can be very slow for auth init + storage recovery.
const AUTH_TIMEOUT_MS = 30000;

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, country, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[auth] fetchProfile error:", error);
    return null;
  }
  return (data ?? null) as Profile | null;
}

async function fetchParentChildCount(parentId: string): Promise<number | null> {
  const { count, error } = await supabase
    .from("children")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", parentId);

  if (error) {
    console.warn("[auth] fetchParentChildCount error:", error);
    return null;
  }
  return typeof count === "number" ? count : null;
}

async function fetchMyChildId(): Promise<string | null> {
  const { data, error } = await supabase.rpc("rpc_get_my_child_id");

  if (error) {
    console.warn("[auth] rpc_get_my_child_id error:", error);
    return null;
  }
  return data ? String(data) : null;
}

async function fetchChildProfile(childId: string): Promise<Partial<Profile> | null> {
  const { data, error } = await supabase
    .from("children")
    .select("id, first_name, preferred_name, avatar_url, email")
    .eq("id", childId)
    .maybeSingle();

  if (error) {
    console.warn("[auth] fetchChildProfile error:", error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    first_name: data.first_name,
    preferred_name: data.preferred_name,
    avatar_url: data.avatar_url,
    email: data.email,
    full_name: data.preferred_name || data.first_name,
  };
}

async function ensureParentProfile(params: { userId: string; email: string; fullName?: string }): Promise<void> {
  const { userId, email, fullName } = params;

  const existing = await fetchProfile(userId);
  if (existing) return;

  const { error } = await supabase.from("profiles").insert({
    id: userId,
    email,
    full_name: fullName ?? null,
    role: "parent",
  });

  if (error) console.warn("[auth] ensureParentProfile insert failed:", error);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [parentChildCount, setParentChildCount] = useState<number | null>(null);

  const resolvingRef = useRef(false);
  const hydratedOnceRef = useRef(false);

  async function hydrateFromSession(s: Session | null) {
    const u = s?.user ?? null;

    setSession(s);
    setUser(u);

    if (!u) {
      setProfile(null);
      setActiveChildId(null);
      setParentChildCount(null);
      return;
    }

    // Fetch profile and childId in parallel - no timeout
    const [p, childId] = await Promise.all([
      fetchProfile(u.id),
      fetchMyChildId()
    ]);

    // Set profile (only parents have this)
    setProfile(p);
    
    // Set activeChildId (only children have this)
    setActiveChildId(childId);

    // If this is a child, fetch their details for display purposes
    if (childId) {
      const childProfile = await fetchChildProfile(childId);
      
      // Store child details in profile for display (but keep it separate conceptually)
      if (childProfile) {
        setProfile({
          id: childProfile.id || '',
          email: childProfile.email || '',
          full_name: childProfile.full_name || null,
          first_name: childProfile.first_name,
          preferred_name: childProfile.preferred_name,
          avatar_url: childProfile.avatar_url,
          role: "child",
          country: null,
          created_at: null,
          updated_at: null,
        } as Profile);
      }
      setParentChildCount(null);
    } else if (p) {
      // Parent - fetch their child count
      const count = await fetchParentChildCount(u.id);
      setParentChildCount(count);
    } else {
      setParentChildCount(null);
    }
  }

  async function resolveAuth(source: string, opts?: { showLoading?: boolean }) {
    if (resolvingRef.current) return;
    resolvingRef.current = true;

    const showLoading = opts?.showLoading ?? false;

    try {
      if (showLoading) setLoading(true);

      // Don't timeout getSession - let Supabase handle its own timing
      const { data, error } = await supabase.auth.getSession();

      if (error) console.warn("[auth] getSession error:", source, error);

      await hydrateFromSession(data?.session ?? null);
      hydratedOnceRef.current = true;
    } catch (e) {
      console.warn("[auth] resolveAuth failed:", source, e);
      hydratedOnceRef.current = true;

      // Don't wipe state on error - leave whatever we had
      // This prevents children from being logged out due to transient errors
    } finally {
      if (showLoading) setLoading(false);
      resolvingRef.current = false;
    }
  }

  async function refresh() {
    await resolveAuth("manual refresh", { showLoading: false });
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      if (!mounted) return;
      await resolveAuth("initial mount", { showLoading: true });
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;

      try {
        await withTimeout(hydrateFromSession(newSession), AUTH_TIMEOUT_MS, "hydrateFromSession (event)");
        hydratedOnceRef.current = true;
      } catch (e) {
        console.warn("[auth] onAuthStateChange hydrate failed:", e);
        hydratedOnceRef.current = true;

        setSession(null);
        setUser(null);
        setProfile(null);
        setActiveChildId(null);
        setParentChildCount(null);
      } finally {
        if (!hydratedOnceRef.current) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  }

  async function signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName ?? "" } },
    });

    try {
      const newUserId = data?.user?.id;
      const newEmail = data?.user?.email ?? email;
      if (!error && newUserId) {
        await ensureParentProfile({ userId: newUserId, email: newEmail, fullName });
      }
    } catch (e) {
      console.warn("[auth] post-signup work failed:", e);
    }

    return { data, error };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setActiveChildId(null);
    setParentChildCount(null);
  }

  // CORRECT LOGIC based on actual data model:
  // - Parents have a profile row, no activeChildId
  // - Children have no profile row, but have activeChildId (from children table)
  const isParent = !!profile && !activeChildId;
  const isChild = !!activeChildId;
  const isUnresolved = !!user && !isParent && !isChild;

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      profile,
      activeChildId,
      parentChildCount,
      isParent,
      isChild,
      isUnresolved,
      signIn,
      signUp,
      signOut,
      refresh,
    }),
    [user, session, loading, profile, activeChildId, parentChildCount, isParent, isChild, isUnresolved]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}