import { useState } from "react";
import { Image, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import type { TitleRecord } from "./api";
import { categoryColor, coverUrl } from "./covers";
import { colors } from "./theme";

type Props = {
  title: Pick<TitleRecord, "slug" | "work" | "writer" | "category">;
  size?: "M" | "L";
  style?: StyleProp<ViewStyle>;
  /** Show the title and writer on the plain cover (off when the title is printed over it anyway). */
  showText?: boolean;
  blurRadius?: number;
};

/** The book's cover picture, or a cloth-bound style cover in the section colour. */
export function BookCover({ title, size = "M", style, showText = true, blurRadius }: Props) {
  const url = coverUrl(title.slug, size);
  const [failed, setFailed] = useState(false);

  if (url && !failed) {
    return (
      <View style={[styles.frame, { backgroundColor: categoryColor(title.category, 26) }, style]}>
        <Image
          source={{ uri: url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={blurRadius}
          onError={() => setFailed(true)}
          accessibilityIgnoresInvertColors
        />
      </View>
    );
  }

  return (
    <View style={[styles.frame, styles.plain, { backgroundColor: categoryColor(title.category) }, style]}>
      <View style={styles.spine} />
      {showText ? (
        <>
          <View style={styles.rule} />
          <Text style={styles.plainWork} numberOfLines={4}>
            {title.work}
          </Text>
          <Text style={styles.plainWriter} numberOfLines={2}>
            {title.writer}
          </Text>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: "hidden" },
  plain: { justifyContent: "center", alignItems: "center", padding: 14, gap: 8 },
  spine: { position: "absolute", left: 0, top: 0, bottom: 0, width: "6%", backgroundColor: "rgba(0,0,0,0.22)" },
  rule: { width: "40%", height: 2, backgroundColor: colors.gold },
  plainWork: { color: "#f8f1e1", fontFamily: "serif", fontSize: 15, textAlign: "center" },
  plainWriter: { color: "rgba(248,241,225,0.8)", fontSize: 10, letterSpacing: 1, textTransform: "uppercase", textAlign: "center" },
});
