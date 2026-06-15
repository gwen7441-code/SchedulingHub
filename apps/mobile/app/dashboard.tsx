import { useQuery } from "@tanstack/react-query";
import { Link } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { api } from "../src/api/client";
import { registerDeviceForPush } from "../src/api/push";
import { Screen } from "../src/components/Screen";

export default function Dashboard() {
  const assignments = useQuery({ queryKey: ["assignments"], queryFn: () => api<{ data: Array<{ id: string; status: string; course: { title: string; startsAt: string } }> }>("/assignments") });

  useEffect(() => {
    registerDeviceForPush().catch(() => undefined);
  }, []);

  return (
    <Screen>
      <Text style={styles.title}>Dashboard</Text>
      <View style={styles.actions}>
        <Link href="/calendar" asChild><Pressable style={styles.tile}><Text style={styles.tileText}>Calendar</Text></Pressable></Link>
        <Link href="/availability" asChild><Pressable style={styles.tile}><Text style={styles.tileText}>Availability</Text></Pressable></Link>
        <Link href="/admin" asChild><Pressable style={styles.tile}><Text style={styles.tileText}>Admin</Text></Pressable></Link>
      </View>
      <Text style={styles.section}>Pending assignments</Text>
      {assignments.data?.data.filter((item) => item.status === "PENDING").map((item) => (
        <Link key={item.id} href={`/assignment?id=${item.id}`} asChild>
          <Pressable style={styles.card}><Text style={styles.cardTitle}>{item.course.title}</Text><Text>{new Date(item.course.startsAt).toLocaleString("en-CA")}</Text></Pressable>
        </Link>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 30, fontWeight: "800" },
  actions: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  tile: { padding: 16, backgroundColor: "#0F766E", borderRadius: 8 },
  tileText: { color: "white", fontWeight: "700" },
  section: { fontSize: 20, fontWeight: "700" },
  card: { padding: 16, backgroundColor: "white", borderRadius: 8, borderWidth: 1, borderColor: "#E2E8F0" },
  cardTitle: { fontWeight: "700", fontSize: 16 }
});
