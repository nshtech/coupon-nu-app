import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import WillieOnboarding from '@/components/WillieOnboarding';
import { PlaceType } from '@/utils/couponFilters';

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
    // guards against re-showing if the metadata write fails this session; per
    // user, so one account finishing does not skip the next account's intro
    const [finishedUserId, setFinishedUserId] = useState<string | null>(null);

    useEffect(() => {
        if (!user) {
            setIsVisible(false);
            return;
        }
        if (!user.user_metadata?.onboarding_completed_at && finishedUserId !== user.id) {
            setIsVisible(true);
        }
    }, [user?.id]);

    // `interests` are the place types picked on the intro's question step,
    // kept as `user_metadata.deal_interests` for personalising later; a replay
    // that answers again overwrites them
    const finish = async (interests?: PlaceType[]) => {
        setIsVisible(false);
        if (!user) return;
        const isFirstFinish = finishedUserId !== user.id && !user.user_metadata?.onboarding_completed_at;

        const data: Record<string, unknown> = {};
        if (isFirstFinish) data.onboarding_completed_at = new Date().toISOString();
        if (interests?.length) data.deal_interests = interests;
        if (!Object.keys(data).length) return;
        if (isFirstFinish) setFinishedUserId(user.id);

        // updateUser merges these keys into the existing user_metadata
        const { error } = await supabase.auth.updateUser({ data });
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
