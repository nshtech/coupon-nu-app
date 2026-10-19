import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import WillieOnboarding from '@/components/WillieOnboarding';

// Shows the Willie intro once per account. Completion is stored on the
// Supabase user (`user_metadata.onboarding_completed_at`), so it follows the
// account across devices and reinstalls. Profile's "Meet Willie" replays it.

interface OnboardingContextType {
    replayOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [isVisible, setIsVisible] = useState(false);
    // guards against re-showing if the metadata write fails this session
    const [finishedThisSession, setFinishedThisSession] = useState(false);

    useEffect(() => {
        if (user && !user.user_metadata?.onboarding_completed_at && !finishedThisSession) {
            setIsVisible(true);
        }
    }, [user?.id]);

    const finish = async () => {
        setIsVisible(false);
        if (finishedThisSession || user?.user_metadata?.onboarding_completed_at) return;
        setFinishedThisSession(true);

        const { error } = await supabase.auth.updateUser({
            data: { onboarding_completed_at: new Date().toISOString() },
        });
        if (error) console.error('Error saving onboarding completion:', error);
    };

    return (
        <OnboardingContext.Provider value={{ replayOnboarding: () => setIsVisible(true) }}>
            {children}
            <WillieOnboarding visible={isVisible} onFinish={finish} />
        </OnboardingContext.Provider>
    );
}

export function useOnboarding() {
    const context = useContext(OnboardingContext);
    if (!context) {
        throw new Error('useOnboarding must be used within an OnboardingProvider');
    }
    return context;
}
