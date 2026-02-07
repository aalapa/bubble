import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Alert} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/types';
import database from '../database';

type PinEntryNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'PinEntry'
>;
type PinEntryRouteProp = RouteProp<RootStackParamList, 'PinEntry'>;

const PinEntryScreen = () => {
  const navigation = useNavigation<PinEntryNavigationProp>();
  const route = useRoute<PinEntryRouteProp>();
  const {userId} = route.params;

  const [pin, setPin] = useState('');
  const [userName, setUserName] = useState('');

  React.useEffect(() => {
    const loadUser = async () => {
      const user = await database.getUserById(userId);
      if (user) {
        setUserName(user.name);
      }
    };
    loadUser();
  }, [userId]);

  const handleNumberPress = async (num: string) => {
    const newPin = pin + num;
    setPin(newPin);

    if (newPin.length === 4) {
      const isValid = await database.verifyPin(userId, newPin);
      if (isValid) {
        navigation.replace('Dashboard', {userId});
      } else {
        Alert.alert('Error', 'Incorrect PIN');
        setPin('');
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
  };

  const renderPinDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map(index => (
          <View
            key={index}
            style={[styles.dot, index < pin.length && styles.dotFilled]}
          />
        ))}
      </View>
    );
  };

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', '⌫'],
    ];

    return (
      <View style={styles.numberPad}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.numberRow}>
            {row.map((num, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[styles.numberButton, num === '' && styles.invisible]}
                onPress={() => {
                  if (num === '⌫') {
                    handleBackspace();
                  } else if (num !== '') {
                    handleNumberPress(num);
                  }
                }}
                disabled={num === ''}>
                <Text style={styles.numberText}>{num}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.greeting}>Welcome, {userName}!</Text>
        <Text style={styles.instruction}>Enter your PIN</Text>

        {renderPinDots()}
        {renderNumberPad()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    padding: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 18,
    color: '#6200ee',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 60,
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  instruction: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 60,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6200ee',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#6200ee',
  },
  numberPad: {
    gap: 16,
  },
  numberRow: {
    flexDirection: 'row',
    gap: 16,
  },
  numberButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  invisible: {
    opacity: 0,
  },
  numberText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
  },
});

export default PinEntryScreen;
