import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {useSyncContext} from '../services/SyncProvider';

const SyncStatusBadge: React.FC = () => {
  const {syncStatus, syncNow} = useSyncContext();

  const getIndicator = () => {
    switch (syncStatus) {
      case 'syncing':
        return {color: '#ff9800', label: 'Syncing...'};
      case 'success':
        return {color: '#4caf50', label: 'Synced'};
      case 'error':
        return {color: '#f44336', label: 'Sync error'};
      case 'offline':
        return {color: '#9e9e9e', label: 'Offline'};
      case 'not_configured':
        return {color: '#9e9e9e', label: 'No sync'};
      default:
        return {color: '#9e9e9e', label: ''};
    }
  };

  const {color, label} = getIndicator();

  if (!label) return null;

  return (
    <TouchableOpacity style={styles.container} onPress={syncNow}>
      <View style={[styles.dot, {backgroundColor: color}]} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default SyncStatusBadge;
