import React, { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { AccessibilityInfo, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Coupons the user hearted, stored in the Supabase `saved_coupons` table
// (backend/sql/003_saved_coupons.sql). If that table has not been created yet,
// `isSavingAvailable` is false and the UI hides the hearts.

interface SavedCouponsContextType {
    savedIds: Set<number>;
    isSavingAvailable: boolean;
    isSaved: (couponId: number) => boolean;
    toggleSaved: (coupon: any) => Promise<void>;
}

const SavedCouponsContext = createContext<SavedCouponsContextType | undefined>(undefined);

// PostgREST / Postgres codes for "that table does not exist"
const MISSING_TABLE_CODES = new Set(['PGRST205', '42P01']);

export function SavedCouponsProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [savedIds, setSavedIds] = useState<Set<number>>(new Set());
    const [isSavingAvailable, setIsSavingAvailable] = useState<boolean>(true);
    const pendingIds = useRef<Set<number>>(new Set());

    useEffect(() => {
        if (!user) {
            setSavedIds(new Set());
            return;
        }

        let cancelled = false;
        supabase
            .from('saved_coupons')
            .select('coupon_id')
            .eq('user_id', user.id)
            .then(({ data, error }) => {
                if (cancelled) return;
                if (error) {
                    console.error('Error fetching saved coupons:', error);
                    if (MISSING_TABLE_CODES.has(error.code)) setIsSavingAvailable(false);
                    return;
                }
                setIsSavingAvailable(true);
                setSavedIds(new Set((data ?? []).map(row => row.coupon_id)));
            });

        return () => { cancelled = true; };
    }, [user]);

    const isSaved = useCallback((couponId: number) => savedIds.has(couponId), [savedIds]);

    // flips the heart right away, then puts it back if the write fails
    const toggleSaved = useCallback(async (coupon: any) => {
        if (!user || !isSavingAvailable) return;

        const couponId: number = coupon.coupon_id;
        // a second tap before the first write lands would act on stale state
        if (pendingIds.current.has(couponId)) return;
        const wasSaved = savedIds.has(couponId);
        const applyLocally = (saved: boolean) => setSavedIds(prev => {
            const next = new Set(prev);
            saved ? next.add(couponId) : next.delete(couponId);
            return next;
        });

        applyLocally(!wasSaved);
        // a firmer tap for hearting, a light tick for un-hearting
        (wasSaved
            ? Haptics.selectionAsync()
            : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        ).catch(() => {});

        pendingIds.current.add(couponId);
        let error;
        try {
            ({ error } = wasSaved
                ? await supabase.from('saved_coupons').delete().eq('user_id', user.id).eq('coupon_id', couponId)
                : await supabase.from('saved_coupons').insert({ user_id: user.id, coupon_id: couponId }));
        } finally {
            pendingIds.current.delete(couponId);
        }

        if (error) {
            console.error('Error updating saved coupon:', error);
            applyLocally(wasSaved);
            Alert.alert("Couldn't update saved coupons", 'Please check your connection and try again.');
            return;
        }

        AccessibilityInfo.announceForAccessibility(
            wasSaved ? `Removed ${coupon.vendor} from saved` : `Saved ${coupon.vendor}`
        );
    }, [user, isSavingAvailable, savedIds]);

    return (
        <SavedCouponsContext.Provider value={{ savedIds, isSavingAvailable, isSaved, toggleSaved }}>
            {children}
        </SavedCouponsContext.Provider>
    );
}

export function useSavedCoupons() {
    const context = useContext(SavedCouponsContext);
    if (!context) {
        throw new Error('useSavedCoupons must be used within a SavedCouponsProvider');
    }
    return context;
}
