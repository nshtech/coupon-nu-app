import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';

// Short app copy that can be edited in the Supabase `app_text` table without
// an app release (backend/sql/004_app_text.sql). Shows the last value seen on
// this device right away, then refreshes from Supabase. Falls back to the
// built-in text when the table, the row or the network is missing.
//
// The whole table (a handful of rows) is read once per app launch and shared by
// every screen, instead of one request per headline. Edits show up on the next
// launch.

const cacheKey = (key: string) => `app_text:${key}`;

let allTextRequest: Promise<Map<string, string> | null> | null = null;

const fetchAllText = () => {
  if (!allTextRequest) {
    allTextRequest = Promise.resolve(supabase.from('app_text').select('key, value'))
      .then(({ data, error }) => {
        if (error) throw error;
        return new Map((data ?? []).map(row => [row.key as string, row.value as string]));
      })
      .catch(() => {
        // let the next screen that mounts try again
        allTextRequest = null;
        return null;
      });
  }
  return allTextRequest;
};

export function useAppText(key: string, fallback: string) {
  const [text, setText] = useState(fallback);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const cached = await AsyncStorage.getItem(cacheKey(key));
        if (!cancelled && cached) setText(cached);
      } catch {}

      const rows = await fetchAllText();
      if (cancelled || !rows) return;

      const value = rows.get(key)?.trim();
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
