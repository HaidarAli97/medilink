import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  signIn,
  signUp,
  signOutUser,
  resetPassword,
  updateProfile as updateProfileService,
  onAuthChange,
} from "../services/authService";
import { homePathForRole } from "../config/roles";

const AuthContext = createContext(null);

export function AuthProvider({ children, initialUser = null }) {
  // `loading` is true while we resolve the persisted session — prevents a
  // redirect-to-login flash before we know whether the user is signed in.
  const [user, setUser] = useState(initialUser);
  const [loading, setLoading] = useState(initialUser === null);

  useEffect(() => {
    if (initialUser !== null) return; // SSR / test override — skip the listener
    const unsubscribe = onAuthChange((profile) => {
      setUser(profile);
      setLoading(false);
    });
    return unsubscribe;
  }, [initialUser]);

  const login = useCallback(async (email, password) => {
    const profile = await signIn(email, password);
    setUser(profile);
    return profile;
  }, []);

  // Public registration creates a patient account only.
  const register = useCallback(async ({ fullName, email, password }) => {
    const profile = await signUp({ fullName, email, password });
    return profile; // Does not auto-sign-in — user must go to login.
  }, []);

  const logout = useCallback(async () => {
    await signOutUser();
    setUser(null);
  }, []);

  const sendPasswordReset = useCallback(async (email) => {
    return resetPassword(email);
  }, []);

  // Update the signed-in user's own editable profile fields, then sync state.
  const updateProfile = useCallback(
    async (updates) => {
      if (!user) throw new Error("You must be signed in to update your profile.");
      const profile = await updateProfileService(user.uid, updates);
      setUser(profile);
      return profile;
    },
    [user],
  );

  // Convenience: the path the current user's role owns.
  const homePath = useMemo(
    () => (user ? homePathForRole(user.role) : "/login"),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      sendPasswordReset,
      updateProfile,
      homePath,
    }),
    [user, loading, login, register, logout, sendPasswordReset, updateProfile, homePath],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
