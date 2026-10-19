import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';

// Short app copy that can be edited in the Supabase `app_text` table without
// an app release (backend/sql/004_app_text.sql). Shows the last value seen on
// this device right away, then refreshes from Supabase. Falls back to the
// built-in text when the table, the row or the network is missing.

const cacheKey = (key: string) => `app_text:${key}`;

export function useAppText(key: string, fallback: string) {
  const [text, setText] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cached = await AsyncStorage.getItem(cacheKey(key));
        if (!cancelled && cached) setText(cached);
      } catch {}

      const { data, error } = await supabase.from('app_text').select('value').eq('key', key).maybeSingle();
      if (cancelled || error) return;

      const value = data?.value?.trim();
      setText(value || fallback);
      try {
        if (value) await AsyncStorage.setItem(cacheKey(key), value);
        else await AsyncStorage.removeItem(cacheKey(key));
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [key, fallback]);

  return text;
}
