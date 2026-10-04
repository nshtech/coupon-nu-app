import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import { Alert, AppState, AppStateStatus, Platform } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useAuth } from './AuthContext';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { QUARTER_PASS_EXPIRATION_DATE } from '@/constants/quarterPass';

const ENTITLEMENT_ID = 'Quarter Coupon Pass';
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

// App Store offer codes are an iOS-only StoreKit feature. Android promo codes are
// redeemed in the Play Store app, not in-app, so we only surface the button on iOS.
const CAN_REDEEM_OFFER_CODES = Platform.OS === 'ios';

// The redemption sheet has no completion callback — StoreKit just dismisses it.
// After presenting it we poll RevenueCat until the entitlement shows up.
const REDEMPTION_POLL_INTERVAL_MS = 2500;
const REDEMPTION_POLL_ATTEMPTS = 24; // ~60s
// The sheet also gives us no "cancelled" signal, so the spinner is time-boxed. After
// it clears, the poll keeps running quietly in the background instead of locking the
// paywall for a full minute after someone taps Cancel.
const REDEMPTION_SPINNER_MS = 10000;

// Purchases.configure() happens in <ConfigureRevenueCat /> during mount, so any
// call made from an early effect can race it.
const CONFIGURE_POLL_INTERVAL_MS = 150;
const CONFIGURE_POLL_ATTEMPTS = 30; // ~4.5s


interface SubscriptionContextType {
    isSubscribed: boolean;
    subscriptionExpiration: Date | null;
    isSubscriptionLoading: boolean;
    isPurchasing: boolean;
    isRestoring: boolean;
    isRedeemingOfferCode: boolean;
    canRedeemOfferCodes: boolean;
    getSubscription: () => Promise<boolean>;
    subscribe: () => Promise<void>;
    restorePurchases: () => Promise<void>;
    redeemOfferCode: () => Promise<void>;
    refreshEntitlement: (options?: { sync?: boolean }) => Promise<boolean>;
    unsubscribe: () => Promise<void>;
    setIsSubscribed: (isSubscribed: boolean) => void;
    setSubscriptionExpiration: (expiration: Date | null) => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

interface SubscriptionProviderProps {
    children: ReactNode;
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
    const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
    const [subscriptionExpiration, setSubscriptionExpiration] = useState<Date | null>(null);
    const [isSubscriptionLoading, setIsSubscriptionLoading] = useState<boolean>(true);
    const [isPurchasing, setIsPurchasing] = useState<boolean>(false);
    const [isRestoring, setIsRestoring] = useState<boolean>(false);
    const [isRedeemingOfferCode, setIsRedeemingOfferCode] = useState<boolean>(false);

    const { user } = useAuth();

