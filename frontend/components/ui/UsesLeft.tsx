import { Text, View } from 'react-native';
import { BRAND_GREEN, BRAND_INK, BRAND_MUTED, BRAND_YELLOW_SOFT } from '@/constants/Colors';

// Uses left is plain text, never a badge or pill. A limited count sits on a
// yellow highlighter mark; Unlimited is green text; spent is "Used up" in muted.

type UsesLeftProps = {
  // Infinity for unlimited coupons
  remaining: number;
};

export const usesLeftLabel = (remaining: number) =>
  !Number.isFinite(remaining) ? 'Unlimited' : remaining <= 0 ? 'Used up' : `${remaining} use${remaining === 1 ? '' : 's'} left`;

export default function UsesLeft({ remaining }: UsesLeftProps) {
  const label = usesLeftLabel(remaining);
  const text = { fontFamily: 'Figtree_700Bold', fontSize: 14, lineHeight: 20 } as const;

  if (!Number.isFinite(remaining)) {
    return <Text style={[text, { color: BRAND_GREEN }]}>{label}</Text>;
  }
  if (remaining <= 0) {
    return <Text style={[text, { color: BRAND_MUTED }]}>{label}</Text>;
  }
  return (
    // the mark hangs 6pt left of the text column so the words line up with the copy above
    <View style={{ alignSelf: 'flex-start', marginLeft: -6, paddingHorizontal: 6, borderRadius: 4, backgroundColor: BRAND_YELLOW_SOFT }}>
      <Text style={[text, { color: BRAND_INK }]}>{label}</Text>
    </View>
  );
}
