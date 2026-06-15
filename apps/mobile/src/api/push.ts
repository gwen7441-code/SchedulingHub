import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./client";

export async function registerDeviceForPush() {
  const permission = await Notifications.getPermissionsAsync();
  const finalPermission = permission.granted ? permission : await Notifications.requestPermissionsAsync();
  if (!finalPermission.granted) return null;

  const token = await Notifications.getExpoPushTokenAsync();
  const result = await api<{ data: { id: string } }>("/devices", {
    method: "POST",
    body: JSON.stringify({
      platform: Platform.OS,
      label: `${Platform.OS} device`,
      expoPushToken: token.data
    })
  });
  return result.data;
}
