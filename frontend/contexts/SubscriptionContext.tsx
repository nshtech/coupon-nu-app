import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SubscriptionContextType {
    isSubscribed: boolean;
    subscribe: () => void;
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

    const contextValue: SubscriptionContextType = {
        isSubscribed,
        subscribe,
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