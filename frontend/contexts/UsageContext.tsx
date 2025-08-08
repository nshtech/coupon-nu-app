import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UsageContextType {
    userCouponToUsages: Map<number, number>;
    setUserCouponToUsages: (userCouponToUsages: Map<number, number>) => void;
}

const UsageContext = createContext<UsageContextType | undefined>(undefined);


interface UsageProviderProps {
    children: ReactNode;
}


export function UsageProvider({ children }: UsageProviderProps) {

    const [userCouponToUsages, setUserCouponToUsages] = useState<Map<number, number>>(new Map());


    const contextValue: UsageContextType = {
        userCouponToUsages,
        setUserCouponToUsages,
    };

    
    return (
        <UsageContext.Provider value={contextValue}>
            {children}
        </UsageContext.Provider>
    );
}


export function useUsage() {
    const context = useContext(UsageContext);
    if (!context) {
        throw new Error('useUsage must be used within an UsageProvider');
    }
    return context;
}