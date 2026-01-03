// src/contexts/AuthContext.tsx
//
// Production-ready auth context with:
// - Fast initial load (checks localStorage first)
// - Background profile hydration (doesn't block UI)
// - Instant logout (clears state immediately)
// - Proper error handling (doesn't wipe state on transient errors)

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

// =============================================================================
// TYPES
// =============================================================================

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
  // Core auth state
  user: User | null;
  session: Session | null;
  
  // Loading states
  loading: boolean;        // True only during initial auth check
  hydrating: boolean;      // True while fetching profile/role data
  
  // Profile and role data
  profile: Profile | null;
  activeChildId: string | null;
  parentChildCount: number | null;
  
  // Computed role flags
  isParent: boolean;
  isChild: boolean;
  isUnresolved: boolean;
  
  // Actions
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

// =============================================================================
// DATA FETCHING FUNCTIONS
// =============================================================================

async function fetchProfile(userId: string): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, country, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.warn("[auth] fetchProfile error:", error.message);
      return null;
    }
    return data as Profile | null;
  } catch (e) {
    console.warn("[auth] fetchProfile exception:", e);
    return null;
  }
}

async function fetchParentChildCount(parentId: string): Promise<number | null> {
  try {
    const { count, error } = await supabase
      .from("children")
      .select("id", { count: "exact", head: true })
      .eq("parent_id", parentId);

    if (error) {
      console.warn("[auth] fetchParentChildCount error:", error.message);
      return null;
    }
    return typeof count === "number" ? count : null;
  } catch (e) {
    console.warn("[auth] fetchParentChildCount exception:", e);
    return null;
  }
}

async function fetchMyChildId(): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc("rpc_get_my_child_id");

    if (error) {
      console.warn("[auth] rpc_get_my_child_id error:", error.message);
      return null;
    }
    return data ? String(data) : null;
  } catch (e) {
    console.warn("[auth] rpc_get_my_child_id exception:", e);
    return null;
  }
}

