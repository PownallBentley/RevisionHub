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

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, country, created_at, updated_at, avatar_url")
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

  /**
   * Hydrates all auth state from a session.
   * Returns true if successful, false if session is null (logged out).
   */
  async function hydrateFromSession(s: Session | null): Promise<boolean> {
    const u = s?.user ?? null;

    if (!u) {
      // User logged out - clear everything
      setSession(null);
      setUser(null);
      setProfile(null);
      setActiveChildId(null);
      setParentChildCount(null);
      return false;
    }

    // User is logged in - set session and user immediately
    setSession(s);
    setUser(u);

    // Fetch profile and childId in parallel
    const [p, childId] = await Promise.all([
      fetchProfile(u.id),
      fetchMyChildId()
    ]);

    // Set activeChildId (only children have this)
    setActiveChildId(childId);

    // If this is a child, fetch their details for display purposes
    if (childId) {
      const childProfile = await fetchChildProfile(childId);
      
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
      } else {
        setProfile(null);
      }
      setParentChildCount(null);
    } else {
      // Parent or unknown - set their profile
      setProfile(p);
      
      if (p) {
        // Parent - fetch their child count
        const count = await fetchParentChildCount(u.id);
        setParentChildCount(count);
      } else {
        setParentChildCount(null);
      }
    }

    return true;
  }

  async function resolveAuth(source: string, opts?: { showLoading?: boolean }) {
    if (resolvingRef.current) return;
    resolvingRef.current = true;

    const showLoading = opts?.showLoading ?? false;

    try {
      if (showLoading) setLoading(true);

      const { data, error } = await supabase.auth.getSession();

      if (error) console.warn("[auth] getSession error:", source, error);

      await hydrateFromSession(data?.session ?? null);
      hydratedOnceRef.current = true;
    } catch (e) {
      console.warn("[auth] resolveAuth failed:", source, e);
      hydratedOnceRef.current = true;
      // Don't wipe state on error - leave whatever we had
    } finally {
      setLoading(false);
      resolvingRef.current = false;
    }
  }

  async function refresh() {
    await resolveAuth("manual refresh", { showLoading: false });
  }

  useEffect(() => {
    let mounted = true;

    // Initial auth resolution
    (async () => {
      if (!mounted) return;
      await resolveAuth("initial mount", { showLoading: true });
    })();

    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (!mounted) return;

      console.log("[auth] onAuthStateChange:", event);

      // For SIGNED_OUT, clear state immediately
      if (event === "SIGNED_OUT" || !newSession) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setActiveChildId(null);
        setParentChildCount(null);
        setLoading(false);
        return;
      }

      // For other events (SIGNED_IN, TOKEN_REFRESHED, etc.)
      // Only update if we haven't hydrated yet, or if this is a new sign-in
      if (event === "SIGNED_IN" || !hydratedOnceRef.current) {
        (async () => {
          try {
            await hydrateFromSession(newSession);
            hydratedOnceRef.current = true;
          } catch (e) {
            console.warn("[auth] onAuthStateChange hydrate failed:", e);
            // DON'T wipe state on error - the user might still be valid
            // Just log and continue with existing state
          } finally {
            setLoading(false);
          }
        })();
      } else if (event === "TOKEN_REFRESHED") {
        // Just update session/user, don't re-fetch everything
        setSession(newSession);
        setUser(newSession.user);
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
    // Clear state immediately for instant UI response
    setSession(null);
    setUser(null);
    setProfile(null);
    setActiveChildId(null);
    setParentChildCount(null);
    
    // Then tell Supabase (this triggers onAuthStateChange but we've already cleared)
    await supabase.auth.signOut();
  }

  // CORRECT LOGIC based on actual data model:
  // - Parents have a profile row, no activeChildId
  // - Children have no profile row in profiles table, but have activeChildId
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