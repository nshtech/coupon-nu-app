import { Text, View } from 'react-native';
import { Image, ImageSource } from 'expo-image';
import { BRAND_INK, BRAND_LILAC, BRAND_MUTED, OUTLINE, RADIUS } from '@/constants/Colors';
import Display from '@/components/ui/Display';
import { PrimaryButton } from '@/components/ui/Button';

// Lilac panel with an optional Willie, a display headline, one line of copy and
// at most one button.

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  image?: ImageSource | number;
};

export default function EmptyState({ title, message, actionLabel, onAction, image }: EmptyStateProps) {
  return (
    <View
      style={{
        marginTop: 6,
        alignItems: 'center',
        paddingHorizontal: 22,
        paddingTop: 26,
        paddingBottom: 28,
        borderRadius: RADIUS.panel,
        borderWidth: OUTLINE,
        borderColor: BRAND_INK,
        backgroundColor: BRAND_LILAC,
      }}
    >
      {image ? (
        <Image source={image} contentFit="contain" style={{ width: 150, height: 105, marginBottom: 16 }} accessible={false} />
      ) : null}
      <Display accessibilityRole="header" size={28} style={{ textAlign: 'center' }}>
        {title}
      </Display>
      <Text style={{ marginTop: 8, textAlign: 'center', fontFamily: 'Figtree_400Regular', fontSize: 16, lineHeight: 22, color: BRAND_MUTED }}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} size="sm" style={{ marginTop: 18 }} />
      ) : null}
    </View>
  );
}
