import { StyleSheet, View } from "react-native";
import { colors } from "@/theme";

export function Divider() {
  return <View style={styles.line} accessible={false} />;
}

const styles = StyleSheet.create({
  line: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, alignSelf: "stretch" },
});
