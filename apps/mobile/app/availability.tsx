import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { api } from "../src/api/client";
import { Screen } from "../src/components/Screen";

export default function AvailabilityScreen() {
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");

  async function save() {
    await api("/availability", { method: "POST", body: JSON.stringify({ startsAt, endsAt, type: "AVAILABLE" }) });
    Alert.alert("Saved", "Your availability was sent.");
  }

  return (
    <Screen>
      <Text style={styles.title}>Add availability</Text>
      <TextInput style={styles.input} placeholder="Start ISO time" value={startsAt} onChangeText={setStartsAt} />
      <TextInput style={styles.input} placeholder="End ISO time" value={endsAt} onChangeText={setEndsAt} />
      <Pressable style={styles.button} onPress={() => save().catch((e) => Alert.alert("Could not save", e.message))}><Text style={styles.buttonText}>Save availability</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800" },
  input: { minHeight: 52, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, padding: 14, backgroundColor: "white" },
  button: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#0F766E" },
  buttonText: { color: "white", fontWeight: "700" }
});
