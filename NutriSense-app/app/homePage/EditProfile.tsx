import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
} from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import colors from '../config/colors';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../utils/uploadImage';
import { Feather, Ionicons } from '@expo/vector-icons';

const EditProfile = () => {
  const navigation = useNavigation();
  const user = auth.currentUser;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    // Fetch current user data
    const fetchUserData = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFirstName(data.firstName || '');
          setLastName(data.lastName || '');
          setProfileImage(data.profileImage || null);
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    try {
      if (user) {
        // Update Firestore name fields
        await updateDoc(doc(db, 'users', user.uid), {
          firstName,
          lastName,
          profileImage,
        });
        // Update displayName in Firebase Auth
        await updateProfile(user, {
          displayName: `${firstName} ${lastName}`,
          photoURL: profileImage || undefined,
        });
        Alert.alert('Success', 'Profile updated!');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update profile.');
      console.error(error);
    }
  };

  const handleChangePassword = async () => {
    try {
      if (user && newPassword.length >= 6) {
        await updatePassword(user, newPassword);
        Alert.alert('Success', 'Password updated!');
        setNewPassword('');
      } else {
        Alert.alert('Error', 'Password must be at least 6 characters.');
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update password.');
      console.error(error);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && user) {
      setUploading(true);
      try {
        const uri = result.assets[0].uri;
        const url = await uploadImage(uri, user.uid);
        setProfileImage(url);
      } catch (e) {
        Alert.alert('Error', 'Could not upload image.');
      }
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      {/* Header background */}
      <View style={styles.headerbg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <View style={styles.headerTab}>
              <TouchableOpacity
                style={styles.backbutton}
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={30} color="#fff"/>
              </TouchableOpacity>
              <Text style={styles.title}>Edit Profile</Text>
            </View>
            <TouchableOpacity
              style={styles.imagePicker}
              onPress={handlePickImage}
            >
              {profileImage ? (
                <>
                  {imageLoading && (
                    <ActivityIndicator
                      size="large"
                      color={colors.tertiary}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.profileImage}
                    onLoadStart={() => setImageLoading(true)}
                    onLoadEnd={() => setImageLoading(false)}
                  />
                </>
              ) : (
                <Feather name="user" size={80} color="#ccc" />
              )}
              <View style={styles.editIcon}>
                <Feather name="edit-2" size={20} color="#fff" />
              </View>
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              value={firstName}
              onChangeText={setFirstName}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              value={lastName}
              onChangeText={setLastName}
            />
            <TouchableOpacity
              style={styles.button}
              onPress={handleSave}
              disabled={uploading}
            >
              <Text style={styles.buttonText}>
                {uploading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Change Password</Text>
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword((prev) => !prev)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#888"
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={handleChangePassword}
            >
              <Text style={styles.buttonText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.tertiary,
    marginTop: 32,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.tertiary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: colors.tertiary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagePicker: {
    alignSelf: 'center',
    marginBottom: 24,
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  profileImage: {
    width: 92,
    height: 92,
    borderRadius: 46,
  },
  editIcon: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: colors.tertiary,
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.tabBackgColor,
  },
  passwordInputWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  passwordInput: {
    paddingRight: 40,
    marginBottom: 0,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
  },
  headerTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    position: 'relative',
    paddingVertical: 10,
    marginBottom: 30,
  },
  backbutton: {
    position: 'absolute',
    left: -10,
  },
  headerbg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 170,
    backgroundColor: colors.tertiary,
    zIndex: 0,
  },
});

export default EditProfile;
