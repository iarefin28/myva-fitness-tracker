import { AntDesign } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, } from "expo-router";
import { TouchableOpacity, useColorScheme } from "react-native";

export default function RootLayout() {
  const scheme = useColorScheme();
  const router = useRouter();

  return (
    <ThemeProvider value={scheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Workout Log',
            headerRight: () => (
              <TouchableOpacity onPress={() => router.push("/add-workout")} style={{ marginRight: 4 }}>
                <AntDesign name="plus" size={24} color={scheme === "dark" ? "white" : "black"} />
              </TouchableOpacity>
            ),
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