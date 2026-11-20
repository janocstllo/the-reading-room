import { useEffect, useState, type ReactNode } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  createTitle,
  deskSummary,
  getBookmarks,
  getCategories,
  getShelf,
  getTitles,
  login,
  logout,
  me,
  register,
  removeBookmark,
  removeFromShelf,
  saveBase,
  saveToken,
  DEFAULT_BASE,
  getBase,
  type ReaderProfile,
  type TitleRecord,
} from "./api";
import { BookTile } from "./BookTile";
import { PrimaryButton, SecondaryButton, TextButton, colors, radius, shadow } from "./theme";

const UNREACHABLE = "The reading room could not be reached. Check the API address on the Account tab.";

type TabName = "catalog" | "shelf" | "marks" | "account";

const ALL_SECTIONS = "";

/** Half-width cell so a lone last book in the 2-column grid keeps its size. */
function Cell({ children }: { children: ReactNode }) {
  return <View style={styles.cell}>{children}</View>;
}

const TABS: readonly (readonly [TabName, string, string])[] = [
  ["catalog", "Catalog", "▦"],
  ["shelf", "Shelf", "▤"],
  ["marks", "Marks", "★"],
  ["account", "Account", "●"],
];

export function Tabs({
  tab,
  onTab,
  onOpen,
  onLibrarian,
  reader,
  onReader,
  shelfVersion,
  topInset,
}: {
  tab: TabName;
  onTab: (tab: TabName) => void;
  onOpen: (id: string) => void;
  onLibrarian: () => void;
  reader: ReaderProfile | null;
  onReader: (reader: ReaderProfile | null) => void;
  shelfVersion: number;
  topInset: number;
}) {
  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>R</Text>
          </View>
          <View>
            <Text style={styles.brand}>The Reading Room</Text>
            <Text style={styles.kicker}>A public-domain catalog</Text>
          </View>
        </View>
        <Pressable onPress={onLibrarian} style={({ pressed }) => [styles.pill, pressed ? styles.pillPressed : null]}>
          <Text style={styles.pillText}>Librarian</Text>
        </Pressable>
      </View>
      <View style={styles.body}>
        {tab === "catalog" ? <CatalogPane onOpen={onOpen} /> : null}
        {tab === "shelf" ? <ShelfPane reader={reader} onOpen={onOpen} shelfVersion={shelfVersion} /> : null}
        {tab === "marks" ? <MarksPane reader={reader} onOpen={onOpen} shelfVersion={shelfVersion} /> : null}
        {tab === "account" ? <AccountPane reader={reader} onReader={onReader} /> : null}
      </View>
      <View style={styles.tabs}>
        {TABS.map(([name, label, icon]) => {
          const on = name === tab;
          return (
            <Pressable key={name} onPress={() => onTab(name)} style={styles.tab} accessibilityRole="tab" accessibilityState={{ selected: on }}>
              <View style={[styles.tabIndicator, on ? styles.tabIndicatorOn : null]} />
              <Text style={[styles.tabIcon, on ? styles.tabOn : styles.tabOff]}>{icon}</Text>
              <Text style={on ? styles.tabOn : styles.tabOff}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.meta}>{body}</Text>
    </View>
  );
}

function CatalogPane({ onOpen }: { onOpen: (id: string) => void }) {
  const [draft, setDraft] = useState({ title: "", author: "", category: "" });
  const [query, setQuery] = useState(draft);
  const [titles, setTitles] = useState<TitleRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [problem, setProblem] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showAuthor, setShowAuthor] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const pull = async () => {
      try {
        const next = await getTitles(query);
        if (cancelled) return;
        setTitles(next);
        setProblem(false);
        setLoaded(true);
        getCategories()
          .then((rows) => {
            if (!cancelled) setCategories(rows);
          })
          .catch(() => undefined);
      } catch {
        if (cancelled) return;
        setProblem(true);
        timer = setTimeout(pull, 4000);
      }
    };
    void pull();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [query]);

  const chipOptions = [ALL_SECTIONS, ...categories];

  function pickCategory(category: string) {
    const next = { ...draft, category };
    setDraft(next);
    setQuery(next);
  }

  const header = (
    <View style={styles.filters}>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.input, styles.searchInput]}
          placeholder="Search titles"
          placeholderTextColor={colors.faint}
          value={draft.title}
          onChangeText={(title) => setDraft({ ...draft, title })}
          onSubmitEditing={() => setQuery(draft)}
          returnKeyType="search"
        />
        <PrimaryButton label="Search" onPress={() => setQuery(draft)} />
      </View>
      {showAuthor ? (
        <TextInput
          style={styles.input}
          placeholder="Author"
          placeholderTextColor={colors.faint}
          value={draft.author}
          onChangeText={(author) => setDraft({ ...draft, author })}
          onSubmitEditing={() => setQuery(draft)}
          returnKeyType="search"
        />
      ) : null}
      <View style={styles.row}>
        <TextButton label={showAuthor ? "Hide author" : "Search by author"} onPress={() => setShowAuthor(!showAuthor)} />
        {draft.title || draft.author || draft.category ? (
          <TextButton
            label="Clear"
            onPress={() => {
              const empty = { title: "", author: "", category: "" };
              setDraft(empty);
              setQuery(empty);
            }}
          />
        ) : null}
      </View>
      {categories.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chipOptions.map((category) => {
            const on = query.category === category;
            return (
              <Pressable key={category || "all"} onPress={() => pickCategory(category)} style={[styles.chip, on ? styles.chipOn : null]}>
                <Text style={on ? styles.chipTextOn : styles.chipText}>{category || "All"}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
      {problem ? <Text style={styles.banner}>{UNREACHABLE}</Text> : null}
      {!loaded && !problem ? <Text style={styles.meta}>Opening the shelves…</Text> : null}
      {loaded && !problem ? (
        <Text style={styles.count}>
          {titles.length} {titles.length === 1 ? "title" : "titles"}
        </Text>
      ) : null}
    </View>
  );

  return (
    <FlatList
      data={titles}
      keyExtractor={(item) => item.id}
      numColumns={2}
      ListHeaderComponent={header}
      ListEmptyComponent={loaded && !problem ? <EmptyState title="No titles match" body="Try a shorter search or another section." /> : undefined}
      contentContainerStyle={styles.grid}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <Cell>
          <BookTile title={item} onOpen={onOpen} />
        </Cell>
      )}
    />
  );
}

