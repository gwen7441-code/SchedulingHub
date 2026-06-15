import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Screen } from "../src/components/Screen";

export default function Welcome() {
  return (
    <Screen>
      <View style={styles.hero}>
        <Text style={styles.title}>First Aid Instructor Scheduler</Text>
        <Text style={styles.copy}>Manage assignments, availability, notifications, and course details from the field.</Text>
      </View>
      <Link href="/phone-login" asChild>
        <Pressable style={styles.primary}><Text style={styles.primaryText}>Sign in with phone</Text></Pressable>
      </Link>
      <Link href="/email-login" asChild>
        <Pressable style={styles.secondary}><Text style={styles.secondaryText}>Use email instead</Text></Pressable>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 12, paddingTop: 60 },
  title: { fontSize: 34, fontWeight: "800", color: "#0F172A" },
  copy: { fontSize: 17, lineHeight: 24, color: "#475569" },
  primary: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#0F766E" },
  primaryText: { color: "white", fontSize: 16, fontWeight: "700" },
  secondary: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 8, borderWidth: 1, borderColor: "#CBD5E1" },
  secondaryText: { color: "#0F172A", fontSize: 16, fontWeight: "700" }
});
