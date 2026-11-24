import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useUsage } from '@/contexts/UsageContext';

// The coupon list and the user's usage history, loaded once and shared by the
// Discover, Saved, Used and Profile tabs. Usage counts live in UsageContext so
// the detail sheet can bump them after a redemption without a re-fetch.

interface CouponsContextType {
    allCoupons: any[];
    activeCoupons: any[];
    expiredCoupons: any[];
    isLoading: boolean;
    loadError: string | null;
    isCouponActive: (coupon: any) => boolean;
    refresh: () => Promise<void>;
}

const CouponsContext = createContext<CouponsContextType | undefined>(undefined);

// helper to build a map of KV pairs of coupon_id to usage count
const buildUserCouponToUsages = (usedCouponData: any[]): Map<number, number> => {
    const usageCounts = new Map<number, number>();

    if (!usedCouponData) return usageCounts;

    usedCouponData.forEach(usage => {
        const couponId = usage.coupon_id;
        const currCount = usageCounts.get(couponId) || 0;
        usageCounts.set(couponId, currCount + 1);
    });
    return usageCounts;
}

// helper to build a map of coupon_id to the most recent used_at timestamp
const buildUserCouponToLastUsedAt = (usedCouponData: any[]): Map<number, string> => {
    const lastUsedAt = new Map<number, string>();

    if (!usedCouponData) return lastUsedAt;

    usedCouponData.forEach(usage => {
        const couponId = usage.coupon_id;
        const existing = lastUsedAt.get(couponId);
        if (!existing || new Date(usage.used_at) > new Date(existing)) {
            lastUsedAt.set(couponId, usage.used_at);
        }
    });
    return lastUsedAt;
}

export function CouponsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    // keyed on the id, not the user object: a token refresh is not a reason to re-fetch
    const userId = user?.id ?? null;
    const { userCouponToUsages, setUserCouponToUsages, setUserCouponToLastUsedAt } = useUsage();

    const [allCoupons, setAllCoupons] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    // the account the latest load is for; answers for an earlier account are dropped
    const activeUserIdRef = useRef<string | null>(userId);
    activeUserIdRef.current = userId;

    const refresh = useCallback(async () => {
        if (!userId) return;
        setLoadError(null);

        const loadFailed = "We couldn't load your coupons. Check your connection and try again.";

        // both requests go out together; RLS also limits coupon_usages to this user.
        // Never rejects: pull-to-refresh awaits this without a catch.
        let couponsResult, usagesResult;
        try {
            [couponsResult, usagesResult] = await Promise.all([
                // select('*') on purpose: optional columns (short_offer, photo_url, ...)
                // may or may not exist yet, and naming a missing one fails the query
                supabase.from('coupons').select('*').order('vendor', { ascending: true }),
                supabase.from('coupon_usages').select('coupon_id, used_at').eq('user_id', userId),
            ]);
        } catch (err) {
            console.error('Error loading coupons:', err);
            if (activeUserIdRef.current === userId) setLoadError(loadFailed);
            return;
        }
        if (activeUserIdRef.current !== userId) return;

        if (couponsResult.error) {
            console.error('Error fetching coupons:', couponsResult.error);
        } else {
            setAllCoupons(couponsResult.data ?? []);
        }

        if (usagesResult.error) {
            console.error('Error fetching coupon usages:', usagesResult.error);
        } else {
            setUserCouponToUsages(buildUserCouponToUsages(usagesResult.data));
            setUserCouponToLastUsedAt(buildUserCouponToLastUsedAt(usagesResult.data));
        }

        if (couponsResult.error || usagesResult.error) {
            setLoadError(loadFailed);
        }
    }, [userId, setUserCouponToUsages, setUserCouponToLastUsedAt]);

    useEffect(() => {
        if (userId) {
            setIsLoading(true);
            refresh().finally(() => setIsLoading(false));
        } else {
            // signed out: drop the previous account's history along with the list
            setAllCoupons([]);
            setUserCouponToUsages(new Map());
            setUserCouponToLastUsedAt(new Map());
            setLoadError(null);
            setIsLoading(false);
        }
    }, [userId]);

    // a coupon is active until its usage count reaches usage_limit (0 = unlimited)
    const isCouponActive = useCallback((coupon: any) => {
        const usageCount = userCouponToUsages.get(coupon.coupon_id) || 0;
        const usageLimit = coupon.usage_limit;
        return usageLimit > usageCount || usageLimit === 0;
    }, [userCouponToUsages]);

    const { activeCoupons, expiredCoupons } = useMemo(() => {
        const active: any[] = [];
        const expired: any[] = [];
        allCoupons.forEach(coupon => (isCouponActive(coupon) ? active : expired).push(coupon));
        return { activeCoupons: active, expiredCoupons: expired };
    }, [allCoupons, isCouponActive]);

    const contextValue = useMemo<CouponsContextType>(() => ({
        allCoupons,
        activeCoupons,
        expiredCoupons,
        isLoading,
        loadError,
        isCouponActive,
        refresh,
    }), [allCoupons, activeCoupons, expiredCoupons, isLoading, loadError, isCouponActive, refresh]);

    return (
        <CouponsContext.Provider value={contextValue}>
            {children}
        </CouponsContext.Provider>
    );
}

export function useCoupons() {
    const context = useContext(CouponsContext);
    if (!context) {
        throw new Error('useCoupons must be used within a CouponsProvider');
    }
    return context;
}
