import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  addBookmark,
  addToShelf,
  displayYear,
  downloadCard,
  getTitle,
  removeBookmark,
  removeFromShelf,
  type ReaderProfile,
  type TitleRecord,
} from "./api";
import { BookCover } from "./BookCover";
import { Shade } from "./BookTile";
import { categoryColor } from "./covers";
import { PrimaryButton, SecondaryButton, colors, radius, shadow } from "./theme";

function facts(title: TitleRecord): [string, string][] {
  return [
    ["Writer", title.writer],
    ["Year", displayYear(title.year)],
    ["Section", title.category],
    ["Shelf mark", title.slug],
  ];
}

export function BookScreen({
  id,
  reader,
  onBack,
  onLibrarian,
  onChanged,
  topInset,
}: {
  id: string;
  reader: ReaderProfile | null;
  onBack: () => void;
  onLibrarian: () => void;
  onChanged: () => void;
  topInset: number;
}) {
  const [title, setTitle] = useState<TitleRecord | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getTitle(id)
      .then((next) => {
        if (!cancelled) setTitle(next);
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "That record could not be opened.");
      });
    return () => {
      cancelled = true;
    };
  }, [id, reader?.id]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setMessage("");
    try {
      await action();
      onChanged();
      setTitle(await getTitle(id));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The request did not finish.");
    } finally {
      setBusy(false);
    }
  }

  const topBar = (
    <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
      <Pressable onPress={onBack} style={({ pressed }) => [styles.glass, pressed ? styles.glassPressed : null]} accessibilityLabel="Back">
        <Text style={styles.glassText}>‹ Back</Text>
      </Pressable>
      <Pressable onPress={onLibrarian} style={({ pressed }) => [styles.glass, pressed ? styles.glassPressed : null]}>
        <Text style={styles.glassText}>Librarian</Text>
      </Pressable>
    </View>
  );

  if (!title) {
    return (
      <View style={[styles.screen, styles.loading]}>
        <View style={[styles.topBar, styles.topBarPlain, { paddingTop: topInset + 8 }]}>
          <Pressable onPress={onBack} style={styles.plainBack}>
            <Text style={styles.plainBackText}>‹ Back</Text>
          </Pressable>
        </View>
        <Text style={[styles.meta, styles.loadingText]}>{message || "Opening the record…"}</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scroll} bounces={false}>
        {/* Banner: the book's own cover, blurred, behind the title. */}
        <View style={[styles.hero, { backgroundColor: categoryColor(title.category, 18), paddingTop: topInset + 64 }]}>
          <BookCover title={title} size="M" style={StyleSheet.absoluteFill} showText={false} blurRadius={22} />
          <View style={styles.heroTint} />
          <Shade height="70%" />
          <BookCover title={title} size="L" style={styles.cover} />
          <Text style={styles.heroTag}>
            {title.category} · {displayYear(title.year)}
          </Text>
          <Text style={styles.heroTitle}>{title.work}</Text>
          <Text style={styles.heroWriter}>by {title.writer}</Text>
        </View>

        <View style={styles.body}>
          {message ? <Text style={styles.banner}>{message}</Text> : null}

          <View style={styles.actions}>
            <PrimaryButton label="Download bibliographic card" disabled={busy} onPress={() => void run(() => downloadCard(title))} />
            {reader ? (
              <View style={styles.actionRow}>
                <View style={styles.fill}>
                  <SecondaryButton
                    label={title.onShelf ? "✓ On shelf" : "Save to shelf"}
                    disabled={busy}
                    onPress={() => void run(() => (title.onShelf ? removeFromShelf(title.id) : addToShelf(title.id)))}
                  />
                </View>
                <View style={styles.fill}>
                  <SecondaryButton
                    label={title.bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
                    disabled={busy}
                    onPress={() => void run(() => (title.bookmarked ? removeBookmark(title.id) : addBookmark(title.id)))}
                  />
                </View>
              </View>
            ) : (
              <Text style={[styles.meta, styles.center]}>Sign in on the Account tab to keep a shelf.</Text>
            )}
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>About this work</Text>
            <Text style={styles.note}>{title.note}</Text>
          </View>

          <View style={styles.card}>
            {facts(title).map(([label, value]) => (
              <View key={label} style={styles.fact}>
                <Text style={styles.factLabel}>{label}</Text>
                <Text style={styles.factValue}>{value}</Text>
              </View>
            ))}
            {title.gutenbergUrl ? (
              <SecondaryButton label="Read free on Project Gutenberg ↗" onPress={() => void Linking.openURL(title.gutenbergUrl!)} />
            ) : null}
          </View>
        </View>
      </ScrollView>
      <View style={styles.topBarFloat} pointerEvents="box-none">
        {topBar}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  fill: { flex: 1 },
  center: { textAlign: "center" },
  loading: {},
  loadingText: { padding: 24, textAlign: "center" },
  scroll: { paddingBottom: 32 },
  topBarFloat: { position: "absolute", top: 0, left: 0, right: 0 },
  topBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBarPlain: { borderBottomWidth: 1, borderBottomColor: colors.line },
  glass: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "rgba(14,11,8,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  glassPressed: { backgroundColor: "rgba(14,11,8,0.65)" },
  glassText: { color: "#fff", fontWeight: "600" },
  plainBack: { paddingHorizontal: 6, paddingVertical: 8 },
  plainBackText: { color: colors.green, fontWeight: "600", fontSize: 16 },
  hero: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 26,
    overflow: "hidden",
  },
  heroTint: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, backgroundColor: "rgba(14,11,8,0.35)" },
  cover: {
    width: 150,
    aspectRatio: 2 / 3,
    borderRadius: 6,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  heroTag: { color: "rgba(255,255,255,0.85)", fontSize: 11, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 6 },
  heroTitle: { color: "#fff", fontFamily: "serif", fontSize: 28, lineHeight: 34, textAlign: "center" },
  heroWriter: { color: "rgba(255,255,255,0.88)", fontSize: 16, marginTop: 6, textAlign: "center" },
  body: { padding: 16, gap: 14 },
  actions: { gap: 10 },
  actionRow: { flexDirection: "row", gap: 10 },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 16,
    gap: 10,
    ...shadow,
  },
  cardTitle: { fontFamily: "serif", fontSize: 19, color: colors.ink },
  note: { color: colors.ink, fontSize: 16, lineHeight: 25 },
  fact: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  factLabel: { color: colors.faint },
  factValue: { color: colors.ink, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  meta: { color: colors.soft },
  banner: {
    backgroundColor: "#f6e7c8",
    borderColor: "#e4d0a4",
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 12,
    color: colors.ink,
    overflow: "hidden",
  },
});
