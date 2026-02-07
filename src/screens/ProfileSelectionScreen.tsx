import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {User} from '../types';
import database from '../database';
import AddUserModal from '../components/AddUserModal';

type ProfileSelectionNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ProfileSelection'
>;

const ProfileSelectionScreen = () => {
  const navigation = useNavigation<ProfileSelectionNavigationProp>();
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUserModal, setShowAddUserModal] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const allUsers = await database.getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      Alert.alert('Error', 'Failed to load users');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers]),
  );

  const handleUserSelect = (user: User) => {
    navigation.navigate('PinEntry', {userId: user.id});
  };

  const handleAddUser = async (name: string, pin: string) => {
    try {
      await database.createUser(name, pin);
      setShowAddUserModal(false);
      loadUsers();
    } catch (error) {
      console.error('Failed to create user:', error);
      Alert.alert('Error', 'Failed to create user');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderUserCard = ({item}: {item: User}) => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => handleUserSelect(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{getInitials(item.name)}</Text>
      </View>
      <Text style={styles.userName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderAddUserCard = () => (
    <TouchableOpacity
      style={styles.userCard}
      onPress={() => setShowAddUserModal(true)}>
      <View style={[styles.avatar, styles.addAvatar]}>
        <Text style={styles.addIcon}>+</Text>
      </View>
      <Text style={styles.userName}>Add User</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Who's tracking habits today?</Text>

      <FlatList
        data={users}
        renderItem={renderUserCard}
        keyExtractor={item => item.id.toString()}
        numColumns={3}
        contentContainerStyle={styles.userList}
        ListFooterComponent={renderAddUserCard}
      />

      <AddUserModal
        visible={showAddUserModal}
        onClose={() => setShowAddUserModal(false)}
        onAddUser={handleAddUser}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 32,
    textAlign: 'center',
  },
  userList: {
    alignItems: 'center',
  },
  userCard: {
    alignItems: 'center',
    margin: 16,
    width: 140,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: 'white',
  },
  addAvatar: {
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#6200ee',
    borderStyle: 'dashed',
  },
  addIcon: {
    fontSize: 48,
    color: '#6200ee',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

export default ProfileSelectionScreen;
