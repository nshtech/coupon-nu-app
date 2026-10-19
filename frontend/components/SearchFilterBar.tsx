import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Check,
  Coffee,
  Dumbbell,
  LucideIcon,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Ticket,
  Utensils,
  X,
} from 'lucide-react-native';
import TactileButton from '@/components/TactileButton';
import { BRAND_CREAM, BRAND_PURPLE, BRAND_PURPLE_SOFT, CARD_SHADOW } from '@/constants/Colors';
import {
  CouponFilters,
  EMPTY_FILTERS,
  PlaceType,
  USAGE_OPTIONS,
  applyCouponFilters,
  countActiveFilters,
  placeTypeCounts,
  togglePlaceType,
} from '@/utils/couponFilters';

// Search field plus a sideways-scrolling row of quick filter chips. Place type
// chips apply on tap; "Filters" opens a sheet with every option and a
// "Show N deals" button, so nothing changes under the user until they confirm.

const PLACE_TYPE_ICONS: Record<PlaceType, LucideIcon> = {
  food: Utensils,
  coffee: Coffee,
  fitness: Dumbbell,
  beauty: Sparkles,
  shopping: ShoppingBag,
  fun: Ticket,
};

const tick = () => Haptics.selectionAsync().catch(() => {});

function QuickChip({
  label,
  selected,
  onPress,
  icon: Icon,
  badge,
  trailingX,
  accessibilityLabel,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: LucideIcon;
  badge?: number;
  trailingX?: boolean;
  accessibilityLabel?: string;
}) {
  const color = selected ? '#ffffff' : BRAND_PURPLE;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected }}
      className={`h-10 flex-row items-center rounded-full border px-3.5 active:opacity-80 ${selected ? 'border-brand-purple bg-brand-purple' : 'border-brand-tan bg-white'}`}
    >
      {Icon ? <Icon size={16} color={color} strokeWidth={2.25} /> : null}
      <Text className={`font-display-medium text-sm ${Icon ? 'ml-1.5' : ''} ${selected ? 'text-white' : 'text-brand-purple'}`}>
        {label}
      </Text>
      {badge ? (
        <View className="ml-1.5 h-5 min-w-5 items-center justify-center rounded-full bg-brand-cream px-1">
          <Text className="font-display text-xs text-brand-purple">{badge}</Text>
        </View>
      ) : null}
      {trailingX ? <X size={14} color={color} strokeWidth={2.5} style={{ marginLeft: 6 }} /> : null}
    </Pressable>
  );
}

