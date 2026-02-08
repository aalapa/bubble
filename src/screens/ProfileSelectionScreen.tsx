import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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

  // All cards: existing users + "Add User"
  const allCards = [
    ...users.map(u => ({type: 'user' as const, user: u})),
    {type: 'add' as const, user: null as unknown as User},
  ];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Who's tracking habits today?</Text>

        <View style={styles.grid}>
          {allCards.map((card, index) =>
            card.type === 'user' ? (
              <TouchableOpacity
                key={card.user.id}
                style={styles.userCard}
                onPress={() => handleUserSelect(card.user)}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {getInitials(card.user.name)}
                  </Text>
                </View>
                <Text style={styles.userName}>{card.user.name}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                key="add"
                style={styles.userCard}
                onPress={() => setShowAddUserModal(true)}>
                <View style={[styles.avatar, styles.addAvatar]}>
                  <Text style={styles.addIcon}>+</Text>
                </View>
                <Text style={styles.userName}>Add User</Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      </View>

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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 40,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  userCard: {
    alignItems: 'center',
    margin: 12,
    width: 100,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    fontSize: 28,
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
    fontSize: 36,
    color: '#6200ee',
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
});

export default ProfileSelectionScreen;
