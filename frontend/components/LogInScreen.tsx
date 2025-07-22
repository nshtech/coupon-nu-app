import React, { useEffect, useState } from 'react';
import { Button, TouchableOpacity, View, Text, Pressable } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import * as AuthSession from 'expo-auth-session';
import { supabase } from '@/utils/supabase';



export default function LogInScreen() {

    const { login } = useAuth();

    // testtesttest
    const [firstId, setFirstId] = useState<string>('not found');


    useEffect(() => {
        async function fetchFirstId() {
            const { data, error } = await supabase
                .from('siem')
                .select('text')
                .limit(1)
                .single();
            // console.log('Fetched data:', data);
            if (error) {
                console.error(error);
                setFirstId('not found');
            } else {
                setFirstId(data?.text ?? 'not found');
            }
        }
        fetchFirstId();
    }, []);

    // testtesttest



    return (
        <View className="flex-1 bg-white ">

            <View className="items-center py-10 mt-20 justify-center">
                <Text className="text-black text-5xl font-inter-bold">Coupon NU</Text>
            </View>

            {/* Display the first row's ID from Supabase */}
            <View className="items-center mt-4">
                <Text className="text-lg text-gray-700">testesttest {firstId}</Text>
            </View>

            <View className="items-center justify-center gap-5 mt-60">

                <TouchableOpacity className="bg-purple-80 px-16 py-2 rounded-lg" onPress={() => login()}>
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