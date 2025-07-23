import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SubscriptionContextType {
    isSubscribed: boolean;
    subscribe: () => void;
    unsubscribe: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
    children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);

    const subscribe = () => {
        setIsSubscribed(true);
    };

    const unsubscribe = () => {
        setIsSubscribed(false);
    };

    const contextValue: SubscriptionContextType = {
        isSubscribed,
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