import { useQuery } from "@tanstack/react-query";
import { Text, View } from "react-native";
import { api } from "../src/api/client";
import { Screen } from "../src/components/Screen";

export default function AdminScreen() {
  const status = useQuery({
    queryKey: ["integration-setup-status"],
    queryFn: () =>
      api<{
        data: {
          services: Record<string, string>;
          mappingStatus: string;
          webhookStatus: string | { status: string; receivedAt: string };
        };
      }>("/integrations/setup/status")
  });
  const services = status.data?.data.services ?? {};
  return (
    <Screen>
      <Text style={{ fontSize: 28, fontWeight: "800" }}>Admin</Text>
      <View style={{ padding: 16, backgroundColor: "white", borderRadius: 8 }}>
        {Object.entries(services).map(([name, value]) => (
          <Text key={name}>{name}: {value}</Text>
        ))}
        <Text>Mapping: {status.data?.data.mappingStatus ?? "Loading"}</Text>
        <Text>Webhook: {typeof status.data?.data.webhookStatus === "string" ? status.data?.data.webhookStatus : status.data?.data.webhookStatus.status}</Text>
      </View>
    </Screen>
  );
}
