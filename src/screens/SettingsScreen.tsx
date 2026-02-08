import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  getSupabase,
} from '../services/supabase';
import {useSyncContext} from '../services/SyncProvider';
import database from '../database';

type SettingsNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsNavProp>();
  const {syncStatus, syncNow} = useSyncContext();

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);
  const [testing, setTesting] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const config = await getSupabaseConfig();
    if (config) {
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setIsConfigured(true);
    }
    const ls = await database.getSyncMeta('last_sync_at');
    setLastSync(ls);
  };

  const handleSave = async () => {
    if (!url.trim() || !anonKey.trim()) {
      Alert.alert('Error', 'Please enter both Supabase URL and Anon Key');
      return;
    }

    if (!url.startsWith('https://')) {
      Alert.alert('Error', 'Supabase URL should start with https://');
      return;
    }

    await saveSupabaseConfig(url.trim(), anonKey.trim());
    setIsConfigured(true);
    Alert.alert('Saved', 'Supabase configuration saved. Sync will start automatically.');
  };

  const handleTestConnection = async () => {
    if (!url.trim() || !anonKey.trim()) {
      Alert.alert('Error', 'Please enter both URL and Anon Key first');
      return;
    }

    setTesting(true);
    try {
      // Temporarily save to test
      await saveSupabaseConfig(url.trim(), anonKey.trim());
      const supabase = await getSupabase();

      if (!supabase) {
        Alert.alert('Error', 'Could not create Supabase client');
        return;
      }

      const {error} = await supabase.from('users').select('id').limit(1);

      if (error) {
        Alert.alert('Connection Failed', error.message);
      } else {
        Alert.alert('Success', 'Connected to Supabase successfully!');
        setIsConfigured(true);
      }
    } catch (err: any) {
      Alert.alert('Connection Failed', err?.message || 'Unknown error');
    } finally {
      setTesting(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect',
      'This will remove the Supabase configuration. Your local data will be preserved.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await clearSupabaseConfig();
            setUrl('');
            setAnonKey('');
            setIsConfigured(false);
            setLastSync(null);
          },
        },
      ],
    );
  };

  const handleSyncNow = async () => {
    await syncNow();
    const ls = await database.getSyncMeta('last_sync_at');
    setLastSync(ls);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}>
        {/* Supabase Config Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cloud Sync (Supabase)</Text>
          <Text style={styles.sectionDesc}>
            Connect to Supabase to sync habits across family devices. Create a
            free project at supabase.com, then enter the URL and anon key below.
          </Text>

          <Text style={styles.label}>Project URL</Text>
          <TextInput
            style={styles.input}
            placeholder="https://xxxxx.supabase.co"
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Anon Key</Text>
          <TextInput
            style={[styles.input, styles.keyInput]}
            placeholder="eyJhbGciOiJIUzI1NiIs..."
            value={anonKey}
            onChangeText={setAnonKey}
            autoCapitalize="none"
            autoCorrect={false}
            multiline
            placeholderTextColor="#999"
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.testButton]}
              onPress={handleTestConnection}
              disabled={testing}>
              {testing ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Test Connection</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>

          {isConfigured && (
            <TouchableOpacity
              style={[styles.button, styles.disconnectButton]}
              onPress={handleDisconnect}>
              <Text style={styles.disconnectText}>Disconnect</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sync Status Section */}
        {isConfigured && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sync Status</Text>

            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Status:</Text>
              <Text style={styles.statusValue}>{syncStatus}</Text>
            </View>

            {lastSync && (
              <View style={styles.statusRow}>
                <Text style={styles.statusLabel}>Last sync:</Text>
                <Text style={styles.statusValue}>{formatDate(lastSync)}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.button, styles.syncButton]}
              onPress={handleSyncNow}
              disabled={syncStatus === 'syncing'}>
              {syncStatus === 'syncing' ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.buttonText}>Sync Now</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Setup Instructions</Text>
          <Text style={styles.instructionText}>
            1. Go to supabase.com and create a free project{'\n'}
            2. Open the SQL Editor and run the table creation SQL (see docs){'\n'}
            3. Go to Project Settings → API to find your URL and anon key{'\n'}
            4. Enter them above and tap "Test Connection"{'\n'}
            5. Share the URL and key with family members so they can sync too
          </Text>
        </View>

        <View style={{height: 32}} />
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    padding: 4,
    width: 60,
  },
  backText: {
    fontSize: 16,
    color: '#6200ee',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
  },
  keyInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  testButton: {
    backgroundColor: '#2979ff',
  },
  saveButton: {
    backgroundColor: '#6200ee',
  },
  syncButton: {
    backgroundColor: '#6200ee',
    marginTop: 12,
  },
  disconnectButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#f44336',
    marginTop: 12,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: 'white',
  },
  disconnectText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f44336',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  instructionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
});

export default SettingsScreen;
