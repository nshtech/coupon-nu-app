import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { BRAND_INK, BRAND_LILAC, BRAND_MUTED } from '@/constants/Colors';
import Icon, { IconName } from '@/components/ui/Icon';

// A plain row on the page, not a card: bare line icon, 17/700 label, optional
// note under it, and a chevron or a control on the right. Rows after the first
// in a group get a 2px lilac divider.

type SettingsRowProps = {
  icon: IconName;
  label: string;
  note?: string;
  onPress?: () => void;
  // replaces the chevron, e.g. a toggle
  right?: ReactNode;
  divider?: boolean;
  color?: string;
  accessibilityHint?: string;
};

export default function SettingsRow({ icon, label, note, onPress, right, divider, color = BRAND_INK, accessibilityHint }: SettingsRowProps) {
  const content = (
    <>
      <Icon name={icon} size={24} color={color} strokeWidth={2} />
      <View style={{ flex: 1, marginLeft: 14, marginRight: 12 }}>
        <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 17, color }}>{label}</Text>
        {note ? (
          <Text style={{ marginTop: 1, fontFamily: 'Figtree_500Medium', fontSize: 13, lineHeight: 17, color: BRAND_MUTED }}>{note}</Text>
        ) : null}
      </View>
      {right ?? (onPress ? <Icon name="chevronRight" size={20} color={BRAND_MUTED} strokeWidth={2.5} /> : null)}
    </>
  );

  const rowStyle = {
    minHeight: 54,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: divider ? 2 : 0,
    borderTopColor: BRAND_LILAC,
  };

  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      style={rowStyle}
    >
      {({ pressed }) => <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.6 : 1 }}>{content}</View>}
    </Pressable>
  );
}
