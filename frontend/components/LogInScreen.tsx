import React from 'react';
import { View, Text, Image } from 'react-native';
import { PrimaryButton } from '@/components/ui/Button';
import { BRAND_CREAM, BRAND_INK, BRAND_MUTED } from '@/constants/Colors';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/utils/supabase';
import { openPrivacyPolicy, openTermsOfService } from '@/utils/pdfViewer';

WebBrowser.maybeCompleteAuthSession();


export default function LogInScreen() {

    const redirectUri = AuthSession.makeRedirectUri(
        {scheme: 'willieswallet', path: 'auth-callback'} // updated this as a custom stable redirect uri
    );
    

    const handleLogin = async () => {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUri, 
                skipBrowserRedirect: true, // this seems to be useless
                queryParams: { prompt: 'select_account'} // THIS IS A HUGE FIX TO PREVENT AUTO RESIGNIN
            }
        });

        if (error) {
            console.error("Error signing in with Google:", error);
            return;
        }

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        


        // parsing url for session data - TAKE A LOOK AGAIN ONCE DEPLOYED
        if (result.type === 'success' && result.url) {
            const fragment = result.url.split('#')[1];
            if (fragment) {
                const params = Object.fromEntries(new URLSearchParams(fragment));
                const access_token = params['access_token'];
                const refresh_token = params['refresh_token'];
                // never log these: device logs are readable off a connected phone
                if (access_token && refresh_token) {
                    // AuthContext's onAuthStateChange listener picks the session up
                    const { error: setSessionError } = await supabase.auth.setSession({
                        access_token,
                        refresh_token,
                    });
                    if (setSessionError) {
                        console.error('Error setting session:', setSessionError);
                    } 
                } else {
                    console.warn('No access_token or refresh_token found in URL fragment.');
                }
            } else {
                console.warn('No fragment found in result URL.');
            }
        }


        if (result.type !== 'success') {
            console.warn('Login cancelled or failed:', result.type);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: BRAND_CREAM }}>

            <View className="mt-20 items-center justify-center py-10">
                <Image source={require('../assets/images/loginpagesplash.png')} className="h-1/2 w-1/2" resizeMode="contain"/>
            </View>

            <View style={{ alignItems: 'center', gap: 20, paddingHorizontal: 32 }}>

                <PrimaryButton
                    label="Sign in with Northwestern Student Google Account"
                    onPress={handleLogin}
                    style={{ alignSelf: 'stretch' }}
                />

                <Text style={{ paddingHorizontal: 16, textAlign: 'center', fontFamily: 'Figtree_400Regular', fontSize: 14, lineHeight: 20, color: BRAND_MUTED }}>
                    By clicking the above button, you agree to our{'\n'}
                    <Text
                        style={{ fontFamily: 'Figtree_700Bold', color: BRAND_INK, textDecorationLine: 'underline' }}
                        // terms of service scrollable native webview
                        onPress={openTermsOfService}
                    >
                        Terms of Service
                    </Text>

                    {' '}and{' '}

                    <Text
                        style={{ fontFamily: 'Figtree_700Bold', color: BRAND_INK, textDecorationLine: 'underline' }}
                        // privacy policy scrollable native webview
                        onPress={openPrivacyPolicy}
                    >
                        Privacy Policy
                    </Text>
                </Text>

            </View>

        </View>
    );
}
