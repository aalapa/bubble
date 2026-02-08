import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RouteProp} from '@react-navigation/native';
import {BarChart} from 'react-native-chart-kit';
import {RootStackParamList} from '../navigation/types';
import {PersonalAnalyticsData} from '../types';
import database from '../database';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'PersonalAnalytics'>;
type RoutePropType = RouteProp<RootStackParamList, 'PersonalAnalytics'>;

const PersonalAnalyticsScreen = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RoutePropType>();
  const {userId} = route.params;
  const {width: screenWidth} = useWindowDimensions();

  const [data, setData] = useState<PersonalAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        setLoading(true);
        try {
          const analytics = await database.getPersonalAnalytics(userId);
          if (!cancelled) setData(analytics);
        } catch (err) {
          console.error('Failed to load analytics:', err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      load();
      return () => {
        cancelled = true;
      };
    }, [userId]),
  );

  if (loading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    );
  }

  const totalLogs = data.totalCompleted + data.totalSkipped + data.totalFailed;
  const chartWidth = screenWidth - 64;

  // Per-goal data sorted by 30d rate (worst first)
  const sortedGoals = [...data.goals].sort(
    (a, b) => a.completionRate30d - b.completionRate30d,
  );

  // Bar chart data for status breakdown
  const barData = {
    labels: ['Done', 'Skipped', 'Failed'],
    datasets: [
      {
        data: [data.totalCompleted, data.totalSkipped, data.totalFailed],
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Analytics</Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Summary Cards Row */}
        <View style={styles.cardRow}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>7-Day</Text>
            <Text style={styles.cardValue}>
              {Math.round(data.overallRate7d * 100)}%
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>30-Day</Text>
            <Text style={styles.cardValue}>
              {Math.round(data.overallRate30d * 100)}%
            </Text>
          </View>
        </View>

        {/* Streak Cards Row */}
        <View style={styles.cardRow}>
          <View style={[styles.card, styles.streakCard]}>
            <Text style={styles.streakEmoji}>🔥</Text>
            <Text style={styles.streakValue}>{data.streak.current}</Text>
            <Text style={styles.streakLabel}>Current Streak</Text>
          </View>
          <View style={[styles.card, styles.streakCard]}>
            <Text style={styles.streakEmoji}>🏆</Text>
            <Text style={styles.streakValue}>{data.streak.longest}</Text>
            <Text style={styles.streakLabel}>Longest Streak</Text>
          </View>
        </View>

        {/* Status Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status Breakdown (30 days)</Text>
          {totalLogs > 0 ? (
            <>
              <View style={styles.statusBar}>
                {data.totalCompleted > 0 && (
                  <View
                    style={[
                      styles.statusSegment,
                      {
                        flex: data.totalCompleted,
                        backgroundColor: '#4caf50',
                        borderTopLeftRadius: 6,
                        borderBottomLeftRadius: 6,
                      },
                    ]}
                  />
                )}
                {data.totalSkipped > 0 && (
                  <View
                    style={[
                      styles.statusSegment,
                      {flex: data.totalSkipped, backgroundColor: '#ff9800'},
                    ]}
                  />
                )}
                {data.totalFailed > 0 && (
                  <View
                    style={[
                      styles.statusSegment,
                      {
                        flex: data.totalFailed,
                        backgroundColor: '#f44336',
                        borderTopRightRadius: 6,
                        borderBottomRightRadius: 6,
                      },
                    ]}
                  />
                )}
              </View>
              <View style={styles.statusLegend}>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, {backgroundColor: '#4caf50'}]}
                  />
                  <Text style={styles.legendText}>
                    Done {data.totalCompleted}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, {backgroundColor: '#ff9800'}]}
                  />
                  <Text style={styles.legendText}>
                    Skipped {data.totalSkipped}
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, {backgroundColor: '#f44336'}]}
                  />
                  <Text style={styles.legendText}>
                    Failed {data.totalFailed}
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <Text style={styles.emptyText}>No activity logged yet</Text>
          )}
        </View>

        {/* Bar Chart */}
        {totalLogs > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Summary</Text>
            <BarChart
              data={barData}
              width={chartWidth}
              height={200}
              yAxisLabel=""
              yAxisSuffix=""
              fromZero
              showValuesOnTopOfBars
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
                labelColor: () => '#333',
                barPercentage: 0.6,
                propsForBackgroundLines: {
                  strokeDasharray: '',
                  stroke: '#e8e8e8',
                },
              }}
              style={styles.chart}
            />
          </View>
        )}

        {/* Per-Goal Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Per Goal (30 days)</Text>
          {sortedGoals.length === 0 ? (
            <Text style={styles.emptyText}>No goals created yet</Text>
          ) : (
            sortedGoals.map(ga => (
              <View key={ga.goal.id} style={styles.goalRow}>
                <View style={styles.goalInfo}>
                  <View
                    style={[styles.goalDot, {backgroundColor: ga.goal.color}]}
                  />
                  <Text style={styles.goalName} numberOfLines={1}>
                    {ga.goal.title}
                  </Text>
                </View>
                <View style={styles.goalBarContainer}>
                  <View
                    style={[
                      styles.goalBar,
                      {
                        width: `${Math.round(ga.completionRate30d * 100)}%`,
                        backgroundColor: ga.goal.color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.goalPercent}>
                  {Math.round(ga.completionRate30d * 100)}%
                </Text>
              </View>
            ))
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },

  // Header
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

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Cards
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#6200ee',
  },

  // Streaks
  streakCard: {
    paddingVertical: 12,
  },
  streakEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  streakLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  // Sections
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
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },

  // Status bar
  statusBar: {
    flexDirection: 'row',
    height: 20,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  statusSegment: {
    height: '100%',
  },
  statusLegend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: '#555',
  },

  // Chart
  chart: {
    borderRadius: 12,
    alignSelf: 'center',
  },

  // Per-goal
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 100,
  },
  goalDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  goalName: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  goalBarContainer: {
    flex: 1,
    height: 12,
    backgroundColor: '#e8e8e8',
    borderRadius: 6,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  goalBar: {
    height: '100%',
    borderRadius: 6,
  },
  goalPercent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    width: 40,
    textAlign: 'right',
  },

  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 16,
  },
});

export default PersonalAnalyticsScreen;
