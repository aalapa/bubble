import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';

export type RootStackParamList = {
  Loading: undefined;
  ProfileSelection: undefined;
  PinEntry: {userId: string};
  Dashboard: {userId: string};
  AddGoal: {userId: string};
  PersonalAnalytics: {userId: string};
  Leaderboard: undefined;
  Settings: undefined;
};

export type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
export type LoadingScreenRouteProp = RouteProp<RootStackParamList, 'Loading'>;
export type ProfileSelectionScreenRouteProp = RouteProp<
  RootStackParamList,
  'ProfileSelection'
>;
export type PinEntryScreenRouteProp = RouteProp<RootStackParamList, 'PinEntry'>;
export type DashboardScreenRouteProp = RouteProp<
  RootStackParamList,
  'Dashboard'
>;
export type AddGoalScreenRouteProp = RouteProp<RootStackParamList, 'AddGoal'>;
