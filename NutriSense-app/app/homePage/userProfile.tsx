import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  Platform,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
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
  const authContext = useAuth();
  const logout = authContext?.logout;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserEmail(user.email ?? '');
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserName(`${data.firstName ?? ''} ${data.lastName ?? ''}`);
          setProfileImage(data.profileImage ?? null);
        }
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
      router.replace('/(auth)/signlog');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  const handleLogoutContext = () => {
    if (logout) {
      logout();
    } else {
      console.warn('Logout function is not available.');
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerbg}>
          <View style={styles.header}>
            <View style={styles.headerTab}>
              <TouchableOpacity
                style={styles.backbutton}
                onPress={handleGoBack}
              >
                <Feather name="arrow-left" size={30} color="#fff"/>
              </TouchableOpacity>
              <Text style={styles.title}>User Profile</Text>
            </View>
            <View style={styles.userPro}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.userPic} />
              ) : (
                <View style={styles.userPic}>
                  <Feather name="user" size={80} color="#ccc" />
                </View>
              )}
              <Text style={styles.userName}>{userName || 'User'}</Text>
              <Text style={styles.userEmail}>
                {userEmail || 'User not loged in'}
              </Text>
            </View>
          </View>
        </View>
        {/* Cards */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    // backgroundColor: '#fff',
    backgroundColor: colors.tertiary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  header: {
    flex: 1,
    alignItems: 'center',
  },
  headerbg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 130,
    backgroundColor: colors.tertiary,
    zIndex: 0,
  },
  headerTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    paddingVertical: 10,
  },
  backbutton: {
    position: 'absolute',
    left: 10,
    
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
    marginTop: 25,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.tertiary,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    color: colors.tertiary,
    fontSize: 23,
    fontWeight: 'bold',
    marginTop: 8,
    letterSpacing: 1,
  },
  userEmail: {
    backgroundColor: colors.tertiary,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 15,
    color: 'white',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 17,
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 260,
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
