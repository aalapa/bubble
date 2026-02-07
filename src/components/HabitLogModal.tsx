import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import {Goal, HabitStatus} from '../types';

interface HabitLogModalProps {
  visible: boolean;
  goal: Goal | null;
  onClose: () => void;
  onLog: (status: HabitStatus, value?: number) => void;
}

const HabitLogModal: React.FC<HabitLogModalProps> = ({
  visible,
  goal,
  onClose,
  onLog,
}) => {
  const [value, setValue] = useState('');

  const handleLog = (status: HabitStatus) => {
    if (goal?.type === 'number' && status === HabitStatus.COMPLETED) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0 || value.trim() === '') {
        Alert.alert('Invalid Value', 'Please enter a valid number greater than 0');
        return;
      }
      onLog(status, numValue);
      setValue('');
    } else {
      onLog(status);
    }
  };

  if (!goal) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>{goal.title}</Text>

          {goal.type === 'number' ? (
            <View style={styles.numberInput}>
              <TextInput
                style={styles.input}
                placeholder={`Enter ${goal.unit || 'value'}`}
                value={value}
                onChangeText={setValue}
                keyboardType="numeric"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={() => handleLog(HabitStatus.COMPLETED)}>
                <Text style={styles.buttonText}>✓ Submit</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.completedButton]}
                onPress={() => handleLog(HabitStatus.COMPLETED)}>
                <Text style={styles.buttonIcon}>✓</Text>
                <Text style={styles.buttonLabel}>Done</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.skippedButton]}
                onPress={() => handleLog(HabitStatus.SKIPPED)}>
                <Text style={styles.buttonIcon}>😐</Text>
                <Text style={styles.buttonLabel}>Skipped</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.failedButton]}
                onPress={() => handleLog(HabitStatus.FAILED)}>
                <Text style={styles.buttonIcon}>✗</Text>
                <Text style={styles.buttonLabel}>Not Done</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  numberInput: {
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 18,
    marginBottom: 16,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  completedButton: {
    backgroundColor: '#4caf50',
  },
  skippedButton: {
    backgroundColor: '#ff9800',
  },
  failedButton: {
    backgroundColor: '#f44336',
  },
  submitButton: {
    backgroundColor: '#6200ee',
  },
  buttonIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  closeButton: {
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
  },
});

export default HabitLogModal;
