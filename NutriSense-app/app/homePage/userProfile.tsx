import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Platform,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons, Feather } from '@expo/vector-icons';
import colors from '../config/colors';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { router } from 'expo-router';
import { useAuth } from '../AuthContext';

// Define navigation types
type RootStackParamList = {
  UserProfile: undefined;
  Login: undefined;
};

const UserProfile = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [imageLoading, setImageLoading] = useState(false);
  const [userHealthInfo, setUserHealthInfo] = useState<any>(null);
  const [healthInfoLoading, setHealthInfoLoading] = useState(true);
  const [userDataLoading, setUserDataLoading] = useState(true);
  const authContext = useAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email ?? '');
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserName(`${data.firstName ?? ''} ${data.lastName ?? ''}`);
            setProfileImage(data.profileImage ?? null);

            // Set health information
            setUserHealthInfo({
              age: data.age,
              gender: data.gender,
              height: data.height,
              weight: data.weight,
              activityLevel: data.activityLevel,
              dailyCalories: data.dailyCalories,
            });
            setHealthInfoLoading(false);
          } else {
            setHealthInfoLoading(false);
          }
          setUserDataLoading(false);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserDataLoading(false);
          setHealthInfoLoading(false);
        }
      } else {
        setUserDataLoading(false);
        setHealthInfoLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Reset the entire navigation stack and go to login
      router.dismissAll();
      router.replace('/(auth)/signlog');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const handleLogoutContext = async () => {
    try {
      await signOut(auth);
      router.dismissAll();
      router.replace('/(auth)/signlog');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="light" backgroundColor={colors.tertiary} />

      {/* Single ScrollView containing everything */}
      <ScrollView
        style={styles.mainScrollContainer}
        contentContainerStyle={styles.mainScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <View style={styles.headerTab}>
            <TouchableOpacity style={styles.backbutton} onPress={handleGoBack}>
              <Feather name="arrow-left" size={30} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>User Profile</Text>
          </View>

          {/* User Profile Info */}
          <View style={styles.userPro}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.userPic} />
            ) : (
              <View style={styles.userPic}>
                <Feather name="user" size={80} color="#ccc" />
              </View>
            )}
            {userDataLoading ? (
              <View style={styles.userNameLoading}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={styles.userNameLoadingText}>Loading...</Text>
              </View>
            ) : (
              <Text style={styles.userName}>{userName}</Text>
            )}
            <Text style={styles.userEmail}>
              {userEmail || 'User not logged in'}
            </Text>
          </View>
        </View>

        {/* White Content Area */}
        <View style={styles.contentArea}>
          {/* Health Information Cards - Always Show */}
          <View style={styles.healthInfoContainer}>
            <Text style={styles.healthInfoTitle}>Health Information</Text>
            <View style={styles.healthCards}>
              <View style={styles.healthCard}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={colors.tertiary}
                />
                <Text style={styles.healthLabel}>Age</Text>
                {healthInfoLoading ? (
                  <ActivityIndicator size="small" color={colors.tertiary} />
                ) : (
                  <Text style={styles.healthValue}>
                    {userHealthInfo?.age
                      ? `${userHealthInfo.age} years`
                      : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.healthCard}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={colors.tertiary}
                />
                <Text style={styles.healthLabel}>Gender</Text>
                {healthInfoLoading ? (
                  <ActivityIndicator size="small" color={colors.tertiary} />
                ) : (
                  <Text style={styles.healthValue}>
                    {userHealthInfo?.gender
                      ? userHealthInfo.gender === 'male'
                        ? 'Male'
                        : 'Female'
                      : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.healthCard}>
                <Ionicons
                  name="resize-outline"
                  size={20}
                  color={colors.tertiary}
                />
                <Text style={styles.healthLabel}>Height</Text>
                {healthInfoLoading ? (
                  <ActivityIndicator size="small" color={colors.tertiary} />
                ) : (
                  <Text style={styles.healthValue}>
                    {userHealthInfo?.height
                      ? `${userHealthInfo.height} cm`
                      : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.healthCard}>
                <Ionicons
                  name="fitness-outline"
                  size={20}
                  color={colors.tertiary}
                />
                <Text style={styles.healthLabel}>Weight</Text>
                {healthInfoLoading ? (
                  <ActivityIndicator size="small" color={colors.tertiary} />
                ) : (
                  <Text style={styles.healthValue}>
                    {userHealthInfo?.weight
                      ? `${userHealthInfo.weight} kg`
                      : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.healthCard}>
                <Ionicons
                  name="flash-outline"
                  size={20}
                  color={colors.tertiary}
                />
                <Text style={styles.healthLabel}>Activity</Text>
                {healthInfoLoading ? (
                  <ActivityIndicator size="small" color={colors.tertiary} />
                ) : (
                  <Text style={styles.healthValue}>
                    {userHealthInfo?.activityLevel
                      ? userHealthInfo.activityLevel
                          .replace('_', ' ')
                          .replace(/\b\w/g, (l: string) => l.toUpperCase())
                      : 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.healthCard}>
                <Ionicons
                  name="flame-outline"
                  size={20}
                  color={colors.tertiary}
                />
                <Text style={styles.healthLabel}>Daily Calories</Text>
                {healthInfoLoading ? (
                  <ActivityIndicator size="small" color={colors.tertiary} />
                ) : (
                  <Text style={styles.healthValue}>
                    {userHealthInfo?.dailyCalories
                      ? `${userHealthInfo.dailyCalories} kcal`
                      : 'Not set'}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Action Cards */}
          <View style={styles.cardContainer}>
            <TouchableOpacity
              style={[styles.card, styles.coloredCard]}
              activeOpacity={0.9}
              onPress={() => router.push('/homePage/EditProfile')}
            >
              <View style={styles.cardLeft}>
                <Ionicons
                  name="person-circle-outline"
                  size={24}
                  style={[styles.icon, styles.coloredCardIcon]}
                />
                <Text style={[styles.cardText, styles.coloredCardText]}>
                  Edit Profile
                </Text>
              </View>
              <Ionicons
                name="chevron-forward-outline"
                size={24}
                style={[styles.icon, styles.coloredCardIcon]}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.card, styles.coloredCard]}
              activeOpacity={0.9}
              onPress={handleLogout}
            >
              <View style={styles.cardLeft}>
                <Ionicons
                  name="log-out-outline"
                  size={24}
                  style={styles.coloredCardIcon}
                />
                <Text style={[styles.cardText, styles.coloredCardText]}>
                  Logout
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.tertiary,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  mainScrollContainer: {
    flex: 1,
  },
  mainScrollContent: {
    flexGrow: 1,
  },
  headerSection: {
    backgroundColor: colors.tertiary,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  contentArea: {
    backgroundColor: '#fff',
    flex: 1,
    marginTop: -20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
  },
  headerTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  backbutton: {
    position: 'absolute',
    left: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white',
  },
  userPro: {
    alignItems: 'center',
  },
  userPic: {
    width: 100,
    height: 100,
    marginTop: 5,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: '#fff',
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 1,
  },
  userNameLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  userNameLoadingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  userEmail: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 17,
    marginBottom: 20,
  },
  cardContainer: {
    marginTop: 30,
  },
  healthInfoContainer: {
    marginTop: 10,
    marginBottom: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  healthInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.tertiary,
    marginBottom: 15,
    textAlign: 'center',
  },
  healthCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  healthCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  healthLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    marginBottom: 2,
    textAlign: 'center',
  },
  healthValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.tertiary,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    borderRadius: 10,
    backgroundColor: '#cfcad9',
    marginBottom: 10,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 16,
    fontWeight: 'light',
    marginLeft: 5,
  },
  coloredCard: {
    backgroundColor: colors.tertiary,
  },
  coloredCardText: {
    color: 'white',
  },
  coloredCardIcon: {
    color: 'white',
  },
  icon: {
    color: colors.primary,
  },
});

export default UserProfile;
