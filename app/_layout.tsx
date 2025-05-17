import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { TouchableOpacity, useColorScheme, View } from 'react-native';

import AddWorkoutScreen from './add-workout';
import CalendarScreen from './calendar';
import ChartsScreen from './charts';
import IndexScreen from './index';
import MyvaInsightsScreen from './myva-insights';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function CustomAddButton() {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('add-workout')}
      style={{
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#1e1e1e',
        width: 60,
        height: 60,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 4,
      }}
    >
      <Ionicons name="add" size={32} color="#fff" />
    </TouchableOpacity>
  );
}

function TabLayout() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 60,
          backgroundColor: '#111',
        },
      }}
    >
      <Tab.Screen
        name="Home"
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
        name="MYVA"
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
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Root" component={TabLayout} options={{ headerShown: false }} />
        <Stack.Screen name="add-workout" component={AddWorkoutScreen} options={{ title: "Add Workout" }} />
      </Stack.Navigator>
    </ThemeProvider>
  );
}