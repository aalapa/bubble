import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../navigation/types';
import {LeaderboardEntry} from '../types';
import database from '../database';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Leaderboard'>;

const MEDALS = ['🥇', '🥈', '🥉'];
const PODIUM_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const LeaderboardScreen = () => {
  const navigation = useNavigation<NavProp>();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const load = async () => {
        setLoading(true);
        try {
          const data = await database.getLeaderboardData();
          if (!cancelled) setEntries(data);
        } catch (err) {
          console.error('Failed to load leaderboard:', err);
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      load();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200ee" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  // Split into podium (top 3) and rest
  const podium = entries.slice(0, Math.min(3, entries.length));
  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumDisplay =
    podium.length >= 3
      ? [podium[1], podium[0], podium[2]]
      : podium.length === 2
        ? [podium[1], podium[0]]
        : podium;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <View style={{width: 60}} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>No users yet</Text>
            <Text style={styles.emptySubtext}>
              Create profiles and start tracking habits!
            </Text>
          </View>
        ) : (
          <>
            {/* Podium */}
            <View style={styles.podiumContainer}>
              {podiumDisplay.map((entry, displayIndex) => {
                const actualRank = entry.rank;
                const isFirst = actualRank === 1;
                const podiumHeight = isFirst ? 120 : actualRank === 2 ? 90 : 70;

                return (
                  <View
                    key={entry.user.id}
                    style={[styles.podiumItem, {alignSelf: 'flex-end'}]}>
                    {/* Avatar */}
                    <View
                      style={[
                        styles.podiumAvatar,
                        isFirst && styles.podiumAvatarFirst,
                        {
                          borderColor:
                            PODIUM_COLORS[actualRank - 1] || '#6200ee',
                        },
                      ]}>
                      <Text
                        style={[
                          styles.podiumInitials,
                          isFirst && styles.podiumInitialsFirst,
                        ]}>
                        {getInitials(entry.user.name)}
                      </Text>
                    </View>
                    <Text style={styles.podiumMedal}>
                      {MEDALS[actualRank - 1] || ''}
                    </Text>
                    <Text
                      style={styles.podiumName}
                      numberOfLines={1}>
                      {entry.user.name}
                    </Text>
                    <Text style={styles.podiumScore}>
                      {Math.round(entry.score * 100)}%
                    </Text>

                    {/* Podium bar */}
                    <View
                      style={[
                        styles.podiumBar,
                        {
                          height: podiumHeight,
                          backgroundColor:
                            PODIUM_COLORS[actualRank - 1] || '#6200ee',
                        },
                      ]}>
                      <Text style={styles.podiumRank}>#{actualRank}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Full Ranking List */}
            <View style={styles.listSection}>
              <Text style={styles.listTitle}>Full Rankings</Text>
              {entries.map((entry, index) => (
                <View key={entry.user.id} style={styles.listRow}>
                  <View style={styles.listRank}>
                    {entry.rank <= 3 ? (
                      <Text style={styles.listMedal}>
                        {MEDALS[entry.rank - 1]}
                      </Text>
                    ) : (
                      <Text style={styles.listRankText}>#{entry.rank}</Text>
                    )}
                  </View>

                  <View
                    style={[styles.listAvatar, {backgroundColor: '#6200ee'}]}>
                    <Text style={styles.listAvatarText}>
                      {getInitials(entry.user.name)}
                    </Text>
                  </View>

                  <View style={styles.listInfo}>
                    <Text style={styles.listName}>{entry.user.name}</Text>
                    <Text style={styles.listGoalCount}>
                      {entry.goalCount} goal{entry.goalCount !== 1 ? 's' : ''}
                    </Text>
                  </View>

                  <View style={styles.listScoreContainer}>
                    <Text style={styles.listScore}>
                      {Math.round(entry.score * 100)}%
                    </Text>
                    <View style={styles.listBarBg}>
                      <View
                        style={[
                          styles.listBarFill,
                          {width: `${Math.round(entry.score * 100)}%`},
                        ]}
                      />
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

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

  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },

  // Podium
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  podiumItem: {
    alignItems: 'center',
    flex: 1,
    maxWidth: 110,
  },
  podiumAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#6200ee',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    marginBottom: 4,
  },
  podiumAvatarFirst: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
  },
  podiumInitials: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  podiumInitialsFirst: {
    fontSize: 22,
  },
  podiumMedal: {
    fontSize: 20,
    marginBottom: 2,
  },
  podiumName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 2,
  },
  podiumScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 4,
  },
  podiumBar: {
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  podiumRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },

  // List
  listSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listRank: {
    width: 36,
    alignItems: 'center',
  },
  listMedal: {
    fontSize: 20,
  },
  listRankText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
  },
  listAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  listAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  listInfo: {
    flex: 1,
  },
  listName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  listGoalCount: {
    fontSize: 12,
    color: '#999',
  },
  listScoreContainer: {
    width: 80,
    alignItems: 'flex-end',
  },
  listScore: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6200ee',
    marginBottom: 4,
  },
  listBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#e8e8e8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  listBarFill: {
    height: '100%',
    backgroundColor: '#6200ee',
    borderRadius: 3,
  },
});

export default LeaderboardScreen;
