import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { TouchableOpacity, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AddWorkoutScreen from './add-workout';
import CalendarScreen from './calendar';
import ChartsScreen from './charts';
import IndexScreen from './index';
import MyvaInsightsScreen from './myva-insights';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomAddButton() {
  const navigation = useNavigation();
  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const buttonBg = isDark ? "#1A1A1A" : "#e0e0e0";
  const iconColor = isDark ? "#fff" : "#000";
  const shadowColor = isDark ? "#000" : "#aaa";

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('add-workout')}
      style={{
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: buttonBg,
        width: 60,
        height: 60,
        borderRadius: 30,
        shadowColor: shadowColor,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
        elevation: 5,
      }}
    >
      <Ionicons name="add" size={32} color={iconColor} />
    </TouchableOpacity>
  );
}

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
            options={{ title: "" }}
          />
          <Stack.Screen
            name="completed-workouts"
            getComponent={() => require('./completed-workouts').default}
            options={{ title: "Completed Workouts" }}
          />
        </Stack.Navigator>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}