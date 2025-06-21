import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import CustomAddButton from '@/components/CustomAddButton';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AddWorkoutScreen from './add-workout';
import CalendarScreen from './calendar';
import ChartsScreen from './charts';
import IndexScreen from './index';
import MyvaInsightsScreen from './myva-insights';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabLayout() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';
  const headerBg = isDarkMode ? 'black' : '#fff';
  const tabBarBg = isDarkMode ? '#111' : '#f2f2f2';
  const iconColor = isDarkMode ? '#fff' : '#000';

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: headerBg,
        },
        headerTitleStyle: {
          color: iconColor,
        },
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60 + insets.bottom,
          backgroundColor: tabBarBg,
          borderTopColor: isDarkMode ? '#222' : '#ddd',
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: isDarkMode ? '#fff' : '#000',
        tabBarInactiveTintColor: isDarkMode ? '#888' : '#888',
        tabBarIconStyle: {
          marginTop: 10,
        },
      }}
    >
      <Tab.Screen
        name="MYVA Fitness"
        component={IndexScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Charts"
        component={ChartsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="AddWorkoutButton"
        component={View} // Dummy component
        options={{
          tabBarIcon: () => <CustomAddButton />,
          tabBarButton: (props) => <CustomAddButton {...props} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // Prevent default navigation
          },
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MYVA Insights"
        component={MyvaInsightsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';
  const iconColor = isDarkMode ? '#fff' : '#000';

  return (
    <GestureHandlerRootView>
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack.Navigator>
          <Stack.Screen
            name="Root"
            component={TabLayout}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="add-workout"
            component={AddWorkoutScreen}
            options={{ title: "Add Workout" }}
          />
          <Stack.Screen
            name="exercise-log"
            getComponent={() => require('./exercise-log').default}
            options={{ title: "Workout",  headerBackTitle: 'Back', headerTintColor: iconColor }}
          />
          <Stack.Screen
            name="completed-workouts"
            getComponent={() => require('./completed-workouts').default}
            options={{ title: "Completed Workouts",  headerBackTitle: 'Back', headerTintColor: iconColor }}
          />
        </Stack.Navigator>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}