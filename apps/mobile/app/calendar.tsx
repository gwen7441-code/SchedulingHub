import { useQuery } from "@tanstack/react-query";
import { CalendarList } from "react-native-calendars";
import { Text } from "react-native";
import { api } from "../src/api/client";
import { Screen } from "../src/components/Screen";

export default function CalendarScreen() {
  const courses = useQuery({ queryKey: ["courses"], queryFn: () => api<{ data: Array<{ startsAt: string }> }>("/courses") });
  const marked = Object.fromEntries((courses.data?.data ?? []).map((course) => [course.startsAt.slice(0, 10), { marked: true, dotColor: "#0F766E" }]));
  return (
    <Screen>
      <Text style={{ fontSize: 28, fontWeight: "800" }}>Calendar</Text>
      <CalendarList markedDates={marked} pastScrollRange={3} futureScrollRange={12} />
    </Screen>
  );
}
