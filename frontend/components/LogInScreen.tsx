import React, { useEffect, useState } from 'react';
import { Button, TouchableOpacity, View, Text, Pressable } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import * as AuthSession from 'expo-auth-session';
import { useAuthRequest } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';

WebBrowser.maybeCompleteAuthSession();



export default function LogInScreen() {

    

    const { login } = useAuth();




    // this seems to be the problem, previously used depracated getRedirectUrl
    const redirectUri = AuthSession.makeRedirectUri({
        // useProxy: true,
    });
    // console.log(redirectUri);

    // const [request, response, promptAsync] = useAuthRequest(
    //     {
    //         clientId: 'fake',
    //         scopes: [],
    //         redirectUri,log
    //     },
    //     { authorizationEndpoint: '' }
    // );

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
        // console.log(data.url);
        console.log(result);

        if (result.type === 'success') {
            console.log('Waiting for session data...');
        } else {
            console.warn('Login cancelled or failed:', result);
        }

    };

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                console.log('✅ Logged in:', session);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);




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