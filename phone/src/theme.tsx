import { Pressable, StyleSheet, Text, type PressableProps } from "react-native";

export const colors = {
  paper: "#f4efe4",
  paperDeep: "#ebe3d3",
  card: "#fffaf3",
  ink: "#1e1914",
  soft: "#5c5348",
  faint: "#8a7f70",
  line: "#ddd2c0",
  green: "#1b6b43",
  greenDeep: "#145436",
  greenWash: "#e3efe7",
  onGreen: "#f7fbf8",
  gold: "#c99a3e",
};

export const radius = { control: 10, card: 14, pill: 999 };

export const shadow = {
  shadowColor: "#1e1914",
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
};

export function PrimaryButton({ label, ...props }: PressableProps & { label: string }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.base, styles.primary, pressed ? styles.primaryPressed : null, props.disabled ? styles.disabled : null]}
    >
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label, ...props }: PressableProps & { label: string }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.base, styles.secondary, pressed ? styles.pressed : null, props.disabled ? styles.disabled : null]}
    >
      <Text style={styles.secondaryText}>{label}</Text>
    </Pressable>
  );
}

export function TextButton({ label, ...props }: PressableProps & { label: string }) {
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [styles.base, styles.text, pressed ? styles.textPressed : null, props.disabled ? styles.disabled : null]}
    >
      <Text style={styles.textLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.control,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  primary: { backgroundColor: colors.green },
  primaryPressed: { backgroundColor: colors.greenDeep },
  primaryText: { color: colors.onGreen, fontWeight: "600", fontSize: 15 },
  secondary: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
  secondaryText: { color: colors.ink, fontWeight: "600", fontSize: 15 },
  text: { backgroundColor: "transparent", paddingHorizontal: 10 },
  textPressed: { backgroundColor: colors.greenWash },
  textLabel: { color: colors.green, fontWeight: "600", fontSize: 15 },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
});
