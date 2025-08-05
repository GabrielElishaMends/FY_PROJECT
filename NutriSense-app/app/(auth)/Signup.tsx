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
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar } from 'react-native';
import { useNavigation } from '@react-navigation/native';
// import { signInWithEmailAndPassword } from 'firebase/auth';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { uploadImage } from '../utils/uploadImage';
import { Feather } from '@expo/vector-icons';
import { FirebaseError } from 'firebase/app';
import { auth, db } from '../../firebaseConfig';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
// import GoogleIcon from '../../assets/images/googleIcon';
import colors from '../config/colors';
import { router } from 'expo-router';
import { setDoc, doc } from 'firebase/firestore';

const Signup = () => {
  const navigation = useNavigation();
  const [image, setImage] = React.useState<string | null>(null);
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const [loading, setLoading] = useState(false);

  // Function to Pick Image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  //Function to handle Signup - collect data but don't create account yet
  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }
    if (!validatePassword(password)) {
      Alert.alert('Error', 'Password is not strong enough.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    // Navigate to UserInfoScreen with the signup data
    router.push({
      pathname: '/(auth)/UserInfoScreen',
      params: {
        firstName,
        lastName,
        email,
        password,
        profileImage: image || '',
      },
    });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return (
      password.length >= minLength &&
      hasUpperCase &&
      hasLowerCase &&
      hasNumber &&
      hasSpecialChar
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="dark" backgroundColor="#fff" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerTab}>
              <TouchableOpacity
                style={styles.backbutton}
                onPress={() => router.back()}
              >
                <Feather name="arrow-left" size={30} />
              </TouchableOpacity>
              <Text style={styles.headerText}>Create an account</Text>
            </View>

            {/* Profile Picture with Upload Option */}
            <TouchableOpacity style={styles.imageContainer} onPress={pickImage}>
              {image ? (
                <Image source={{ uri: image }} style={styles.appLogo} />
              ) : (
                <View
                  style={[
                    styles.appLogo,
                    {
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#eee',
                    },
                  ]}
                >
                  <Feather name="user" size={48} color="#bbb" />
                </View>
              )}
              <View style={styles.plusIcon}>
                <Ionicons name="add-circle" size={20} color="white" />
              </View>
            </TouchableOpacity>

            <Text style={styles.logoName}>Add a photo</Text>
          </View>

          <View style={styles.contentWrapper}>
            {/* Content Section */}
            <View style={styles.content}>
              {/* Input Fields */}
              <TextInput
                style={styles.input}
                onChangeText={setFirstName}
                value={firstName}
                placeholder="First Name"
              />
              <TextInput
                style={styles.input}
                onChangeText={setLastName}
                value={lastName}
                placeholder="Last Name"
              />
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
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError(
                      validatePassword(text)
                        ? ''
                        : 'Password must be 8+ chars, include upper, lower, number, special char.'
                    );
                  }}
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
              {passwordError ? (
                <Text style={{ color: 'red', marginBottom: 8 }}>
                  {passwordError}
                </Text>
              ) : null}

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setConfirmPasswordError(
                      text === password ? '' : 'Passwords do not match.'
                    );
                  }}
                  value={confirmPassword}
                  placeholder="Confirm Password"
                  secureTextEntry={!isConfirmPasswordVisible}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() =>
                    setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
                  }
                >
                  <Ionicons
                    name={isConfirmPasswordVisible ? 'eye-off' : 'eye'}
                    size={24}
                    color="gray"
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={{ color: 'red', marginBottom: 8 }}>
                  {confirmPasswordError}
                </Text>
              ) : null}
            </View>

            {/* Button Section */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  (loading ||
                    !validatePassword(password) ||
                    password !== confirmPassword) &&
                    styles.buttonDisabled,
                ]}
                onPress={handleSignup}
                activeOpacity={0.9}
                disabled={
                  loading ||
                  !validatePassword(password) ||
                  password !== confirmPassword
                }
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                      Please wait...
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>
                    Continue to Health Setup
                  </Text>
                )}
              </TouchableOpacity>
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
    borderRadius: 40,
    marginTop: 20,
    borderColor: colors.tertiary,
    borderWidth: 1,
  },
  backbutton: {
    position: 'absolute',
    left: -20,
    top: 5,
  },
  button: {
    marginTop: 20,
    height: 50,
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
    bottom: 3,
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
  googleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#555',
    paddingHorizontal: 15,
  },
  header: {
    alignItems: 'center',
    width: '100%',
  },
  headerTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    paddingTop: 10,
    // backgroundColor: 'lightblue',
  },
  headerText: {
    fontSize: 16,
    fontWeight: 'medium',
  },
  imageContainer: {
    position: 'relative',
    alignItems: 'center',
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
    backgroundColor: '#ccc',
  },
  logoName: {
    fontSize: 18,
    fontWeight: '300',
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
    color: '#888',
  },
  plusIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.tertiary,
    borderRadius: 50,
    padding: 2,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});

export default Signup;
