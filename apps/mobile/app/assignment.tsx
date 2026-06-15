import { useLocalSearchParams, router } from "expo-router";
import { Alert, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { useState } from "react";
import { api } from "../src/api/client";
import { Screen } from "../src/components/Screen";

export default function AssignmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [declineReason, setDeclineReason] = useState("");

  async function respond(status: "ACCEPTED" | "DECLINED") {
    await api(`/assignments/${id}/respond`, {
      method: "POST",
      body: JSON.stringify({ status, declineReason: status === "DECLINED" ? declineReason : undefined })
    });
    router.replace("/dashboard");
  }

  return (
    <Screen>
      <Text style={styles.title}>Assignment response</Text>
      <Text>Confirm whether you can teach this course. Server confirmation is required before the response is final.</Text>
      <TextInput style={styles.input} placeholder="Decline reason, if needed" value={declineReason} onChangeText={setDeclineReason} multiline />
      <Pressable style={styles.accept} onPress={() => respond("ACCEPTED").catch((e) => Alert.alert("Could not accept", e.message))}><Text style={styles.buttonText}>Accept</Text></Pressable>
      <Pressable style={styles.decline} onPress={() => respond("DECLINED").catch((e) => Alert.alert("Could not decline", e.message))}><Text style={styles.buttonText}>Decline</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800" },
  input: { minHeight: 88, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, padding: 14, backgroundColor: "white" },
  accept: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#0F766E" },
  decline: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#B91C1C" },
  buttonText: { color: "white", fontWeight: "700" }
});