    // Listeners and polls outlive the render that created them, so they read the
    // live values through refs instead of a stale closure.
    const userRef = useRef(user);
    const isSubscribedRef = useRef(isSubscribed);
    const isMountedRef = useRef(true);
    const isPollingRef = useRef(false);
    const redemptionSpinnerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { userRef.current = user; }, [user]);
    useEffect(() => { isSubscribedRef.current = isSubscribed; }, [isSubscribed]);
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (redemptionSpinnerTimeoutRef.current) clearTimeout(redemptionSpinnerTimeoutRef.current);
        };
    }, []);

    const stopRedemptionSpinner = () => {
        if (redemptionSpinnerTimeoutRef.current) {
            clearTimeout(redemptionSpinnerTimeoutRef.current);
            redemptionSpinnerTimeoutRef.current = null;
        }
        if (isMountedRef.current) setIsRedeemingOfferCode(false);
    };

    /**
     * Waits for <ConfigureRevenueCat /> to finish Purchases.configure().
     * Every Purchases call below throws if configure() has not run yet.
     */
    const ensureConfigured = async (): Promise<boolean> => {
        if (!isNative || !Purchases) return false;

        for (let attempt = 0; attempt < CONFIGURE_POLL_ATTEMPTS; attempt += 1) {
            try {
                if (await Purchases.isConfigured()) return true;
            } catch (err) {
                // isConfigured itself should not throw, but never let it break the flow
                console.error('[SubscriptionProvider] isConfigured check failed:', err);
            }
            await wait(CONFIGURE_POLL_INTERVAL_MS);
        }

        console.error('[SubscriptionProvider] RevenueCat was never configured');
        return false;
    };

    /**
     * Binds the RevenueCat app user ID to the Supabase user ID. This has to happen
     * BEFORE any purchase, restore, or offer-code redemption — otherwise the
     * entitlement lands on an anonymous RevenueCat user and is lost on reinstall.
     */
    const ensureRevenueCatUser = async (userId: string): Promise<boolean> => {
        if (!(await ensureConfigured())) return false;

        try {
            await Purchases.logIn(userId);
            return true;
        } catch (err) {
            console.error('[SubscriptionProvider] RevenueCat logIn failed:', err);
            return false;
        }
    };

    /**
     * Single source of truth for "the user has the entitlement -> unlock the app".
     * Used by purchase, restore, offer-code redemption, and the background refreshes.
     */
    const persistEntitlement = async (customerInfo: CustomerInfo): Promise<boolean> => {
        const currentUser = userRef.current;
        if (!currentUser) return false;

        const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
        if (!entitlement) return false;

        // The update listener can hand us CustomerInfo that belongs to someone else
        // (the previous account, mid sign-out/sign-in). Never unlock or write a
        // Supabase row for the signed-in user off another user's entitlement.
        // originalAppUserId alone is not enough: the SDK is configured anonymously,
        // so a user aliased by logIn() can keep a `$RCAnonymousID:` original ID.
        // In that case fall back to the identity the SDK is currently logged in as.
        if (customerInfo.originalAppUserId !== currentUser.id) {
            let appUserId: string | null = null;
            try {
                appUserId = await Purchases.getAppUserID();
            } catch (err) {
                console.error('[SubscriptionProvider] getAppUserID failed:', err);
            }

            if (appUserId !== currentUser.id || userRef.current?.id !== currentUser.id) {
                console.warn('[SubscriptionProvider] Ignoring entitlement for a different RevenueCat user');
                return false;
            }
        }

        stopRedemptionSpinner();

        if (isMountedRef.current) {
            // Unlock locally first. The user has paid (or redeemed); a Supabase hiccup
            // must never leave them staring at the paywall.
            setIsSubscribed(true);
            setSubscriptionExpiration(QUARTER_PASS_EXPIRATION_DATE);
        }
        isSubscribedRef.current = true;

        const { error } = await supabase.from('subscriptions').upsert({
            user_id: currentUser.id,
            is_subscribed: true,
            subscription_expiration: QUARTER_PASS_EXPIRATION_DATE,
        }, { onConflict: 'user_id' });

        if (error) {
            // Not fatal: the next foreground refresh re-reads RevenueCat and retries.
            console.error('[SubscriptionProvider] Error saving subscription:', error);
        } else {
            console.log('[SubscriptionProvider] Subscription saved successfully');
        }

        return true;
    };

    /**
     * Pulls the latest entitlement state from RevenueCat and unlocks if it is active.
     * `sync: true` forces RevenueCat to re-read the StoreKit receipt first, which is
     * what picks up an offer code redeemed outside the app (App Store link, etc.).
     */
    const refreshEntitlement = async (options?: { sync?: boolean }): Promise<boolean> => {
        const currentUser = userRef.current;
        if (!currentUser || !isNative || !Purchases) return false;

        if (!(await ensureRevenueCatUser(currentUser.id))) return false;

        try {
            if (options?.sync) {
                try {
                    await Purchases.syncPurchases();
                } catch (err) {
                    console.error('[SubscriptionProvider] syncPurchases failed:', err);
                }
            }

            await Purchases.invalidateCustomerInfoCache();
            const customerInfo = await Purchases.getCustomerInfo();
            return await persistEntitlement(customerInfo);
        } catch (err) {
            console.error('[SubscriptionProvider] refreshEntitlement error:', err);
            return false;
        }
    };

    const getSubscription = async (): Promise<boolean> => {
        const currentUser = userRef.current;
        if (!currentUser) return false;

        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', currentUser.id)
            .single();

        if (error) {
            // `.single()` errors when no row exists, which is the normal "never subscribed" case.
            console.log('[SubscriptionProvider] No subscription row:', error.message);
            return false;
        }

        if (data?.is_subscribed) {
            console.log('[SubscriptionProvider] Subscription loaded from Supabase');
            if (isMountedRef.current) {
                setIsSubscribed(true);
                setSubscriptionExpiration(data.subscription_expiration ? new Date(data.subscription_expiration) : null);
            }
            isSubscribedRef.current = true;
            return true;
        }

        console.log('[SubscriptionProvider] No active subscription found');
        if (isMountedRef.current) setIsSubscribed(false);
        isSubscribedRef.current = false;
        return false;
    };

    const subscribe = async () => {
        const currentUser = userRef.current;

        if (!currentUser) {
            console.error('[SubscriptionProvider] No user found');
            return;
        }

        if (!isNative || !Purchases) {
            console.error('[SubscriptionProvider] Error with isNative or Purchases');
            return;
        }

        setIsPurchasing(true);
        try {
            if (!(await ensureRevenueCatUser(currentUser.id))) {
                Alert.alert('Something went wrong', 'We could not reach the App Store. Please try again in a moment.');
                return;
            }

            const offerings = await Purchases.getOfferings();
            const pkg = offerings.current?.availablePackages[0];

            if (!pkg) {
                console.error('[SubscriptionProvider] No package available');
                Alert.alert('Unavailable', 'The quarter pass is not available right now. Please try again later.');
                return;
            }

            const { customerInfo } = await Purchases.purchasePackage(pkg);
            const unlocked = await persistEntitlement(customerInfo);

            if (!unlocked) {
                console.error('[SubscriptionProvider] No entitlement found after purchase');
                Alert.alert(
                    'Purchase not applied',
                    'Your purchase went through but we could not unlock access. Try "Restore Purchases" — you will not be charged twice.'
                );
            }
        } catch (err) {
            if (err && typeof err === 'object' && 'userCancelled' in err && (err as any).userCancelled) return;
            console.error('[SubscriptionProvider] Purchase error:', err);
            Alert.alert('Purchase failed', 'Something went wrong with your purchase. You have not been charged.');
        } finally {
            if (isMountedRef.current) setIsPurchasing(false);
        }
    };

    const restorePurchases = async (): Promise<void> => {
        const currentUser = userRef.current;

        if (!currentUser) {
            console.error('[SubscriptionProvider] No user found');
            return;
        }

        if (!isNative || !Purchases) {
            console.error('[SubscriptionProvider] Error with isNative or Purchases');
            return;
        }

        setIsRestoring(true);
        try {
            if (!(await ensureRevenueCatUser(currentUser.id))) {
                Alert.alert('Something went wrong', 'We could not reach the App Store. Please try again in a moment.');
                return;
            }

            const customerInfo = await Purchases.restorePurchases();
            const unlocked = await persistEntitlement(customerInfo);

            if (!unlocked) {
                console.log('[SubscriptionProvider] No entitlement found on restore');
                Alert.alert(
                    'Nothing to restore',
                    'We could not find a quarter pass on this Apple ID. Make sure you are signed in with the Apple ID you used to buy or redeem it.'
                );
            }
        } catch (err) {
            console.error('[SubscriptionProvider] Restore error:', err);
            Alert.alert('Restore failed', 'We could not restore your purchases. Please try again.');
        } finally {
            if (isMountedRef.current) setIsRestoring(false);
        }
    };

    /**
     * Polls RevenueCat after the offer-code sheet is dismissed. StoreKit gives us no
     * callback, and the entitlement can take a few seconds to propagate to
     * RevenueCat's backend, so we retry until it lands or we give up.
     */
    const pollForRedeemedEntitlement = async (): Promise<void> => {
        if (isPollingRef.current) return;
        isPollingRef.current = true;

        try {
            for (let attempt = 0; attempt < REDEMPTION_POLL_ATTEMPTS; attempt += 1) {
                if (!isMountedRef.current || !userRef.current) return;
                if (isSubscribedRef.current) return; // the update listener beat us to it

                await wait(REDEMPTION_POLL_INTERVAL_MS);

                if (!isMountedRef.current || !userRef.current) return;
                if (isSubscribedRef.current) return;

                // sync on every other attempt — it is the expensive call
                const unlocked = await refreshEntitlement({ sync: attempt % 2 === 1 });
                if (unlocked) return;
            }

            console.log('[SubscriptionProvider] Offer code poll timed out');
        } finally {
            isPollingRef.current = false;
            stopRedemptionSpinner();
        }
    };

    /**
     * Opens the App Store "Redeem Offer Code" sheet for the Fall Quarter pass.
     * Codes are generated in App Store Connect under the in-app purchase's Offer Codes
     * section; redeeming one grants the same `Quarter Coupon Pass` entitlement a paid
     * purchase does, so the unlock path below is identical.
     */
    const redeemOfferCode = async (): Promise<void> => {
        const currentUser = userRef.current;

        if (!currentUser) {
            console.error('[SubscriptionProvider] No user found');
            return;
        }

        if (!CAN_REDEEM_OFFER_CODES || !Purchases) {
            Alert.alert(
                'Not available here',
                'Offer codes can only be redeemed on iPhone or iPad.'
            );
            return;
        }

        if (isSubscribedRef.current) {
            Alert.alert('Already unlocked', 'Your quarter pass is already active.');
            return;
        }

        if (redemptionSpinnerTimeoutRef.current) clearTimeout(redemptionSpinnerTimeoutRef.current);
        setIsRedeemingOfferCode(true);

        if (!(await ensureRevenueCatUser(currentUser.id))) {
            stopRedemptionSpinner();
            Alert.alert('Something went wrong', 'We could not open the redemption sheet. Please try again in a moment.');
            return;
        }

        try {
            await Purchases.presentCodeRedemptionSheet();
        } catch (err) {
            console.error('[SubscriptionProvider] presentCodeRedemptionSheet error:', err);
            stopRedemptionSpinner();
            Alert.alert('Something went wrong', 'We could not open the redemption sheet. Please try again in a moment.');
            return;
        }

        redemptionSpinnerTimeoutRef.current = setTimeout(() => {
            redemptionSpinnerTimeoutRef.current = null;
            if (isMountedRef.current) setIsRedeemingOfferCode(false);
        }, REDEMPTION_SPINNER_MS);

        // The sheet is fire-and-forget; watch for the entitlement to appear.
        void pollForRedeemedEntitlement();
    };

    const unsubscribe = async () => {
        if (isMountedRef.current) {
            setIsSubscribed(false);
            setSubscriptionExpiration(null);
        }
        isSubscribedRef.current = false;

        const currentUser = userRef.current;
        if (currentUser) {
            const { error } = await supabase
                .from('subscriptions')
                .delete()
                .eq('user_id', currentUser.id);
            if (error) {
                console.error('[SubscriptionProvider] Error deleting subscription:', error);
            } else {
                console.log('[SubscriptionProvider] Subscription deleted successfully');
            }
        }
    };

    // Entitlements can change outside of any call we make — an offer code redeemed
    // from an App Store link, a renewal, a refund. RevenueCat pushes those here.
    useEffect(() => {
        if (!isNative || !Purchases) return;

        let cancelled = false;
        const listener = (customerInfo: CustomerInfo) => {
            void persistEntitlement(customerInfo);
        };

        (async () => {
            if (!(await ensureConfigured()) || cancelled) return;
            Purchases.addCustomerInfoUpdateListener(listener);
        })();

        return () => {
            cancelled = true;
            try {
                Purchases.removeCustomerInfoUpdateListener(listener);
            } catch (err) {
                console.error('[SubscriptionProvider] Error removing listener:', err);
            }
        };
    }, []);

    // Catches offer codes redeemed outside the app (App Store page, redemption link,
    // a code scanned with the Camera app) when the user comes back.
    useEffect(() => {
        if (!isNative) return;

        const onChange = (state: AppStateStatus) => {
            if (state !== 'active') return;
            if (!userRef.current || isSubscribedRef.current) return;
            void refreshEntitlement({ sync: true });
        };

        const subscription = AppState.addEventListener('change', onChange);
        return () => subscription.remove();
    }, []);

    // Initial load: identify the user to RevenueCat, read Supabase, and fall back to
    // RevenueCat if Supabase has nothing (new device, reinstall, code redeemed elsewhere).
    useEffect(() => {
        let cancelled = false;

        if (user) {
            userRef.current = user;
            setIsSubscriptionLoading(true);

            (async () => {
                await ensureRevenueCatUser(user.id);
                if (cancelled) return;

                const unlocked = await getSubscription();
                if (cancelled || unlocked) return;

                await refreshEntitlement();
            })()
                .catch((err) => console.error('[SubscriptionProvider] Initial load error:', err))
                .finally(() => {
                    if (!cancelled && isMountedRef.current) setIsSubscriptionLoading(false);
                });
        } else {
            setIsSubscribed(false);
            setSubscriptionExpiration(null);
            setIsSubscriptionLoading(false);
            isSubscribedRef.current = false;

            // Detach the RevenueCat identity so the next sign-in on this device does
            // not inherit the previous user's entitlement.
            (async () => {
                if (!(await ensureConfigured())) return;
                try {
                    await Purchases.logOut();
                } catch (err) {
                    // Throws when the current RevenueCat user is already anonymous — harmless.
                    console.log('[SubscriptionProvider] RevenueCat logOut skipped:', err);
                }
            })();
        }

        return () => { cancelled = true; };
    }, [user]);

    const contextValue: SubscriptionContextType = {
        isSubscribed,
        subscriptionExpiration,
        isSubscriptionLoading,
        isPurchasing,
        isRestoring,
        isRedeemingOfferCode,
        canRedeemOfferCodes: CAN_REDEEM_OFFER_CODES,
        getSubscription,
        subscribe,
        restorePurchases,
        redeemOfferCode,
        refreshEntitlement,
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
