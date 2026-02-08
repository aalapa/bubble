import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

interface AddUserModalProps {
  visible: boolean;
  onClose: () => void;
  onAddUser: (name: string, pin: string) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  visible,
  onClose,
  onAddUser,
}) => {
  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const handleClose = () => {
    setName('');
    setPin('');
    setConfirmPin('');
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name');
      return;
    }

    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      Alert.alert('Error', 'PIN must be exactly 4 digits');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }

    onAddUser(name, pin);
    setName('');
    setPin('');
    setConfirmPin('');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Add New User</Text>

          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
            maxLength={20}
          />

          <TextInput
            style={styles.input}
            placeholder="4-Digit PIN"
            placeholderTextColor="#999"
            value={pin}
            onChangeText={setPin}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirm PIN"
            placeholderTextColor="#999"
            value={confirmPin}
            onChangeText={setConfirmPin}
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>Add User</Text>
            </TouchableOpacity>
          </View>
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
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  submitButton: {
    backgroundColor: '#6200ee',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default AddUserModal;