async function fetchChildProfile(childId: string): Promise<Partial<Profile> | null> {
  try {
    const { data, error } = await supabase
      .from("children")
      .select("id, first_name, preferred_name, avatar_url, email")
      .eq("id", childId)
      .maybeSingle();

    if (error) {
      console.warn("[auth] fetchChildProfile error:", error.message);
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
  } catch (e) {
    console.warn("[auth] fetchChildProfile exception:", e);
    return null;
  }
}

async function ensureParentProfile(params: { 
  userId: string; 
  email: string; 
  fullName?: string 
}): Promise<void> {
  const { userId, email, fullName } = params;

  try {
    const existing = await fetchProfile(userId);
    if (existing) return;

    const { error } = await supabase.from("profiles").insert({
      id: userId,
      email,
      full_name: fullName ?? null,
      role: "parent",
    });

    if (error) {
      console.warn("[auth] ensureParentProfile insert failed:", error.message);
    }
  } catch (e) {
    console.warn("[auth] ensureParentProfile exception:", e);
  }
}

// =============================================================================
// AUTH PROVIDER
// =============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  // Core auth state - set from localStorage/Supabase session
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);     // Initial auth check
  const [hydrating, setHydrating] = useState(false); // Profile fetching
  
  // Profile and role data - populated in background
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeChildId, setActiveChildId] = useState<string | null>(null);
  const [parentChildCount, setParentChildCount] = useState<number | null>(null);

  // Refs to prevent duplicate work
  const hydratingRef = useRef(false);
  const initializedRef = useRef(false);

  /**
   * Hydrates profile and role data for a user.
   * Runs in background - doesn't block UI.
   */
  async function hydrateUserData(u: User): Promise<void> {
    if (hydratingRef.current) return;
    hydratingRef.current = true;
    setHydrating(true);

    try {
      // Fetch profile and childId in parallel
      const [profileData, childId] = await Promise.all([
        fetchProfile(u.id),
        fetchMyChildId()
      ]);

      // Set activeChildId (only children have this)
      setActiveChildId(childId);

      if (childId) {
        // This is a child - fetch their display info
        const childProfile = await fetchChildProfile(childId);
        
        if (childProfile) {
          setProfile({
            id: childProfile.id || "",
            email: childProfile.email || "",
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
        // This is a parent (or unknown user type)
        setProfile(profileData);
        
        if (profileData) {
          // Fetch child count for parents
          const count = await fetchParentChildCount(u.id);
          setParentChildCount(count);
        } else {
          setParentChildCount(null);
        }
      }
    } catch (e) {
      console.warn("[auth] hydrateUserData failed:", e);
      // Don't clear state on error - keep whatever we have
    } finally {
      hydratingRef.current = false;
      setHydrating(false);
    }
  }

  /**
   * Clears all auth state immediately.
   */
  function clearAuthState(): void {
    setSession(null);
    setUser(null);
    setProfile(null);
    setActiveChildId(null);
    setParentChildCount(null);
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let mounted = true;

    async function initialize() {
      try {
        // Get session - Supabase checks localStorage first (fast),
        // then validates with server (can be slow)
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.warn("[auth] getSession error:", error.message);
        }

        const currentSession = data?.session ?? null;
        const currentUser = currentSession?.user ?? null;

        // Set core auth state
        setSession(currentSession);
        setUser(currentUser);
        
        // CRITICAL: Set loading to false immediately
        // This unblocks the UI - user can see Landing or start navigating
        setLoading(false);

        // If logged in, hydrate profile data in background
        if (currentUser) {
          hydrateUserData(currentUser);
        }
      } catch (e) {
        console.warn("[auth] initialize failed:", e);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initialize();

    // Listen for auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        if (!mounted) return;

        console.log("[auth] onAuthStateChange:", event);

        const newUser = newSession?.user ?? null;

        // Update core auth state immediately
        setSession(newSession);
        setUser(newUser);

        switch (event) {
          case "SIGNED_OUT":
            // Clear everything on sign out
            clearAuthState();
            break;

          case "SIGNED_IN":
            // New sign in - hydrate user data
            if (newUser) {
              hydrateUserData(newUser);
            }
            break;

          case "TOKEN_REFRESHED":
            // Token refreshed - session/user already updated above
            // No need to re-hydrate profile data
            break;

          case "USER_UPDATED":
            // User data changed - re-hydrate
            if (newUser) {
              hydrateUserData(newUser);
            }
            break;

          default:
            // INITIAL_SESSION and other events
            // If we have a user but no profile yet, hydrate
            if (newUser && !profile && !hydratingRef.current) {
              hydrateUserData(newUser);
            }
            break;
        }

        // Ensure loading is false after any auth event
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe();
    };
  }, []);

  // ===========================================================================
  // AUTH ACTIONS
  // ===========================================================================

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

    // Create parent profile if signup succeeded
    if (!error && data?.user?.id) {
      await ensureParentProfile({
        userId: data.user.id,
        email: data.user.email ?? email,
        fullName,
      });
    }

    return { data, error };
  }

  async function signOut() {
    // CRITICAL: Clear state IMMEDIATELY for instant UI feedback
    // Don't wait for Supabase - the user should see Landing right away
    clearAuthState();
    
    // Tell Supabase to sign out (runs in background)
    // The onAuthStateChange will fire but we've already cleared state
    supabase.auth.signOut().catch((e) => {
      console.warn("[auth] signOut error:", e);
    });
  }

  async function refresh() {
    if (user) {
      await hydrateUserData(user);
    }
  }

  // ===========================================================================
  // COMPUTED VALUES
  // ===========================================================================

  // Role detection based on actual data model:
  // - Parents: have a profile row in `profiles` table, no activeChildId
  // - Children: have activeChildId (from `children` table), may or may not have profile
  const isParent = !!profile && !activeChildId;
  const isChild = !!activeChildId;
  
  // User is logged in but we haven't determined their role yet
  // This happens briefly during hydration
  const isUnresolved = !!user && !isParent && !isChild && !hydrating;

  // ===========================================================================
  // CONTEXT VALUE
  // ===========================================================================

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      hydrating,
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
    [
      user,
      session,
      loading,
      hydrating,
      profile,
      activeChildId,
      parentChildCount,
      isParent,
      isChild,
      isUnresolved,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}