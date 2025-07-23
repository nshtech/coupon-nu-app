import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
    isSubscribed: boolean;
    subscriptionExpiration: Date | null;
    restorePurchases: () => void;
    subscribe: () => void;
    unsubscribe: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
    children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [subscriptionExpiration, setSubscriptionExpiration] = useState<Date | null>(null);

    const { user } = useAuth();

    const subscribe = async () => {
        setIsSubscribed(true);

        // create a subscription in the database
        if (user) {
            const { data, error } = await supabase.from('subscriptions').insert({
                user_id: user.id,
                is_subscribed: true,
                subscription_expiration: new Date('2026-01-01T00:00:00Z'), // January 1, 2026
            })
            if (error) {
                console.error('[SubscriptionProvider] Error creating subscription:', error);
            } else {
                console.log('[SubscriptionProvider] Subscription created successfully');
                setSubscriptionExpiration(new Date('2026-01-01T00:00:00Z'));
            }
        } else {
            console.error('[SubscriptionProvider] No user found');
        }
    };

    const restorePurchases = async () => {
        if (user) {
            const { data, error } = await supabase
             .from('subscriptions')
             .select('*')
             .eq('user_id', user.id)
             .single();
            if (error) {
                console.error('[SubscriptionProvider] Error restoring purchases:', error);
            } else {
                console.log('[SubscriptionProvider] Purchases restored successfully');
                setIsSubscribed(true);
            }
        }
    }


    // with my setup this is going to have to be a custom fastAPI route (supabase does not allow this from client side)
    const unsubscribe = () => {
        setIsSubscribed(false);
    };

    const contextValue: SubscriptionContextType = {
        isSubscribed,
        subscriptionExpiration,
        restorePurchases,
        subscribe,
        unsubscribe,
    };

    return (
        <SubscriptionContext.Provider value={contextValue}>
            {children}
        </SubscriptionContext.Provider>
    );
}

export function useSubscription() {
    const context = useContext(SubscriptionContext);
    if (!context) {
        throw new Error('useSubscription must be used within a SubscriptionProvider');
    }

    return context;
}