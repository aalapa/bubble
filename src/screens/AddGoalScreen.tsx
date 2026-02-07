import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/types';
import {GoalFrequency} from '../types';
import database from '../database';
import {generateColorForGoal} from '../utils/tileLayout';

type AddGoalNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'AddGoal'
>;
type AddGoalRouteProp = RouteProp<RootStackParamList, 'AddGoal'>;

const PRESET_COLORS = [
  '#6200ee',
  '#03dac6',
  '#ff6f00',
  '#c51162',
  '#00c853',
  '#2979ff',
  '#d50000',
  '#aa00ff',
  '#00bfa5',
  '#ff6d00',
];

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const AddGoalScreen = () => {
  const navigation = useNavigation<AddGoalNavigationProp>();
  const route = useRoute<AddGoalRouteProp>();
  const {userId} = route.params;

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'checkbox' | 'number'>('checkbox');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Frequency state
  const [frequencyType, setFrequencyType] = useState<
    'daily' | 'weekly' | 'monthly' | 'custom'
  >('daily');
  const [weeklyDays, setWeeklyDays] = useState<number[]>([]);
  const [monthlyDay, setMonthlyDay] = useState('1');
  const [customInterval, setCustomInterval] = useState('2');

  const toggleWeeklyDay = (day: number) => {
    setWeeklyDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const buildFrequency = (): GoalFrequency | null => {
    switch (frequencyType) {
      case 'daily':
        return {type: 'daily'};
      case 'weekly':
        if (weeklyDays.length === 0) {
          Alert.alert('Error', 'Please select at least one day of the week');
          return null;
        }
        return {type: 'weekly', days: weeklyDays.sort()};
      case 'monthly': {
        const day = parseInt(monthlyDay, 10);
        if (isNaN(day) || day < 1 || day > 31) {
          Alert.alert('Error', 'Please enter a valid day of month (1-31)');
          return null;
        }
        return {type: 'monthly', dayOfMonth: day};
      }
      case 'custom': {
        const interval = parseInt(customInterval, 10);
        if (isNaN(interval) || interval < 1) {
          Alert.alert('Error', 'Please enter a valid interval (at least 1)');
          return null;
        }
        return {type: 'custom', intervalDays: interval};
      }
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a goal title');
      return;
    }

    if (type === 'number') {
      const target = parseFloat(targetValue);
      if (!targetValue || isNaN(target) || target <= 0) {
        Alert.alert('Error', 'Please enter a valid target value');
        return;
      }
      if (!unit.trim()) {
        Alert.alert('Error', 'Please enter a unit (e.g., km, mins, reps)');
        return;
      }
    }

    const frequency = buildFrequency();
    if (!frequency) return;

    try {
      await database.createGoal(
        userId,
        title,
        selectedColor,
        type,
        type === 'number' ? parseFloat(targetValue) : undefined,
        type === 'number' ? unit : undefined,
        frequency,
      );

      navigation.goBack();
    } catch (error) {
      console.error('Failed to create goal:', error);
      Alert.alert('Error', 'Failed to create goal');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Goal</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.label}>Goal Title</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., Morning Exercise"
          value={title}
          onChangeText={setTitle}
          maxLength={50}
        />

        <Text style={styles.label}>Goal Type</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'checkbox' && styles.typeButtonActive,
            ]}
            onPress={() => setType('checkbox')}>
            <Text
              style={[
                styles.typeButtonText,
                type === 'checkbox' && styles.typeButtonTextActive,
              ]}>
              ✓ Simple
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              type === 'number' && styles.typeButtonActive,
            ]}
            onPress={() => setType('number')}>
            <Text
              style={[
                styles.typeButtonText,
                type === 'number' && styles.typeButtonTextActive,
              ]}>
              # Number
            </Text>
          </TouchableOpacity>
        </View>

        {type === 'number' && (
          <>
            <Text style={styles.label}>Target Value</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 10000"
              value={targetValue}
              onChangeText={setTargetValue}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Unit</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., steps, km, mins"
              value={unit}
              onChangeText={setUnit}
              maxLength={20}
            />
          </>
        )}

        <Text style={styles.label}>Frequency</Text>
        <View style={styles.frequencySelector}>
          {(['daily', 'weekly', 'monthly', 'custom'] as const).map(freq => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyButton,
                frequencyType === freq && styles.frequencyButtonActive,
              ]}
              onPress={() => setFrequencyType(freq)}>
              <Text
                style={[
                  styles.frequencyButtonText,
                  frequencyType === freq && styles.frequencyButtonTextActive,
                ]}>
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {frequencyType === 'weekly' && (
          <>
            <Text style={styles.sublabel}>Select days</Text>
            <View style={styles.daySelector}>
              {DAY_LABELS.map((label, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    weeklyDays.includes(index) && styles.dayButtonActive,
                  ]}
                  onPress={() => toggleWeeklyDay(index)}>
                  <Text
                    style={[
                      styles.dayButtonText,
                      weeklyDays.includes(index) && styles.dayButtonTextActive,
                    ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {frequencyType === 'monthly' && (
          <>
            <Text style={styles.sublabel}>Day of month</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 15"
              value={monthlyDay}
              onChangeText={setMonthlyDay}
              keyboardType="numeric"
              maxLength={2}
            />
          </>
        )}

        {frequencyType === 'custom' && (
          <>
            <Text style={styles.sublabel}>Repeat every X days</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 3"
              value={customInterval}
              onChangeText={setCustomInterval}
              keyboardType="numeric"
              maxLength={3}
            />
          </>
        )}

        <Text style={styles.label}>Color</Text>
        <View style={styles.colorPicker}>
          {PRESET_COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                {backgroundColor: color},
                selectedColor === color && styles.colorOptionSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Create Goal</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6200ee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 70,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  sublabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    marginTop: 8,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  typeButtonActive: {
    borderColor: '#6200ee',
    backgroundColor: '#f3e5f5',
  },
  typeButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#6200ee',
  },
  frequencySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  frequencyButtonActive: {
    borderColor: '#6200ee',
    backgroundColor: '#f3e5f5',
  },
  frequencyButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  frequencyButtonTextActive: {
    color: '#6200ee',
  },
  daySelector: {
    flexDirection: 'row',
    gap: 6,
  },
  dayButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
  },
  dayButtonActive: {
    borderColor: '#6200ee',
    backgroundColor: '#6200ee',
  },
  dayButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: 'white',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#333',
    borderWidth: 3,
  },
  submitButton: {
    backgroundColor: '#6200ee',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default AddGoalScreen;