function ShelfPane({
  reader,
  onOpen,
  shelfVersion,
}: {
  reader: ReaderProfile | null;
  onOpen: (id: string) => void;
  shelfVersion: number;
}) {
  const [titles, setTitles] = useState<TitleRecord[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!reader) return;
    let cancelled = false;
    getShelf()
      .then((rows) => {
        if (!cancelled) setTitles(rows);
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage(error instanceof Error ? error.message : "The shelf could not be opened.");
      });
    return () => {
      cancelled = true;
    };
  }, [reader, shelfVersion]);

  if (!reader) return <EmptyState title="Your shelf" body="Sign in on the Account tab to see your shelf." />;
  return (
    <FlatList
      data={titles}
      keyExtractor={(item) => item.id}
      numColumns={2}
      ListHeaderComponent={
        <View style={styles.paneHeader}>
          <Text style={styles.paneTitle}>My shelf</Text>
          {message ? <Text style={styles.banner}>{message}</Text> : null}
        </View>
      }
      ListEmptyComponent={<EmptyState title="Nothing here yet" body="Open a book and tap Save to shelf." />}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => (
        <Cell>
        <BookTile
          title={item}
          onOpen={onOpen}
          footer={
            <TextButton
              label="Remove"
              onPress={() => {
                void removeFromShelf(item.id).then(() => setTitles((current) => current.filter((row) => row.id !== item.id)));
              }}
            />
          }
        />
        </Cell>
      )}
    />
  );
}

