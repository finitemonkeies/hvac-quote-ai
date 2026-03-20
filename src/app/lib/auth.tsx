import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import {
  fetchCurrentUserProfile,
  fetchWorkspaceMembers,
  joinWorkspaceByCode,
  supabase,
  type UserProfile,
  type WorkspaceMember,
  updateCurrentWorkspace,
  updateCurrentUserRole,
  updateWorkspaceMemberRole,
  upsertUserProfile,
} from "../services/supabase";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  members: WorkspaceMember[];
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setRole: (role: UserProfile["role"]) => Promise<void>;
  updateWorkspace: (input: { name?: string }) => Promise<void>;
  joinWorkspace: (joinCode: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: WorkspaceMember["role"]) => Promise<void>;
  refreshMembers: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!active) {
        return;
      }

      if (error) {
        console.warn("Failed to read Supabase session", error);
      }

      setSession(data.session);
      setUser(data.session?.user ?? null);

      if (data.session?.user) {
        await upsertUserProfile(data.session.user);
        const nextProfile = await fetchCurrentUserProfile();
        const nextMembers = await fetchWorkspaceMembers();
        if (active) {
          setProfile(nextProfile);
          setMembers(nextMembers);
        }
      } else {
        setProfile(null);
        setMembers([]);
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setLoading(false);

      if (nextSession?.user) {
        void upsertUserProfile(nextSession.user);
        void fetchCurrentUserProfile().then((nextProfile) => {
          setProfile(nextProfile);
        });
        void fetchWorkspaceMembers().then((nextMembers) => {
          setMembers(nextMembers);
        });
      } else {
        setProfile(null);
        setMembers([]);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      profile,
      members,
      session,
      loading,
      signIn: async (email: string, password: string) => {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          throw error;
        }
      },
      signUp: async (email: string, password: string) => {
        if (!supabase) {
          throw new Error("Supabase is not configured.");
        }

        const { error } = await supabase.auth.signUp({ email, password });
        if (error) {
          throw error;
        }
      },
      signOut: async () => {
        if (!supabase) {
          return;
        }

        const { error } = await supabase.auth.signOut();
        if (error) {
          throw error;
        }
      },
      setRole: async (role: UserProfile["role"]) => {
        await updateCurrentUserRole(role);
        const nextProfile = await fetchCurrentUserProfile();
        const nextMembers = await fetchWorkspaceMembers();
        setProfile(nextProfile);
        setMembers(nextMembers);
      },
      updateWorkspace: async (input: { name?: string }) => {
        await updateCurrentWorkspace(input);
        const nextProfile = await fetchCurrentUserProfile();
        setProfile(nextProfile);
      },
      joinWorkspace: async (joinCode: string) => {
        await joinWorkspaceByCode(joinCode);
        const nextProfile = await fetchCurrentUserProfile();
        const nextMembers = await fetchWorkspaceMembers();
        setProfile(nextProfile);
        setMembers(nextMembers);
      },
      updateMemberRole: async (memberId: string, role: WorkspaceMember["role"]) => {
        await updateWorkspaceMemberRole(memberId, role);
        const nextMembers = await fetchWorkspaceMembers();
        setMembers(nextMembers);
      },
      refreshMembers: async () => {
        const nextMembers = await fetchWorkspaceMembers();
        setMembers(nextMembers);
      },
    }),
    [loading, members, profile, session, user],
  );

  return createElement(AuthContext.Provider, { value }, children);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
