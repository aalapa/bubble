import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Alert,
} from 'react-native';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {RootStackParamList} from '../navigation/types';
import {GoalWithStats, HabitStatus} from '../types';
import database from '../database';
import {calculateTileLayouts, TileLayout} from '../utils/tileLayout';
import HabitLogModal from '../components/HabitLogModal';
import {useSyncContext} from '../services/SyncProvider';

type DashboardNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;
type DashboardRouteProp = RouteProp<RootStackParamList, 'Dashboard'>;

const HEADER_HEIGHT = 60;

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardNavigationProp>();
  const route = useRoute<DashboardRouteProp>();
  const {userId} = route.params;
  const {width: screenWidth, height: screenHeight} = useWindowDimensions();
  const dashboardHeight = screenHeight - HEADER_HEIGHT;
  const {scheduleSyncAfterWrite} = useSyncContext();

  const [goals, setGoals] = useState<GoalWithStats[]>([]);
  const [tileLayouts, setTileLayouts] = useState<TileLayout[]>([]);
  const [overflowCount, setOverflowCount] = useState(0);
  const [selectedGoal, setSelectedGoal] = useState<GoalWithStats | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  const loadGoals = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const goalsWithStats = await database.getGoalsWithStats(userId, today);
      setGoals(goalsWithStats);

      const activeGoals = goalsWithStats.filter(g => !g.todayLog);
      const layouts = calculateTileLayouts(
        goalsWithStats,
        screenWidth - 32,
        dashboardHeight - 32,
      );
      setTileLayouts(layouts);
      setOverflowCount(activeGoals.length - layouts.length);
    } catch (error) {
      console.error('Failed to load goals:', error);
      Alert.alert('Error', 'Failed to load goals');
    }
  }, [userId, screenWidth, dashboardHeight]);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals]),
  );

  const handleTilePress = async (goal: GoalWithStats) => {
    if (goal.type === 'checkbox') {
      // Quick-complete checkbox goals with a single tap
      try {
        const today = new Date().toISOString().split('T')[0];
        await database.logHabit(goal.id, today, HabitStatus.COMPLETED);
        loadGoals();
        scheduleSyncAfterWrite();
      } catch (error) {
        console.error('Failed to log habit:', error);
        Alert.alert('Error', 'Failed to log habit');
      }
    } else {
      // Number goals open the modal to enter a value
      setSelectedGoal(goal);
      setShowLogModal(true);
    }
  };

  const handleTileLongPress = (goal: GoalWithStats) => {
    setSelectedGoal(goal);
    setShowLogModal(true);
  };

  const handleLogHabit = async (status: HabitStatus, value?: number) => {
    if (!selectedGoal) return;

    try {
      const today = new Date().toISOString().split('T')[0];
      await database.logHabit(selectedGoal.id, today, status, value);
      setShowLogModal(false);
      setSelectedGoal(null);
      loadGoals();
      scheduleSyncAfterWrite();
    } catch (error) {
      console.error('Failed to log habit:', error);
      Alert.alert('Error', 'Failed to log habit');
    }
  };

  const handleAddGoal = () => {
    setMenuVisible(false);
    navigation.navigate('AddGoal', {userId});
  };

  const handleDeleteGoals = () => {
    setMenuVisible(false);
    Alert.alert(
      'Delete Goals',
      'Select a goal by long pressing on it, then we can add a delete option',
      [{text: 'OK'}],
    );
  };

  const renderTile = (layout: TileLayout) => {
    const {goal} = layout;
    const opacity = goal.completionRate > 0.7 ? 0.7 : 1;

    return (
      <TouchableOpacity
        key={layout.id}
        style={[
          styles.tile,
          {
            left: layout.x + 16,
            top: layout.y + 16,
            width: layout.width - 8,
            height: layout.height - 8,
            backgroundColor: goal.color,
            opacity,
          },
        ]}
        onPress={() => handleTilePress(goal)}
        onLongPress={() => handleTileLongPress(goal)}
        delayLongPress={500}>
        <View style={styles.tileContent}>
          <Text style={styles.tileTitle} numberOfLines={3}>
            {goal.title}
          </Text>
          {goal.type === 'number' && goal.targetValue && (
            <Text style={styles.tileSubtitle}>
              Goal: {goal.targetValue} {goal.unit}
            </Text>
          )}
          <Text style={styles.tileStats}>
            {Math.round(goal.completionRate * 100)}% this month
          </Text>
          <Text style={styles.tileHint}>
            {goal.type === 'checkbox' ? 'Tap to complete' : 'Tap to log value'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('ProfileSelection')}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>My Habits</Text>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuVisible(!menuVisible)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      {menuVisible && (
        <>
          <Pressable
            style={styles.menuBackdrop}
            onPress={() => setMenuVisible(false)}
          />
          <View style={styles.menu}>
            <TouchableOpacity style={styles.menuItem} onPress={handleAddGoal}>
              <Text style={styles.menuItemText}>+ Add Goal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeleteGoals}>
              <Text style={styles.menuItemText}>Delete Goals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate('PersonalAnalytics', {userId});
              }}>
              <Text style={styles.menuItemText}>Analytics</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <View style={styles.dashboard}>
        {tileLayouts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No habits for today! 🎉
            </Text>
            <Text style={styles.emptyStateSubtext}>
              All done or tap the menu to add goals
            </Text>
          </View>
        ) : (
          <>
            {tileLayouts.map(renderTile)}
            {overflowCount > 0 && (
              <View style={styles.overflowIndicator}>
                <Text style={styles.overflowText}>
                  +{overflowCount} more habit{overflowCount > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </>
        )}
      </View>

      <HabitLogModal
        visible={showLogModal}
        goal={selectedGoal}
        onClose={() => {
          setShowLogModal(false);
          setSelectedGoal(null);
        }}
        onLog={handleLogHabit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: HEADER_HEIGHT,
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
    fontSize: 24,
    color: '#6200ee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  menuButton: {
    padding: 8,
  },
  menuIcon: {
    fontSize: 24,
    color: '#333',
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  menu: {
    position: 'absolute',
    top: HEADER_HEIGHT,
    right: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
    zIndex: 1000,
    minWidth: 200,
  },
  menuItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  dashboard: {
    flex: 1,
    position: 'relative',
  },
  tile: {
    position: 'absolute',
    borderRadius: 8,
    padding: 16,
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  tileContent: {
    flex: 1,
    justifyContent: 'center',
  },
  tileTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  tileSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  tileStats: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 'auto',
  },
  tileHint: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  overflowIndicator: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  overflowText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default DashboardScreen;
