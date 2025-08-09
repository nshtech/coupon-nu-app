import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
    isSubscribed: boolean;
    subscriptionExpiration: Date | null;
    isSubscriptionLoading: boolean;
    getSubscription: () => Promise<void>;
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
    const [isSubscriptionLoading, setIsSubscriptionLoading] = useState<boolean>(true);

    const { user } = useAuth();

    // get initial subscription status
    useEffect(() => {
        if (user) {
            setIsSubscriptionLoading(true);
            getSubscription().finally(() => setIsSubscriptionLoading(false));
        } else {
            setIsSubscribed(false);
            setSubscriptionExpiration(null);
            setIsSubscriptionLoading(false);
        }
    }, [user]); 


    const subscribe = async () => {

        // create a subscription in the database
        if (user) {

            // check if user already has a subscription
            const { data: existingData, error: existingError } = await supabase
             .from('subscriptions')
             .select('*')
             .eq('user_id', user.id)
             .single();
            if (existingError) {
                // question is should i keep this an error and keep users instantly in the subscription db?
                console.log('[SubscriptionProvider] Subscription does not seem to exist:', existingError); 
            } else if (existingData?.is_subscribed) {
                console.log('[SubscriptionProvider] User already has a subscription');
                setIsSubscribed(true);
                setSubscriptionExpiration(existingData.subscription_expiration ? new Date(existingData.subscription_expiration) : null);
                return;
            }

            // create a subscription in the database

            const { data, error } = await supabase.from('subscriptions').insert({
                user_id: user.id,
                is_subscribed: true,
                subscription_expiration: new Date('2026-01-01T00:00:00-06:00'), // January 1, 2026 Central Time
            })
            if (error) {
                console.error('[SubscriptionProvider] Error creating subscription:', error);
            } else {
                console.log('[SubscriptionProvider] Subscription created successfully');
                setSubscriptionExpiration(new Date('2026-01-01T00:00:00-06:00'));
                setIsSubscribed(true);
            }
        } else {
            console.error('[SubscriptionProvider] No user found');
        }
    };

    const getSubscription = async (): Promise<void> => {
        if (user) {
            const { data, error } = await supabase
             .from('subscriptions')
             .select('*')
             .eq('user_id', user.id)
             .single();
            if (error) {
                // question is should i keep this an error and keep users instantly in the subscription db?
                console.log('[SubscriptionProvider] Error restoring purchases:', error); 
            } else if (data?.is_subscribed) {
                console.log('[SubscriptionProvider] Purchases restored successfully');
                setIsSubscribed(true);
                setSubscriptionExpiration(data.subscription_expiration ? new Date(data.subscription_expiration) : null);
            } else {
                console.log('[SubscriptionProvider] No subscription found');
                setIsSubscribed(false);
            }
        }
    }
    
    const unsubscribe = async () => {
        setIsSubscribed(false);
        setSubscriptionExpiration(null);

        // delete the subscription from the database
        if (user) {
            const { error } = await supabase
             .from('subscriptions')
             .delete()
             .eq('user_id', user.id);
            if (error) {
                console.error('[SubscriptionProvider] Error deleting subscription:', error);
            } else {
                console.log('[SubscriptionProvider] Subscription deleted successfully');
            }
        }
    };

    const contextValue: SubscriptionContextType = {
        isSubscribed,
        subscriptionExpiration,
        isSubscriptionLoading,
        getSubscription,
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