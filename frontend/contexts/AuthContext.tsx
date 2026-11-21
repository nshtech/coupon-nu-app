import React, { createContext, useCallback, useContext, useMemo, useState, ReactNode, useEffect } from 'react';
import { Alert } from 'react-native';
import { supabase } from '@/utils/supabase';
import { Session, User } from '@supabase/supabase-js';
import { deleteAccountAPI } from '../utils/api';
import { disableNearbyAlerts } from '@/utils/nearbyAlerts';

const ENFORCE_NORTHWESTERN_DOMAIN =
    process.env.EXPO_PUBLIC_ENFORCE_NORTHWESTERN_DOMAIN !== 'false';

const isNorthwesternEmail = (email?: string) => {
    if (!email) return false;
    const domain = email.toLowerCase().split('@')[1] ?? '';
    return domain === 'northwestern.edu' || domain.endsWith('.northwestern.edu');
};

const isAllowedEmail = (email?: string) =>
    !ENFORCE_NORTHWESTERN_DOMAIN || isNorthwesternEmail(email);

interface AuthContextType {
    isLoggedIn: boolean;
    // true until the stored session has been read, so the app can wait instead of flashing the login screen
    isAuthLoading: boolean;
    isNorthwesternUser: boolean;
    session: Session | null;
    user: User | null;
    login: () => void;
    logout: () => void;
    deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// way to type the children prop
interface AuthProviderProps {
    children: ReactNode;
}

// wraps parts of the app that need access to logged in state (the root)
export function AuthProvider({ children }: AuthProviderProps) {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
    const [isNorthwesternUser, setIsNorthwesternUser] = useState<boolean>(false);
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);

    // Every token refresh (hourly, and on each return to the app) hands over a new
    // session with a new but identical user object. Keep the old object unless the
    // account or its record changed, so effects keyed on `user` (coupon, saved and
    // pass loads) don't all re-run and re-fetch on every refresh.
    const applySession = useCallback((next: Session | null) => {
        setSession(next);
        setIsLoggedIn(!!next);
        setIsNorthwesternUser(next ? isAllowedEmail(next.user.email) : false);
        setUser(prev => {
            const nextUser = next?.user ?? null;
            if (prev && nextUser && prev.id === nextUser.id && prev.updated_at === nextUser.updated_at) return prev;
            return nextUser;
        });
    }, []);

    const login = useCallback(() => {
        setIsLoggedIn(true);
    }, []);

    const logout = useCallback(async () => {
        // the geofence is per device; don't keep pinging a signed-out phone.
        // Only a failure to clear the opt-in throws; a stuck geofence stays silent.
        try {
            await disableNearbyAlerts();
        } catch {
            Alert.alert("Couldn't sign out", 'Nearby deal alerts could not be turned off. Please try again.');
            return;
        }

        const { error } = await supabase.auth.signOut();
        // note: no need to update is logged in state here, it will be updated in the useEffect listener below
        if (error) {
            console.error('Error signing out:', error);
            return;
        }

        applySession(null);
    }, [applySession]);

    const deleteAccount = useCallback(async () => {
        // getSession() refreshes an expired token first; the one in state can be
        // stale if the app sat in the background with refresh paused
        const { data: { session: current } } = await supabase.auth.getSession();
        if (!current?.access_token) {
            throw new Error('No active session');
        }

        try {
            // before the delete, so a failure to clear the opt-in aborts while it can
            // still be retried; a geofence that fails to stop is logged, not thrown
            await disableNearbyAlerts();

            await deleteAccountAPI(current.access_token);

            await supabase.auth.signOut(); // clears local session to prevent being stuck at paywall

            // to be safe
            applySession(null);
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error; // Re-throw so the UI can handle it
        }
    }, [applySession]);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession()
            .then(({ data: { session } }) => applySession(session))
            .finally(() => setIsAuthLoading(false));

        // listen for session changes (sign in/out, token refresh, user updates)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            applySession(session);
        });
        return () => {
            listener?.subscription.unsubscribe();
        };
    }, [applySession]);

    // what is accessible to the children
    const contextValue = useMemo<AuthContextType>(() => ({
        isLoggedIn,
        isAuthLoading,
        isNorthwesternUser,
        session,
        user,
        login,
        logout,
        deleteAccount,
    }), [isLoggedIn, isAuthLoading, isNorthwesternUser, session, user, login, logout, deleteAccount]);

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );

}


// custom hook to access the context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
