import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  useWindowDimensions,
} from 'react-native';
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

  const {width: screenWidth, height: screenHeight} = useWindowDimensions();
  const isLandscape = screenWidth > screenHeight;

  const [pin, setPin] = useState('');
  const [userName, setUserName] = useState('');

  // Responsive button sizing based on available space
  const padHeight = isLandscape ? screenHeight - 40 : screenHeight * 0.55;
  const btnSize = Math.min(80, Math.floor((padHeight - 48) / 4.8));
  const btnGap = Math.max(8, Math.floor(btnSize * 0.18));

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

  const renderPinDots = () => (
    <View style={styles.dotsContainer}>
      {[0, 1, 2, 3].map(index => (
        <View
          key={index}
          style={[styles.dot, index < pin.length && styles.dotFilled]}
        />
      ))}
    </View>
  );

  const renderNumberPad = () => {
    const numbers = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      ['', '0', '⌫'],
    ];

    return (
      <View style={{gap: btnGap}}>
        {numbers.map((row, rowIndex) => (
          <View key={rowIndex} style={{flexDirection: 'row', gap: btnGap}}>
            {row.map((num, colIndex) => (
              <TouchableOpacity
                key={colIndex}
                style={[
                  styles.numberButton,
                  {width: btnSize, height: btnSize, borderRadius: btnSize / 2},
                  num === '' && styles.invisible,
                ]}
                onPress={() => {
                  if (num === '⌫') {
                    handleBackspace();
                  } else if (num !== '') {
                    handleNumberPress(num);
                  }
                }}
                disabled={num === ''}>
                <Text
                  style={[
                    styles.numberText,
                    {fontSize: Math.floor(btnSize * 0.35)},
                  ]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderGreeting = () => (
    <View style={isLandscape ? styles.greetingLandscape : styles.greetingPortrait}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={styles.greeting}>Welcome,</Text>
        <Text style={styles.greetingName}>{userName}!</Text>
        <Text style={styles.instruction}>Enter your PIN</Text>
        {isLandscape && renderPinDots()}
      </View>
    </View>
  );

  if (isLandscape) {
    // Landscape: greeting left, keypad right
    return (
      <View style={styles.landscapeContainer}>
        {renderGreeting()}
        <View style={styles.padLandscape}>{renderNumberPad()}</View>
      </View>
    );
  }

  // Portrait: stacked vertically
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.greeting}>Welcome,</Text>
        <Text style={styles.greetingName}>{userName}!</Text>
        <Text style={styles.instruction}>Enter your PIN</Text>

        {renderPinDots()}
        {renderNumberPad()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // ── Portrait ──
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },

  // ── Landscape ──
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
  },
  greetingLandscape: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  greetingPortrait: {},
  padLandscape: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  // ── Shared ──
  backButton: {
    padding: 16,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '600',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  greetingName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 6,
  },
  instruction: {
    fontSize: 16,
    color: '#666',
    marginBottom: 28,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 18,
    marginBottom: 32,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#6200ee',
    backgroundColor: 'transparent',
  },
  dotFilled: {
    backgroundColor: '#6200ee',
  },
  numberButton: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  invisible: {
    opacity: 0,
  },
  numberText: {
    fontWeight: '600',
    color: '#333',
  },
});

export default PinEntryScreen;
