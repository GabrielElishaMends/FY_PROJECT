import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import GoogleIcon from '../../assets/images/googleIcon';
import colors from '../config/colors';
import { useRouter } from 'expo-router';
import { useAuth } from '../AuthContext';

const Login = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  //Function to handle Login with Firebase
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const token = await userCredential.user.getIdToken();
      login(token); // Call the login function from AuthContext
      router.replace('/(tabs)/dash_board');
    } catch (error) {
      console.error(error);
      const err = error as { code?: string; message?: string };
      if (err.code === 'auth/user-not-found') {
        Alert.alert('Error', 'No user found with this email.');
      } else if (err.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Incorrect password.');
      } else {
        Alert.alert('Error', 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to handle password reset
  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert(
        'Forgot Password',
        'Please enter your email address above first.'
      );
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      Alert.alert(
        'Password Reset',
        'A password reset link has been sent to your email address.'
      );
    } catch (error) {
      console.error(error);
      Alert.alert(
        'Error',
        'Could not send password reset email. Please check your email address and try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="dark" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Wrap the content in a View with styles.container */}
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <Image
              source={require('../../assets/images/appLogo.png')}
              style={styles.appLogo}
            />
            <Text style={styles.logoName}>NutriSense</Text>
          </View>

          <View style={styles.contentWrapper}>
            {/* Content Section */}
            <View style={styles.content}>
              <Text>Welcome! Let's log you in</Text>

              {/* Input Fields */}
              <TextInput
                style={styles.input}
                onChangeText={setEmail}
                value={email}
                placeholder="Enter email"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {/* Password Input with Toggle Visibility */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  onChangeText={setPassword}
                  value={password}
                  placeholder="Password"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                >
                  <Ionicons
                    name={isPasswordVisible ? 'eye-off' : 'eye'}
                    size={24}
                    color="gray"
                  />
                </TouchableOpacity>
              </View>
              <Text
                style={styles.forgotPassword}
                onPress={handleForgotPassword}
              >
                Forgot Password?
              </Text>
            </View>

            {/* Button Section */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.button}
                onPress={handleLogin}
                activeOpacity={0.9}
              >
                {loading ? (
                  <Text style={styles.buttonText}>Logging In...</Text>
                ) : (
                  <Text style={styles.buttonText}>Log In</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* OR Divider */}
            {/* <View style={styles.orContainer}>
              <View style={styles.line} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.line} />
            </View> */}

            {/* Continue with Google Button */}
            {/* <TouchableOpacity
              style={styles.googleButton}
              onPress={() => console.log('Google Log In')}
              activeOpacity={0.8}
            >
              <GoogleIcon width={24} height={24} />
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity> */}

            <View style={styles.signupContainer}>
              <Text>Don't Have An Account?</Text>
              <Text
                style={styles.signupLine}
                onPress={() => router.push('/Signup')}
              >
                Sign Up
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  appLogo: {
    width: 80,
    height: 80,
    marginTop: 20,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: colors.tertiary,
  },
  button: {
    marginTop: 20,
    height: 50,
    // backgroundColor: '#4f46e5',
    backgroundColor: colors.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  buttonContainer: {
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    paddingLeft: 30,
    paddingRight: 30,
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  contentWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  eyeIcon: {
    position: 'absolute',
    right: 15,
    bottom: 0,
  },
  forgotPassword: {
    alignSelf: 'flex-start',
    marginLeft: 10,
    marginTop: 10,
    fontWeight: '400',
    textDecorationLine: 'underline',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: '100%',
    justifyContent: 'flex-start',
  },
  googleIcon: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    paddingHorizontal: 15,
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
  },
  input: {
    borderRadius: 50,
    height: 50,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#C0C0C0',
    padding: 10,
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    marginTop: 10,
    marginBottom: 10,
    width: '100%',
    position: 'relative',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc', // Light gray line
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  signupContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  signupLine: {
    color: colors.tertiary,
    fontWeight: '400',
    marginTop: 5,
  },
  logoName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  orText: {
    marginHorizontal: 10,
    fontWeight: 'bold',
    color: '#888', // Slightly dimmed color for OR text
  },
});

export default Login;
