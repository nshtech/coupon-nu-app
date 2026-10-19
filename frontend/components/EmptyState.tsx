import { View, Text, Pressable } from 'react-native';

type EmptyStateProps = {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View className="mt-6 items-center rounded-card border border-brand-tan bg-white px-6 py-9">
      <Text accessibilityRole="header" className="text-center font-display text-xl text-brand-purple">
        {title}
      </Text>
      <Text className="mt-2 text-center font-body text-base leading-6 text-brand-purple-soft">{message}</Text>
      {actionLabel && onAction ? (
        <Pressable
          onPress={onAction}
          accessibilityRole="button"
          className="mt-5 min-h-11 justify-center rounded-full bg-brand-purple px-6 active:opacity-80"
        >
          <Text className="font-display-medium text-base text-brand-cream">{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