function OptionRow({
  label,
  selected,
  onPress,
  kind,
  icon: Icon,
  count,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  kind: 'checkbox' | 'radio';
  icon?: LucideIcon;
  count?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={kind}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count} deal${count === 1 ? '' : 's'}`}
      className="min-h-14 flex-row items-center border-b border-brand-cream py-2 active:opacity-70"
    >
      {Icon ? (
        <View className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-brand-cream-soft">
          <Icon size={18} color={BRAND_PURPLE} strokeWidth={2.25} />
        </View>
      ) : null}
      <Text className="flex-1 font-body-medium text-base text-brand-ink">{label}</Text>
      {count !== undefined ? <Text className="mr-3 font-body text-sm text-brand-purple-soft">{count}</Text> : null}
      <View
        className={`h-6 w-6 items-center justify-center border-2 ${kind === 'radio' ? 'rounded-full' : 'rounded-md'} ${selected ? 'border-brand-purple bg-brand-purple' : 'border-purple-30 bg-white'}`}
      >
        {selected ? <Check size={14} color={BRAND_CREAM} strokeWidth={3} /> : null}
      </View>
    </Pressable>
  );
}

function SheetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="mt-6">
      <Text accessibilityRole="header" className="mb-1 font-display text-lg text-brand-purple">
        {title}
      </Text>
      {children}
    </View>
  );
}

type SearchFilterBarProps = {
  filters: CouponFilters;
  onChange: (filters: CouponFilters) => void;
  // the full list being filtered, used for the place type options and counts
  coupons: any[];
  placeholder?: string;
};

export default function SearchFilterBar({ filters, onChange, coupons, placeholder = 'Search deals' }: SearchFilterBarProps) {
  const insets = useSafeAreaInsets();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  // the sheet edits a copy; only "Show N deals" applies it
  const [draft, setDraft] = useState(filters);
  const activeCount = countActiveFilters(filters);
  const placeTypes = useMemo(() => placeTypeCounts(coupons), [coupons]);
  const draftResultCount = useMemo(() => applyCouponFilters(coupons, draft).length, [coupons, draft]);
  const usageLabel = USAGE_OPTIONS.find(option => option.key === filters.usage)?.label;

  const openSheet = () => {
    setDraft(filters);
    setIsSheetOpen(true);
  };

  const applyDraft = () => {
    onChange({ ...draft, query: filters.query });
    setIsSheetOpen(false);
  };

  return (
    <View>
      <View className="h-12 flex-row items-center rounded-2xl border border-brand-tan bg-white px-3.5" style={CARD_SHADOW}>
        <Search size={18} color={BRAND_PURPLE_SOFT} />
        <TextInput
          value={filters.query}
          onChangeText={query => onChange({ ...filters, query })}
          placeholder={placeholder}
          placeholderTextColor={BRAND_PURPLE_SOFT}
          returnKeyType="search"
          autoCorrect={false}
          clearButtonMode="never"
          accessibilityLabel={placeholder}
          className="ml-2 h-full flex-1 font-body text-base text-brand-ink"
        />
        {filters.query ? (
          <Pressable
            onPress={() => onChange({ ...filters, query: '' })}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            hitSlop={12}
          >
            <X size={18} color={BRAND_PURPLE_SOFT} />
          </Pressable>
        ) : null}
      </View>

      {/* bleeds past the screen padding so chips scroll edge to edge */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ marginHorizontal: -20, marginTop: 12 }}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
      >
        <QuickChip
          label="Filters"
          icon={SlidersHorizontal}
          selected={activeCount > 0}
          badge={activeCount || undefined}
          onPress={openSheet}
          accessibilityLabel={activeCount ? `Filters, ${activeCount} applied` : 'Filters'}
        />
        {filters.usage !== 'all' && usageLabel ? (
          <QuickChip
            label={usageLabel}
            selected
            trailingX
            onPress={() => {
              tick();
              onChange({ ...filters, usage: 'all' });
            }}
            accessibilityLabel={`${usageLabel}, remove filter`}
          />
        ) : null}
        {placeTypes.map(type => (
          <QuickChip
            key={type.key}
            label={type.label}
            icon={PLACE_TYPE_ICONS[type.key]}
            selected={filters.placeTypes.includes(type.key)}
            onPress={() => {
              tick();
              onChange(togglePlaceType(filters, type.key));
            }}
          />
        ))}
      </ScrollView>

      <Modal
        visible={isSheetOpen}
        animationType="slide"
        // native iOS sheet: swipe down to dismiss (discards the draft)
        presentationStyle="pageSheet"
        onRequestClose={() => setIsSheetOpen(false)}
      >
        <View className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'android' ? insets.top : 0 }}>
          <View className="flex-row items-center justify-between border-b border-brand-cream px-5 py-3">
            <View className="w-11" />
            <Text accessibilityRole="header" className="font-display text-xl text-brand-purple">
              Filters
            </Text>
            <Pressable
              onPress={() => setIsSheetOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              className="h-11 w-11 items-center justify-center rounded-full bg-brand-cream-soft active:opacity-70"
            >
              <X size={20} color={BRAND_PURPLE} />
            </Pressable>
          </View>

          <ScrollView className="flex-1" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
            {placeTypes.length > 0 ? (
              <SheetSection title="Place type">
                {placeTypes.map(type => (
                  <OptionRow
                    key={type.key}
                    kind="checkbox"
                    label={type.label}
                    icon={PLACE_TYPE_ICONS[type.key]}
                    count={type.count}
                    selected={draft.placeTypes.includes(type.key)}
                    onPress={() => {
                      tick();
                      setDraft(current => togglePlaceType(current, type.key));
                    }}
                  />
                ))}
              </SheetSection>
            ) : null}

            <SheetSection title="Coupon type">
              {USAGE_OPTIONS.map(option => (
                <OptionRow
                  key={option.key}
                  kind="radio"
                  label={option.label}
                  selected={draft.usage === option.key}
                  onPress={() => {
                    tick();
                    setDraft(current => ({ ...current, usage: option.key }));
                  }}
                />
              ))}
            </SheetSection>
          </ScrollView>

          <View
            className="flex-row items-center gap-4 border-t border-brand-cream bg-white px-5 pt-4"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <Pressable
              onPress={() => {
                tick();
                setDraft({ ...EMPTY_FILTERS, query: filters.query });
              }}
              disabled={countActiveFilters(draft) === 0}
              accessibilityRole="button"
              accessibilityState={{ disabled: countActiveFilters(draft) === 0 }}
              hitSlop={8}
              className="py-2"
            >
              <Text
                className={`font-display-medium text-base underline ${countActiveFilters(draft) === 0 ? 'text-purple-30' : 'text-brand-purple'}`}
              >
                Clear all
              </Text>
            </Pressable>
            <TactileButton
              className="flex-1"
              label={draftResultCount === 0 ? 'No matching deals' : `Show ${draftResultCount} deal${draftResultCount === 1 ? '' : 's'}`}
              disabled={draftResultCount === 0}
              onPress={applyDraft}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
