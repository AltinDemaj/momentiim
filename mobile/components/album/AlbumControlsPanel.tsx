import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocale } from '@/context/LocaleContext';
import { celebration as C } from '@/theme';

export type MediaFilter = 'all' | 'photos' | 'videos';

interface AlbumControlsPanelProps {
  mediaFilter: MediaFilter;
  onMediaFilterChange: (filter: MediaFilter) => void;
  photoCount: number;
  reelCount: number;
  mediaCount: number;
  totalItems: number;
  canSlideshow: boolean;
  onSlideshow: () => void;
  selectMode: boolean;
  selectedCount: number;
  allowDownload: boolean;
  allowShare: boolean;
  downloading: boolean;
  sharing?: boolean;
  onToggleSelect: () => void;
  onSaveAll: () => void;
  onSaveSelected: () => void;
  onShare: () => void;
}

function ActionButton({
  icon,
  label,
  onPress,
  disabled,
  active,
  loading,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  active?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.actionBtn,
        active && styles.actionBtnActive,
        disabled && styles.actionBtnDisabled,
        pressed && !disabled && styles.actionBtnPressed,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={C.color.accent} size="small" />
      ) : (
        <Ionicons
          name={icon}
          size={20}
          color={active ? '#1A1612' : C.color.accent}
        />
      )}
      <Text style={[styles.actionLabel, active && styles.actionLabelActive]}>{label}</Text>
    </Pressable>
  );
}

export function AlbumControlsPanel({
  mediaFilter,
  onMediaFilterChange,
  photoCount,
  reelCount,
  mediaCount,
  totalItems,
  canSlideshow,
  onSlideshow,
  selectMode,
  selectedCount,
  allowDownload,
  allowShare,
  downloading,
  sharing,
  onToggleSelect,
  onSaveAll,
  onSaveSelected,
  onShare,
}: AlbumControlsPanelProps) {
  const { t } = useLocale();
  const showActions = allowDownload || allowShare;
  const filters: { key: MediaFilter; label: string; icon: keyof typeof Ionicons.glyphMap; show: boolean }[] = [
    { key: 'all', label: t('album.filterAll'), icon: 'grid-outline', show: true },
    { key: 'photos', label: t('album.filterPhotos'), icon: 'image-outline', show: photoCount > 0 },
    { key: 'videos', label: t('album.filterVideos'), icon: 'videocam-outline', show: reelCount > 0 },
  ];
  const visibleFilters = filters.filter((f) => f.show);

  return (
    <View style={styles.card}>
      {visibleFilters.length > 1 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('album.show')}</Text>
          <View style={styles.segmented}>
            {visibleFilters.map((f, i) => {
              const active = mediaFilter === f.key;
              return (
                <Pressable
                  key={f.key}
                  style={[
                    styles.segment,
                    i === 0 && styles.segmentFirst,
                    i === visibleFilters.length - 1 && styles.segmentLast,
                    active && styles.segmentActive,
                  ]}
                  onPress={() => onMediaFilterChange(f.key)}
                >
                  <Ionicons
                    name={f.icon}
                    size={15}
                    color={active ? '#1A1612' : C.color.muted}
                  />
                  <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {canSlideshow && (
        <Pressable
          style={({ pressed }) => [styles.slideshowBtn, pressed && styles.slideshowBtnPressed]}
          onPress={onSlideshow}
        >
          <View style={styles.slideshowIcon}>
            <Ionicons name="play" size={16} color="#1A1612" />
          </View>
          <View style={styles.slideshowCopy}>
            <Text style={styles.slideshowTitle}>{t('album.playSlideshow')}</Text>
            <Text style={styles.slideshowSub}>{t('album.slideshowSub', { n: totalItems })}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(26,22,18,0.35)" />
        </Pressable>
      )}

      {showActions && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{t('album.actions')}</Text>
          <View style={styles.actionsRow}>
            {allowDownload && mediaCount > 0 && (
              <ActionButton
                icon={selectMode ? 'checkmark-circle' : 'checkbox-outline'}
                label={selectMode ? t('album.done') : t('album.select')}
                onPress={onToggleSelect}
                active={selectMode}
              />
            )}
            {allowDownload && (
              <ActionButton
                icon="download-outline"
                label={t('album.saveAll')}
                onPress={onSaveAll}
                disabled={mediaCount === 0}
                loading={downloading && !selectMode}
              />
            )}
            {allowShare && (
              <ActionButton
                icon="share-outline"
                label={t('album.share')}
                onPress={onShare}
                disabled={mediaCount === 0}
                loading={sharing}
              />
            )}
          </View>
        </View>
      )}

      {selectMode && allowDownload && (
        <Pressable
          style={[styles.saveSelected, selectedCount === 0 && styles.saveSelectedDisabled]}
          onPress={onSaveSelected}
          disabled={downloading || selectedCount === 0}
        >
          {downloading ? (
            <ActivityIndicator color="#1A1612" />
          ) : (
            <>
              <Ionicons name="images-outline" size={18} color="#1A1612" />
              <Text style={styles.saveSelectedText}>
                {selectedCount > 0
                  ? t('album.saveSelected', { n: selectedCount })
                  : t('album.selectBelow')}
              </Text>
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: C.spacing.lg,
    marginTop: 14,
    backgroundColor: C.color.card,
    borderRadius: C.radius.lg,
    borderWidth: 1,
    borderColor: C.color.border,
    padding: 14,
    gap: 14,
    shadowColor: '#1A1612',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: C.color.muted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginLeft: 2,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: C.color.bgSecondary,
    borderRadius: C.radius.md,
    padding: 3,
    gap: 3,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 11,
  },
  segmentFirst: {},
  segmentLast: {},
  segmentActive: {
    backgroundColor: '#fff',
    shadowColor: '#1A1612',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentText: {
    color: C.color.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#1A1612',
  },
  slideshowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: C.color.accentDim,
    borderRadius: C.radius.md,
    borderWidth: 1,
    borderColor: 'rgba(201,169,110,0.25)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  slideshowBtnPressed: {
    opacity: 0.92,
  },
  slideshowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.color.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
  slideshowCopy: {
    flex: 1,
    gap: 2,
  },
  slideshowTitle: {
    color: C.color.text,
    fontSize: 15,
    fontWeight: '700',
  },
  slideshowSub: {
    color: C.color.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: C.radius.md,
    backgroundColor: C.color.bgSecondary,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionBtnActive: {
    backgroundColor: C.color.accent,
    borderColor: C.color.accent,
  },
  actionBtnDisabled: {
    opacity: 0.45,
  },
  actionBtnPressed: {
    opacity: 0.88,
  },
  actionLabel: {
    color: C.color.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  actionLabelActive: {
    color: '#1A1612',
  },
  saveSelected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.color.accent,
    borderRadius: C.radius.md,
    paddingVertical: 14,
  },
  saveSelectedDisabled: {
    backgroundColor: C.color.bgSecondary,
    opacity: 0.7,
  },
  saveSelectedText: {
    color: '#1A1612',
    fontSize: 14,
    fontWeight: '700',
  },
});
