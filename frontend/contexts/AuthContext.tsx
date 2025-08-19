import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Session, User } from '@supabase/supabase-js';
import { deleteAccountAPI } from '../utils/api';

interface AuthContextType {
    isLoggedIn: boolean;
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
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const login = () => {
        setIsLoggedIn(true);
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        // note: no need to update is logged in state here, it will be updated in the useEffect listener below
        if (error) {
            console.error('Error signing out:', error);
            return;
        }
      };

    const deleteAccount = async () => {
        if (!session?.access_token) {
            throw new Error('No active session');
        }

        try {
            const accessToken = session.access_token;
        
            await deleteAccountAPI(accessToken);
            console.log('Account deleted successfully');
            
            await supabase.auth.signOut(); // clears local session to prevent being stuck at paywall
            console.log('Signed out from Supabase');
            
            // to be safe
            setIsLoggedIn(false);
            setSession(null);
            setUser(null);
            
        } catch (error) {
            console.error('Error deleting account:', error);
            throw error; // Re-throw so the UI can handle it
        }
    };



    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsLoggedIn(!!session);
            if (session) {
                setSession(session);
                setUser(session.user);
            }
        });

        // listen for session changes
        const { data: listener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            setIsLoggedIn(!!session);
            // if there is a session, set the session
            if (session) {
                setSession(session);
                setUser(session.user);
                console.log('[AuthProvider] Session set!', session);
                console.log("[AuthProvider] JWT Token:", session.access_token);
            }

        });
        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);

    // what is accessible to the children
    const contextValue: AuthContextType = {
        isLoggedIn,
        session,
        user,
        login,
        logout,
        deleteAccount,
    };

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

