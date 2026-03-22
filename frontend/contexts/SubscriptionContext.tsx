import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Platform } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useAuth } from './AuthContext';
import Purchases from 'react-native-purchases';

const ENTITLEMENT_ID = 'Quarter Coupon Pass';
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';


interface SubscriptionContextType {
    isSubscribed: boolean;
    subscriptionExpiration: Date | null;
    isSubscriptionLoading: boolean;
    getSubscription: () => Promise<void>;
    subscribe: () => void;
    unsubscribe: () => void;
    setIsSubscribed: (isSubscribed: boolean) => void;
    setSubscriptionExpiration: (expiration: Date | null) => void;
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
        if (!user) {
            console.error('[SubscriptionProvider] No user found');
            return;
        }

        if (!isNative || !Purchases) {
            console.error("[SubscriptionProvider] Error with isNative or Purchases")
            return;
        }
        
        try {
            await Purchases.logIn(user.id);

            const offerings = await Purchases.getOfferings();
            const pkg = offerings.current?.availablePackages[0];

            if (!pkg) {
                console.error('[SubscriptionProvider] No package available');
            } else {
                const { customerInfo } = await Purchases.purchasePackage(pkg);
                console.log(Object.keys(customerInfo.entitlements.active));
                const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];

                if (entitlement) {
                    const { data, error } = await supabase.from('subscriptions').insert({
                        user_id: user.id,
                        is_subscribed: true,
                        subscription_expiration: new Date('2026-06-13T00:00:00-06:00'), // June 13, 2026 Central Time
                    })
                    if (error) {
                        console.error('[SubscriptionProvider] Error creating subscription:', error);
                    } else {
                        console.log('[SubscriptionProvider] Subscription created successfully');
                        setSubscriptionExpiration(new Date('2026-06-13T00:00:00-06:00'));
                        setIsSubscribed(true);
                    }
                } else {
                    console.error('[SubscriptionProvider] No entitlement found');
                    return;
                }
            }
        } catch (err) {
            if (err && typeof err === 'object' && 'userCancelled' in err) return;
            console.error('[SubscriptionProvider] Purchase error:', err);
            return;
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
        setIsSubscribed,
        setSubscriptionExpiration,
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