import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { displayYear, type TitleRecord } from "./api";
import { BookCover } from "./BookCover";
import { colors, radius, shadow } from "./theme";

// A dark fade from the bottom of the cover so white text stays readable on any picture.
// (Stacked bands instead of a gradient library, to avoid a new dependency.)
const FADE = [0.0, 0.12, 0.28, 0.45, 0.62, 0.76, 0.86, 0.9];

export function Shade({ height = "64%" }: { height?: `${number}%` }) {
  return (
    <View pointerEvents="none" style={[styles.shade, { height }]}>
      {FADE.map((opacity, index) => (
        <View key={index} style={{ flex: 1, backgroundColor: `rgba(14,11,8,${opacity})` }} />
      ))}
    </View>
  );
}

export function BookTile({
  title,
  onOpen,
  footer,
}: {
  title: TitleRecord;
  onOpen: (id: string) => void;
  footer?: ReactNode;
}) {
  return (
    <View style={styles.tile}>
      <Pressable
        onPress={() => onOpen(title.id)}
        style={({ pressed }) => [styles.hero, pressed ? styles.pressed : null]}
        accessibilityRole="button"
        accessibilityLabel={`${title.work} by ${title.writer}`}
      >
        <BookCover title={title} style={StyleSheet.absoluteFill} showText={false} />
        <Shade />
        <View style={styles.heading}>
          <Text style={styles.tag} numberOfLines={1}>
            {title.category}
          </Text>
          <Text style={styles.work} numberOfLines={3}>
            {title.work}
          </Text>
          <Text style={styles.writer} numberOfLines={1}>
            {title.writer} · {displayYear(title.year)}
          </Text>
        </View>
      </Pressable>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: "hidden",
    ...shadow,
  },
  hero: { aspectRatio: 3 / 4, justifyContent: "flex-end" },
  pressed: { opacity: 0.85 },
  shade: { position: "absolute", left: 0, right: 0, bottom: 0 },
  heading: { padding: 12, gap: 3 },
  tag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.2)",
    color: "#fff",
    fontSize: 10,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    overflow: "hidden",
  },
  work: {
    color: "#fff",
    fontFamily: "serif",
    fontSize: 16,
    lineHeight: 21,
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowRadius: 6,
  },
  writer: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  footer: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 4, paddingVertical: 2 },
});
