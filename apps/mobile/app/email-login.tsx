import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { api, saveTokens } from "../src/api/client";
import { Screen } from "../src/components/Screen";

export default function EmailLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function login() {
    const result = await api<{ data: { accessToken: string; refreshToken: string } }>("/auth/email/login", { method: "POST", body: JSON.stringify({ email, password }) });
    await saveTokens(result.data.accessToken, result.data.refreshToken);
    router.replace("/dashboard");
  }

  return (
    <Screen>
      <Text style={styles.title}>Email sign in</Text>
      <TextInput accessibilityLabel="Email" style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TextInput accessibilityLabel="Password" style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      <Pressable style={styles.button} onPress={() => login().catch((e) => Alert.alert("Sign in failed", e.message))}><Text style={styles.buttonText}>Sign in</Text></Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800" },
  input: { minHeight: 52, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, padding: 14, backgroundColor: "white" },
  button: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#0F766E" },
  buttonText: { color: "white", fontWeight: "700" }
});
