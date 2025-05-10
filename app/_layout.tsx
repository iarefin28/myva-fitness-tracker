import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, } from "expo-router";
import { useColorScheme } from "react-native";

export default function RootLayout() {
  const scheme = useColorScheme();
  const router = useRouter();

  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: '',
          }}
        />
        <Stack.Screen
          name="add-workout"
          options={{
            title: '',
          }}
        />
      </Stack>
    </ThemeProvider>
  );
}