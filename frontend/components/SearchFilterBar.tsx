import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Chip from '@/components/ui/Chip';
import Display from '@/components/ui/Display';
import Icon, { IconName } from '@/components/ui/Icon';
import { Raised } from '@/components/ui/Raised';
import { PrimaryButton, TextButton } from '@/components/ui/Button';
import { BRAND_CREAM, BRAND_INK, BRAND_LILAC, BRAND_MUTED, OUTLINE, SHADOW_SM, WHITE } from '@/constants/Colors';
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

const PLACE_TYPE_ICONS: Record<PlaceType, IconName> = {
  food: 'food',
  coffee: 'coffee',
  treats: 'treats',
  fitness: 'fitness',
  beauty: 'beauty',
  shopping: 'shopping',
  fun: 'fun',
};

// horizontal page padding the chip row bleeds past
const GUTTER = 16;

const tick = () => Haptics.selectionAsync().catch(() => {});

function OptionRow({
  label,
  selected,
  onPress,
  kind,
  icon,
  count,
  divider,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  kind: 'checkbox' | 'radio';
  icon?: IconName;
  count?: number;
  divider?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={kind}
      accessibilityState={{ checked: selected }}
      accessibilityLabel={count === undefined ? label : `${label}, ${count} deal${count === 1 ? '' : 's'}`}
      style={{
        minHeight: 54,
        justifyContent: 'center',
        paddingVertical: 8,
        borderTopWidth: divider ? 2 : 0,
        borderTopColor: BRAND_LILAC,
      }}
    >
      {({ pressed }) => (
      <View style={{ flexDirection: 'row', alignItems: 'center', opacity: pressed ? 0.6 : 1 }}>
      {icon ? (
        <View style={{ marginRight: 14 }}>
          <Icon name={icon} size={22} />
        </View>
      ) : null}
      <Text style={{ flex: 1, fontFamily: 'Figtree_700Bold', fontSize: 17, color: BRAND_INK }}>{label}</Text>
      {count !== undefined ? (
        <Text style={{ marginRight: 12, fontFamily: 'Figtree_600SemiBold', fontSize: 15, color: BRAND_MUTED }}>{count}</Text>
      ) : null}
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: kind === 'radio' ? 13 : 7,
          borderWidth: OUTLINE,
          borderColor: BRAND_INK,
          backgroundColor: selected ? BRAND_INK : WHITE,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {selected ? <Icon name="check" size={16} color={BRAND_CREAM} strokeWidth={3} /> : null}
      </View>
      </View>
      )}
    </Pressable>
  );
}

function SheetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: 24 }}>
      <Display accessibilityRole="header" size={22} style={{ marginBottom: 4 }}>
        {title}
      </Display>
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
      <Raised radius={26} offset={SHADOW_SM} style={{ marginRight: SHADOW_SM }}>
        <View
          style={{
            height: 52,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 18,
            borderRadius: 26,
            borderWidth: OUTLINE,
            borderColor: BRAND_INK,
            backgroundColor: WHITE,
          }}
        >
          <Icon name="search" size={22} color={BRAND_MUTED} strokeWidth={2.5} />
          <TextInput
            value={filters.query}
            onChangeText={query => onChange({ ...filters, query })}
            placeholder={placeholder}
            placeholderTextColor={BRAND_MUTED}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="never"
            accessibilityLabel={placeholder}
            style={{ flex: 1, height: '100%', marginLeft: 10, fontFamily: 'Figtree_500Medium', fontSize: 17, color: BRAND_INK }}
          />
          {filters.query ? (
            <Pressable
              onPress={() => onChange({ ...filters, query: '' })}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              hitSlop={12}
            >
              <Icon name="close" size={20} color={BRAND_MUTED} strokeWidth={2.5} />
            </Pressable>
          ) : null}
        </View>
      </Raised>

      {/* bleeds past the screen padding so chips scroll edge to edge */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        style={{ marginHorizontal: -GUTTER, marginTop: 14 }}
        contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 8 }}
      >
        <Chip
          label="Filters"
          icon="filters"
          selected={activeCount > 0}
          count={activeCount || undefined}
          onPress={openSheet}
          accessibilityLabel={activeCount ? `Filters, ${activeCount} applied` : 'Filters'}
        />
        {filters.usage !== 'all' && usageLabel ? (
          <Chip
            label={usageLabel}
            selected
            removable
            onPress={() => {
              tick();
              onChange({ ...filters, usage: 'all' });
            }}
            accessibilityLabel={`${usageLabel}, remove filter`}
          />
        ) : null}
        {placeTypes.map(type => (
          <Chip
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
        <View style={{ flex: 1, backgroundColor: BRAND_CREAM, paddingTop: Platform.OS === 'android' ? insets.top : 0 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: OUTLINE,
              borderBottomColor: BRAND_INK,
            }}
          >
            <View style={{ width: 40 }} />
            <Display accessibilityRole="header" size={24}>
              Filters
            </Display>
            <Pressable
              onPress={() => setIsSheetOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
              hitSlop={4}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                borderWidth: OUTLINE,
                borderColor: BRAND_INK,
                backgroundColor: WHITE,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="close" size={20} />
            </Pressable>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
            {placeTypes.length > 0 ? (
              <SheetSection title="Place type">
                {placeTypes.map((type, index) => (
                  <OptionRow
                    key={type.key}
                    kind="checkbox"
                    label={type.label}
                    icon={PLACE_TYPE_ICONS[type.key]}
                    count={type.count}
                    divider={index > 0}
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
              {USAGE_OPTIONS.map((option, index) => (
                <OptionRow
                  key={option.key}
                  kind="radio"
                  label={option.label}
                  divider={index > 0}
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
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 16),
              borderTopWidth: OUTLINE,
              borderTopColor: BRAND_INK,
              backgroundColor: BRAND_CREAM,
            }}
          >
            <TextButton
              label="Clear all"
              underline
              onPress={() => {
                tick();
                setDraft({ ...EMPTY_FILTERS, query: filters.query });
              }}
              disabled={countActiveFilters(draft) === 0}
            />
            <PrimaryButton
              style={{ flex: 1 }}
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
