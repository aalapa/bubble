import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';

export type RootStackParamList = {
  Loading: undefined;
  ProfileSelection: undefined;
  PinEntry: {userId: number};
  Dashboard: {userId: number};
  AddGoal: {userId: number};
  PersonalAnalytics: {userId: number};
  Leaderboard: undefined;
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