function MarksPane({
  reader,
  onOpen,
  shelfVersion,
}: {
  reader: ReaderProfile | null;
  onOpen: (id: string) => void;
  shelfVersion: number;
}) {
  const [titles, setTitles] = useState<TitleRecord[]>([]);

  useEffect(() => {
    if (!reader) return;
    let cancelled = false;
    getBookmarks()
      .then((rows) => {
        if (!cancelled) setTitles(rows);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [reader, shelfVersion]);

  if (!reader) return <EmptyState title="Bookmarks" body="Sign in on the Account tab to see bookmarks." />;
  return (
    <FlatList
      data={titles}
      keyExtractor={(item) => item.id}
      numColumns={2}
      ListHeaderComponent={
        <View style={styles.paneHeader}>
          <Text style={styles.paneTitle}>Bookmarks</Text>
        </View>
      }
      ListEmptyComponent={<EmptyState title="No bookmarks yet" body="Open a book and tap Bookmark." />}
      contentContainerStyle={styles.grid}
      renderItem={({ item }) => (
        <Cell>
        <BookTile
          title={item}
          onOpen={onOpen}
          footer={
            <TextButton
              label="Remove"
              onPress={() => {
                void removeBookmark(item.id).then(() => setTitles((current) => current.filter((row) => row.id !== item.id)));
              }}
            />
          }
        />
        </Cell>
      )}
    />
  );
}

function AccountPane({
  reader,
  onReader,
}: {
  reader: ReaderProfile | null;
  onReader: (reader: ReaderProfile | null) => void;
}) {
  const [base, setBase] = useState(getBase());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [counts, setCounts] = useState("");
  const [work, setWork] = useState("");
  const [writer, setWriter] = useState("");
  const [category, setCategory] = useState("Essays");
  const [year, setYear] = useState("1900");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (reader?.role !== "desk") return;
    deskSummary()
      .then((summary) => setCounts(`${summary.books} books · ${summary.accounts} accounts · ${summary.downloads} downloads`))
      .catch(() => undefined);
  }, [reader]);

  return (
    <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
      {message ? <Text style={styles.banner}>{message}</Text> : null}
      {reader ? (
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{reader.name.trim().charAt(0).toUpperCase() || "?"}</Text>
            </View>
            <View style={styles.fill}>
              <Text style={styles.cardTitle}>{reader.name}</Text>
              <Text style={styles.meta}>{reader.email}</Text>
            </View>
            <Text style={styles.roleBadge}>{reader.role === "desk" ? "Desk" : "Reader"}</Text>
          </View>
          <SecondaryButton
            label="Log out"
            onPress={() => {
              void logout()
                .catch(() => undefined)
                .finally(() => {
                  void saveToken(null);
                  onReader(null);
                });
            }}
          />
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in or register</Text>
          <Text style={styles.meta}>Your shelf and bookmarks follow you between the website and the phone.</Text>
          <TextInput style={styles.input} placeholder="Name (for registering)" placeholderTextColor={colors.faint} value={name} onChangeText={setName} />
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor={colors.faint} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor={colors.faint} secureTextEntry value={password} onChangeText={setPassword} />
          <PrimaryButton
            label="Sign in"
            onPress={() => {
              void login(email, password)
                .then(async (result) => {
                  await saveToken(result.token);
                  onReader(result.reader);
                  setMessage("");
                })
                .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Sign-in failed."));
            }}
          />
          <SecondaryButton
            label="Register"
            onPress={() => {
              void register(name, email, password)
                .then(async (result) => {
                  await saveToken(result.token);
                  onReader(result.reader);
                })
                .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Registration failed."));
            }}
          />
        </View>
      )}
      {reader?.role === "desk" ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Desk</Text>
          {counts ? <Text style={styles.meta}>{counts}</Text> : null}
          <TextInput style={styles.input} placeholder="Title" placeholderTextColor={colors.faint} value={work} onChangeText={setWork} />
          <TextInput style={styles.input} placeholder="Author" placeholderTextColor={colors.faint} value={writer} onChangeText={setWriter} />
          <TextInput style={styles.input} placeholder="Category" placeholderTextColor={colors.faint} value={category} onChangeText={setCategory} />
          <TextInput style={styles.input} placeholder="Year" placeholderTextColor={colors.faint} value={year} onChangeText={setYear} />
          <TextInput style={styles.input} placeholder="Bibliographic note" placeholderTextColor={colors.faint} value={note} onChangeText={setNote} />
          <PrimaryButton
            label="Add title"
            onPress={() => {
              void createTitle({
                work: work.trim(),
                writer: writer.trim(),
                category: category.trim(),
                year: Number(year),
                note: note.trim(),
                gutenbergId: null,
              })
                .then(() => {
                  setWork("");
                  setWriter("");
                  setNote("");
                  setMessage("Title added.");
                  return me();
                })
                .then(() => deskSummary())
                .then((summary) => setCounts(`${summary.books} books · ${summary.accounts} accounts · ${summary.downloads} downloads`))
                .catch((error: unknown) => setMessage(error instanceof Error ? error.message : "The title was not added."));
            }}
          />
        </View>
      ) : null}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Server</Text>
        <Text style={styles.meta}>API address</Text>
        <TextInput style={styles.input} value={base} onChangeText={setBase} autoCapitalize="none" autoCorrect={false} />
        <SecondaryButton
          label="Save address"
          onPress={() => {
            void saveBase(base).then(() => setMessage(`Using ${getBase()}`));
          }}
        />
        <Text style={styles.meta}>The emulator default is {DEFAULT_BASE}.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  fill: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.paper,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  brandMarkText: { color: colors.onGreen, fontFamily: "serif", fontSize: 20 },
  brand: { fontFamily: "serif", fontSize: 19, color: colors.ink },
  kicker: { color: colors.soft, fontSize: 12 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.greenWash },
  pillPressed: { backgroundColor: "#cfe3d6" },
  pillText: { color: colors.greenDeep, fontWeight: "600" },
  body: { flex: 1 },
  tabs: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.card,
    paddingBottom: 6,
  },
  tab: { flex: 1, paddingTop: 0, paddingBottom: 6, alignItems: "center", gap: 1 },
  tabIndicator: { width: 28, height: 3, borderRadius: 2, marginBottom: 6, backgroundColor: "transparent" },
  tabIndicatorOn: { backgroundColor: colors.green },
  tabIcon: { fontSize: 18 },
  tabOn: { color: colors.green, fontWeight: "600" },
  tabOff: { color: colors.faint },
  filters: { gap: 8, paddingBottom: 6, paddingHorizontal: 6 },
  searchRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  searchInput: { flex: 1 },
  chips: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
  },
  chipOn: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { color: colors.ink },
  chipTextOn: { color: colors.onGreen, fontWeight: "600" },
  count: { color: colors.faint, fontSize: 13, marginTop: 2 },
  grid: { padding: 6, paddingTop: 10, flexGrow: 1 },
  cell: { width: "50%", padding: 6 },
  paneHeader: { gap: 8, paddingHorizontal: 6 },
  paneTitle: { fontFamily: "serif", fontSize: 24, color: colors.ink, marginBottom: 2 },
  list: { padding: 16, gap: 14 },
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
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.onGreen, fontSize: 20, fontWeight: "600" },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.greenWash,
    color: colors.greenDeep,
    fontWeight: "600",
    overflow: "hidden",
  },
  meta: { color: colors.soft },
  empty: { alignItems: "center", padding: 32, gap: 6 },
  emptyTitle: { fontFamily: "serif", fontSize: 20, color: colors.ink },
  banner: {
    backgroundColor: "#f6e7c8",
    borderColor: "#e4d0a4",
    borderWidth: 1,
    borderRadius: radius.card,
    padding: 12,
    color: colors.ink,
    overflow: "hidden",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: "#fff",
    borderRadius: radius.control,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.ink,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 4 },
});
