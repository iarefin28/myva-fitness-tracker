import { Image, StyleSheet, useColorScheme, View } from "react-native";

export default function HeaderLogo() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  return (
    <View style={styles.wrap}>
      <Image
        source={
          isDark
            ? require("../assets/HomescreenLogoMYVAWhite.png")
            : require("../assets/HomescreenLogoMYVABlack.png")
        }
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="MYVA Fitness"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", transform: [{ translateY: 6 }] },
  logo: { width: 760, height: 130 },
});
