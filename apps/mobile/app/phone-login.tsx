import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput } from "react-native";
import { router } from "expo-router";
import { api, saveTokens } from "../src/api/client";
import { Screen } from "../src/components/Screen";

export default function PhoneLogin() {
  const [phoneE164, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [requested, setRequested] = useState(false);

  async function requestCode() {
    await api("/auth/otp/request", { method: "POST", body: JSON.stringify({ phoneE164 }) });
    setRequested(true);
  }

  async function verify() {
    const result = await api<{ data: { accessToken: string; refreshToken: string } }>("/auth/otp/verify", { method: "POST", body: JSON.stringify({ phoneE164, code }) });
    await saveTokens(result.data.accessToken, result.data.refreshToken);
    router.replace("/dashboard");
  }

  return (
    <Screen>
      <Text style={styles.title}>Phone sign in</Text>
      <TextInput accessibilityLabel="Phone number" style={styles.input} placeholder="+14165551212" value={phoneE164} onChangeText={setPhone} keyboardType="phone-pad" />
      {requested && <TextInput accessibilityLabel="Verification code" style={styles.input} placeholder="123456" value={code} onChangeText={setCode} keyboardType="number-pad" />}
      <Pressable style={styles.button} onPress={() => (requested ? verify().catch((e) => Alert.alert("Sign in failed", e.message)) : requestCode().catch((e) => Alert.alert("Code request failed", e.message)))}>
        <Text style={styles.buttonText}>{requested ? "Verify code" : "Send code"}</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 28, fontWeight: "800" },
  input: { minHeight: 52, borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 8, padding: 14, backgroundColor: "white" },
  button: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 8, backgroundColor: "#0F766E" },
  buttonText: { color: "white", fontWeight: "700" }
});
