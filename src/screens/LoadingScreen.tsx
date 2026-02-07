import React, {useEffect} from 'react';
import {View, StyleSheet, ActivityIndicator, Text} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import database from '../database';

type LoadingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Loading'
>;

const LoadingScreen = () => {
  const navigation = useNavigation<LoadingScreenNavigationProp>();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await database.init();
        setTimeout(() => {
          navigation.replace('ProfileSelection');
        }, 2000);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    initializeApp();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Habit Tracker</Text>
      <ActivityIndicator size="large" color="#6200ee" style={styles.loader} />
      <Text style={styles.subtitle}>Loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#666666',
  },
});

export default LoadingScreen;
