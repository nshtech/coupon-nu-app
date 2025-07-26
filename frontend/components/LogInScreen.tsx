import React, { useEffect, useState } from 'react';
import { Button, TouchableOpacity, View, Text, Pressable } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import * as AuthSession from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import { useSubscription } from '@/contexts/SubscriptionContext';

WebBrowser.maybeCompleteAuthSession();



export default function LogInScreen() {

    

    const { login } = useAuth();

    const { unsubscribe } = useSubscription();


    const redirectUri = AuthSession.makeRedirectUri();

    const handleLogin = async () => {


        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: redirectUri,
            }
        });

        if (error) {
            console.error("Error signing in with Google:", error);
            return;
        }

        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);
        // console.log(result);


        // parsing url for session data - TAKE A LOOK AGAIN ONCE DEPLOYED
        if (result.type === 'success' && result.url) {
            const fragment = result.url.split('#')[1];
            if (fragment) {
                const params = Object.fromEntries(new URLSearchParams(fragment));
                const access_token = params['access_token'];
                const refresh_token = params['refresh_token'];
                // console.log('Parsed tokens:', { access_token, refresh_token });
                if (access_token && refresh_token) {
                    const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
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


        // if (result.type === 'success') {
        //     console.log('Waiting for session data...');
        // } else {
        //     console.warn('Login cancelled or failed:', result);
        // }

        // const { data: session } = await supabase.auth.getSession();
        // console.log('📦 Manual session check:', session);

    };




    return (
        <View className="flex-1 bg-white ">

            <View className="items-center py-10 mt-20 justify-center">
                <Text className="text-black text-5xl font-inter-bold">Coupon NU</Text>
            </View>

            <View className="items-center justify-center gap-5 mt-60">

                <TouchableOpacity className="bg-purple-80 px-16 py-2 rounded-lg" onPress={handleLogin}>
                    <Text className="text-white text-2xl">Sign in with Google</Text>
                </TouchableOpacity>

                <View>
                    <Text className="px-10 text-center text-dark-gray font-inter-medium">

                        By clicking continue, you agree to our{' '}
                        <Text 
                            className="font-inter-bold text-black" 
                            // terms of service scrollable native webview
                            onPress={() => {}}
                        >
                            Terms of Service
                        </Text>

                        {' '}and{' '}

                        <Text 
                            className="font-inter-bold text-black" 
                            // privacy policy scrollable native webview
                            onPress={() => {}}
                        >
                            Privacy Policy
                        </Text>

                    </Text>
                </View>

            </View>

        </View>
    );
}