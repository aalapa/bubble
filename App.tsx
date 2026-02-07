import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StatusBar} from 'react-native';
import {RootStackParamList} from './src/navigation/types';

import LoadingScreen from './src/screens/LoadingScreen';
import ProfileSelectionScreen from './src/screens/ProfileSelectionScreen';
import PinEntryScreen from './src/screens/PinEntryScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import AddGoalScreen from './src/screens/AddGoalScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Loading"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}>
          <Stack.Screen name="Loading" component={LoadingScreen} />
          <Stack.Screen
            name="ProfileSelection"
            component={ProfileSelectionScreen}
          />
          <Stack.Screen name="PinEntry" component={PinEntryScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="AddGoal" component={AddGoalScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default App;
