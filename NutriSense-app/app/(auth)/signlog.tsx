import React from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import colors from '../config/colors';

const SignLog = () => {
  const router = useRouter();

  return (
    <LinearGradient colors={['#61c765', '#128a17']} style={styles.gradient}>
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="default" />
        <View style={styles.container}>
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/appLogo.png')}
              style={styles.appLogo}
            />
            <Text style={styles.logoName}>NutriSense</Text>
          </View>
          <View style={styles.contentWrapper}>
            <Text style={styles.subtitle}>Let's Get Started!</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.push('/Login')}
                activeOpacity={0.9}
              >
                <Text style={styles.buttonText}>Log In</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={() => router.push('/Signup')}
                activeOpacity={0.9}
              >
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingLeft: 30,
    paddingRight: 30,
    alignItems: 'center',
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appLogo: {
    width: 100,
    height: 100,
    marginTop: 10,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  logoName: {
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#fff',
    textShadowColor: 'black',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '400',
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
    paddingBottom: 50,
  },
  buttonContainer: {
    width: '100%',
  },
  button: {
    marginTop: 20,
    height: 50,
    // backgroundColor: colors.primary,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  buttonText: {
    color: colors.tertiary,
    fontSize: 18,
    fontWeight: '400',
  },
});

export default SignLog;
