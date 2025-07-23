import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { Session, User, UserMetadata } from '@supabase/supabase-js';

interface AuthContextType {
    isLoggedIn: boolean;
    session: Session | null;
    user: User | null;
    login: () => void;
    logout: () => void;
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



    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setIsLoggedIn(!!session);
            if (session) {
                setSession(session);
                setUser(session.user);
                console.log('[AuthProvider] Session set!', session);
            }
        });

        // Listen for session changes
        const { data: listener } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
            console.log('[AuthProvider] Auth event:', _event, 'Session:', session);
            setIsLoggedIn(!!session);
            // if there is a session, set the session
            if (session) {
                setSession(session);
                setUser(session.user);
                console.log('[AuthProvider] Session set!', session);
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

