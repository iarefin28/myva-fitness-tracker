import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { default as React, useEffect, useRef, useState } from 'react';
import { Animated, Text, TextInput, useColorScheme, View } from 'react-native';
import { Host } from 'react-native-portalize';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// import CustomAddButton from '@/components/CustomAddButton';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider, useAuth } from '../auth/AuthProvider';
import SignInScreen from '../auth/SignInScreen';
import SignUpScreen from '../auth/SignUpScreen';
import AddWorkoutScreen from './add-workout';
// import CalendarScreen from './calendar';
// import ChartsScreen from './charts';
import IndexScreen from './index';
import UserScreen from './UserScreen';
import HeaderLogo from '@/components/HeaderLogo';

import { useWorkoutStore } from '../store/workoutStore';
import { fontFamilies } from '@/theme/typography';

const baseTextStyle = { fontFamily: fontFamilies.base };
const appendBaseText = (style: any) => (style ? [style, baseTextStyle] : baseTextStyle);

Text.defaultProps = Text.defaultProps ?? {};
Text.defaultProps.style = appendBaseText(Text.defaultProps.style);
TextInput.defaultProps = TextInput.defaultProps ?? {};
TextInput.defaultProps.style = appendBaseText(TextInput.defaultProps.style);


const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabLayout() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';
  const headerBg = isDarkMode ? 'black' : '#fff';
  const tabBarBg = isDarkMode ? '#111' : '#f2f2f2';
  const iconColor = isDarkMode ? '#fff' : '#000';

  const [expanded, setExpanded] = useState(false);
  const dimOpacity = useRef(new Animated.Value(0)).current;

  // Animate dim overlay visibility
  React.useEffect(() => {
    Animated.timing(dimOpacity, {
      toValue: expanded ? 0.9 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [expanded]);

  return (
    <Host>
      <View style={{ flex: 1 }}>
        {/* Dim background when expanded */}
        <Animated.View
          pointerEvents={expanded ? 'auto' : 'none'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0, // ← leave tab bar untouched
            backgroundColor: 'black',
            opacity: dimOpacity,
            zIndex: 99,
          }}
        />
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
              headerTitle: () => <HeaderLogo />,
              tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
            }}
          />
          {/*
          <Tab.Screen
            name="Charts"
            component={ChartsScreen}
            options={{
              tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
            }}
          />
          <Tab.Screen
            name="AddWorkoutButton"
            component={IndexScreen} // Just to satisfy requirement
            options={{
              tabBarIcon: () => null,
              tabBarButton: (props) => (
                <CustomAddButton {...props} expanded={expanded} setExpanded={setExpanded} />
              ),
            }}
            listeners={{
              tabPress: (e) => e.preventDefault(),
            }}
          />
          <Tab.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{
              tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} />,
            }}
          />
          */}
          {/* <Tab.Screen
            name="MYVA Insights"
            component={MyvaInsightsScreen}
            options={{
              tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
            }}
          /> */}
          <Tab.Screen
            name="Your Profile"
            component={UserScreen}
            options={{
              headerTitle: () => <HeaderLogo />,
              tabBarIcon: ({ color, size }) => <Ionicons name="sparkles" size={size} color={color} />,
            }}
          />
        </Tab.Navigator>
      </View>
    </Host>
  );
}

function AppStack() {
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';
  const iconColor = isDarkMode ? '#fff' : '#000';

  return (
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
      {/* <Stack.Screen
        name="exercise-log"
        getComponent={() => require('./exercise-log').default}
        options={{ title: "Workout", headerBackTitle: 'Back', headerTintColor: iconColor }}
      /> */}
      <Stack.Screen
        name="completed-workouts"
        getComponent={() => require('./completed-workouts').default}
        options={{ title: "Completed Workouts", headerBackTitle: 'Back', headerTintColor: iconColor }}
      />
      <Stack.Screen
        name="completed-workout-detail"
        getComponent={() => require('./completed-workout-detail').default}
        options={{ title: "Workout JSON", headerBackTitle: 'Back', headerTintColor: iconColor }}
      />
      {/* <Stack.Screen
        name="workout-templates"
        getComponent={() => require('./workout-templates').default}
        options={{ title: "Workout Templates", headerBackTitle: 'Back', headerTintColor: iconColor }}
      />
      <Stack.Screen
        name="template-detail"
        getComponent={() => require('./template-detail').default}
        options={{ title: "Template Details", headerBackTitle: 'Back', headerTintColor: iconColor }}
      />
      <Stack.Screen
        name="upcomingworkouts"
        getComponent={() => require('./upcomingworkouts').default}
        options={{ title: "Upcoming Workouts", headerBackTitle: 'Back', headerTintColor: iconColor }}
      /> */}
      <Stack.Screen
        name="addNewExercise"
        getComponent={() => require('./addNewExercise').default}
        options={{ title: "Add New Exercise", headerBackTitle: 'Back', headerTintColor: iconColor }}
      />
      <Stack.Screen
        name="exercise-detail"
        getComponent={() => require('./exercise-detail').default}
        options={{ title: "Exercise Details", headerBackTitle: 'Back', headerTintColor: iconColor }}
      />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign In' }} />
      <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Create Account' }} />
    </Stack.Navigator>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  if (loading) return null; // splash/loader if you want
  return user ? <AppStack /> : <AuthStack />;
}

export default function RootLayout() {
  const scheme = useColorScheme();
  const isDarkMode = scheme === 'dark';
  const iconColor = isDarkMode ? '#fff' : '#000';
  const isActive = useWorkoutStore((s) => s.isActive);
  const tick = useWorkoutStore((s) => s.tick);

  useEffect(() => {
    const id = setInterval(() => {
      if (isActive) tick();
    }, 1000);
    return () => clearInterval(id);
  }, [isActive, tick]);

  return (
    <GestureHandlerRootView>
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
