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
  Image,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar } from 'react-native';
import { auth, db } from '../../firebaseConfig';
import { updateProfile, updatePassword } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import colors from '../config/colors';
import * as ImagePicker from 'expo-image-picker';
import { uploadImage } from '../utils/uploadImage';
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  UserHealthInfo,
  calculateDailyCalories,
  calculateMacronutrients,
  getHeightSuggestions,
  getWeightSuggestions,
} from '../utils/calculateCalories';
import { reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

const EditProfile = () => {
  const navigation = useNavigation();
  const user = auth.currentUser;
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showHeightModal, setShowHeightModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);

  // Health information states
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | ''>('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<
    | 'sedentary'
    | 'lightly_active'
    | 'moderately_active'
    | 'very_active'
    | 'extra_active'
    | ''
  >('');

  const activityOptions = [
    {
      key: 'sedentary',
      label: 'Sedentary',
      description: 'Little or no exercise',
    },
    {
      key: 'lightly_active',
      label: 'Lightly Active',
      description: 'Light exercise 1-3 days/week',
    },
    {
      key: 'moderately_active',
      label: 'Moderately Active',
      description: 'Moderate exercise 3-5 days/week',
    },
    {
      key: 'very_active',
      label: 'Very Active',
      description: 'Hard exercise 6-7 days/week',
    },
    {
      key: 'extra_active',
      label: 'Extra Active',
      description: 'Very hard exercise & physical job',
    },
  ];

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

          // Set health information
          setAge(data.age?.toString() || '');
          setGender(data.gender || '');
          setHeight(data.height?.toString() || '');
          setWeight(data.weight?.toString() || '');
          setActivityLevel(data.activityLevel || '');
        }
      }
    };
    fetchUserData();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user) {
        // Recalculate nutrition needs if health info is provided
        let updateData: any = {
          firstName,
          lastName,
          profileImage,
          updatedAt: new Date(),
        };

        // If health information is provided, recalculate nutrition needs
        if (age && gender && height && weight && activityLevel) {
          const userHealthInfo: UserHealthInfo = {
            age: parseInt(age),
            gender: gender as 'male' | 'female',
            height: parseFloat(height),
            weight: parseFloat(weight),
            activityLevel: activityLevel as UserHealthInfo['activityLevel'],
          };

          const dailyCalories = calculateDailyCalories(userHealthInfo);
          const nutritionNeeds = calculateMacronutrients(dailyCalories);

          updateData = {
            ...updateData,
            age: userHealthInfo.age,
            gender: userHealthInfo.gender,
            height: userHealthInfo.height,
            weight: userHealthInfo.weight,
            activityLevel: userHealthInfo.activityLevel,
            dailyCalories: nutritionNeeds.dailyCalories,
            dailyCarbs: nutritionNeeds.dailyCarbs,
            dailyProtein: nutritionNeeds.dailyProtein,
            dailyFat: nutritionNeeds.dailyFat,
          };
        }

        // Update Firestore
        await updateDoc(doc(db, 'users', user.uid), updateData);

        // Update displayName in Firebase Auth
        await updateProfile(user, {
          displayName: `${firstName} ${lastName}`,
          photoURL: profileImage || undefined,
        });

        Alert.alert('Success', 'Profile updated successfully!');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Could not update profile.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setChangingPassword(true);
    try {
      if (!currentPassword) {
        Alert.alert('Error', 'Please enter your current password.');
        setChangingPassword(false);
        return;
      }

      if (newPassword.length < 6) {
        Alert.alert('Error', 'New password must be at least 6 characters.');
        setChangingPassword(false);
        return;
      }

      if (user && user.email) {
        // Re-authenticate the user
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);
        Alert.alert('Success', 'Password updated successfully!');
        setNewPassword('');
        setCurrentPassword('');
      }
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        Alert.alert('Error', 'Current password is incorrect.');
      } else if (error.code === 'auth/too-many-requests') {
        Alert.alert(
          'Error',
          'Too many failed attempts. Please try again later.'
        );
      } else {
        Alert.alert('Error', 'Could not update password. Please try again.');
      }
      console.error(error);
    } finally {
      setChangingPassword(false);
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

  const renderHeightSuggestions = () => {
    const ageNum = parseInt(age) || 25;
    const suggestions = getHeightSuggestions(ageNum);

    return (
      <Modal visible={showHeightModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Height Suggestions</Text>
            <Text style={styles.modalSubtitle}>
              Typical height range for {suggestions.ageGroup} (age {ageNum}):
            </Text>
            <Text style={styles.suggestionText}>
              {suggestions.min} - {suggestions.max} {suggestions.unit}
            </Text>

            <View style={styles.suggestionButtons}>
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => {
                  setHeight(suggestions.min.toString());
                  setShowHeightModal(false);
                }}
              >
                <Text style={styles.suggestionButtonText}>
                  Use {suggestions.min} cm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => {
                  setHeight(
                    Math.round(
                      (suggestions.min + suggestions.max) / 2
                    ).toString()
                  );
                  setShowHeightModal(false);
                }}
              >
                <Text style={styles.suggestionButtonText}>
                  Use {Math.round((suggestions.min + suggestions.max) / 2)} cm
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => {
                  setHeight(suggestions.max.toString());
                  setShowHeightModal(false);
                }}
              >
                <Text style={styles.suggestionButtonText}>
                  Use {suggestions.max} cm
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowHeightModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  const renderWeightSuggestions = () => {
    const ageNum = parseInt(age) || 25;
    const suggestions = getWeightSuggestions(ageNum);

    return (
      <Modal visible={showWeightModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Weight Suggestions</Text>
            <Text style={styles.modalSubtitle}>
              Typical weight range for {suggestions.ageGroup} (age {ageNum}):
            </Text>
            <Text style={styles.suggestionText}>
              {suggestions.min} - {suggestions.max} {suggestions.unit}
            </Text>

            <View style={styles.suggestionButtons}>
              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => {
                  setWeight(suggestions.min.toString());
                  setShowWeightModal(false);
                }}
              >
                <Text style={styles.suggestionButtonText}>
                  Use {suggestions.min} kg
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => {
                  setWeight(
                    Math.round(
                      (suggestions.min + suggestions.max) / 2
                    ).toString()
                  );
                  setShowWeightModal(false);
                }}
              >
                <Text style={styles.suggestionButtonText}>
                  Use {Math.round((suggestions.min + suggestions.max) / 2)} kg
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.suggestionButton}
                onPress={() => {
                  setWeight(suggestions.max.toString());
                  setShowWeightModal(false);
                }}
              >
                <Text style={styles.suggestionButtonText}>
                  Use {suggestions.max} kg
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowWeightModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="light" backgroundColor={colors.tertiary} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Single ScrollView containing everything */}
        <ScrollView
          style={styles.mainScrollContainer}
          contentContainerStyle={styles.mainScrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.headerTab}>
              <TouchableOpacity
                style={styles.backbutton}
                onPress={() => navigation.goBack()}
              >
                <Feather name="arrow-left" size={30} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.title}>Edit Profile</Text>
            </View>

            {/* Profile Image Picker */}
            <View style={styles.profileImageContainer}>
              <TouchableOpacity
                style={styles.imagePicker}
                onPress={handlePickImage}
                activeOpacity={0.8}
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
            </View>
          </View>

          {/* White Content Area */}
          <View style={styles.contentArea}>
            {/* Basic Information Section */}
            <Text style={[styles.sectionTitle, { marginTop: 10 }]}>
              Basic Information
            </Text>

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

            {/* Health Information Section */}
            <Text style={styles.sectionTitle}>Health Information</Text>

            {/* Age */}
            <TextInput
              style={styles.input}
              placeholder="Age"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              maxLength={3}
            />

            {/* Gender */}
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'male' && styles.genderButtonActive,
                ]}
                onPress={() => setGender('male')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person"
                  size={20}
                  color={gender === 'male' ? '#fff' : colors.tertiary}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === 'male' && styles.genderButtonTextActive,
                  ]}
                >
                  Male
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.genderButton,
                  gender === 'female' && styles.genderButtonActive,
                ]}
                onPress={() => setGender('female')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person"
                  size={20}
                  color={gender === 'female' ? '#fff' : colors.tertiary}
                />
                <Text
                  style={[
                    styles.genderButtonText,
                    gender === 'female' && styles.genderButtonTextActive,
                  ]}
                >
                  Female
                </Text>
              </TouchableOpacity>
            </View>

            {/* Height */}
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Height (cm)"
                value={height}
                onChangeText={setHeight}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.suggestButton}
                onPress={() => {
                  if (!age.trim()) {
                    Alert.alert(
                      'Age Required',
                      'Please enter your age first to get height suggestions.'
                    );
                    return;
                  }
                  setShowHeightModal(true);
                }}
                disabled={!age}
                activeOpacity={0.8}
              >
                <Text style={styles.suggestButtonText}>?</Text>
              </TouchableOpacity>
            </View>

            {/* Weight */}
            <View style={styles.inputWithButton}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
              />
              <TouchableOpacity
                style={styles.suggestButton}
                onPress={() => {
                  if (!age.trim()) {
                    Alert.alert(
                      'Age Required',
                      'Please enter your age first to get weight suggestions.'
                    );
                    return;
                  }
                  setShowWeightModal(true);
                }}
                disabled={!age}
                activeOpacity={0.8}
              >
                <Text style={styles.suggestButtonText}>?</Text>
              </TouchableOpacity>
            </View>

            {/* Activity Level */}
            <Text style={styles.label}>Activity Level</Text>
            {activityOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.activityOption,
                  activityLevel === option.key && styles.activityOptionActive,
                ]}
                onPress={() => setActivityLevel(option.key as any)}
                activeOpacity={0.8}
              >
                <View style={styles.activityContent}>
                  <Text
                    style={[
                      styles.activityLabel,
                      activityLevel === option.key &&
                        styles.activityLabelActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                  <Text
                    style={[
                      styles.activityDescription,
                      activityLevel === option.key &&
                        styles.activityDescriptionActive,
                    ]}
                  >
                    {option.description}
                  </Text>
                </View>
                {activityLevel === option.key && (
                  <Ionicons name="checkmark-circle" size={24} color="#fff" />
                )}
              </TouchableOpacity>
            ))}

            {/* Password Change Section */}
            <Text style={styles.sectionTitle}>Change Password</Text>

            {/* Current Password */}
            <View style={styles.passwordInputWrapper}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Current Password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowCurrentPassword((prev) => !prev)}
              >
                <Ionicons
                  name={showCurrentPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            {/* New Password */}
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
              style={[styles.button, changingPassword && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={changingPassword}
              activeOpacity={0.8}
            >
              {changingPassword ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                    Updating Password...
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Update Password</Text>
              )}
            </TouchableOpacity>

            {/* Save All Changes Button */}
            <TouchableOpacity
              style={[
                styles.button,
                (saving || uploading) && styles.buttonDisabled,
              ]}
              onPress={handleSave}
              disabled={saving || uploading}
              activeOpacity={0.8}
            >
              {saving ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={[styles.buttonText, { marginLeft: 8 }]}>
                    Saving Changes...
                  </Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>
                  {uploading ? 'Uploading Image...' : 'Save All Changes'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modals */}
      {renderHeightSuggestions()}
      {renderWeightSuggestions()}
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
  },
  profileImageContainer: {
    alignItems: 'center',
    paddingBottom: 20,
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
    marginTop: 25,
    marginBottom: 15,
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
  buttonDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imagePicker: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3.84,
    elevation: 5,
  },
  profileImage: {
    width: 94,
    height: 94,
    borderRadius: 47,
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
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tertiary,
    marginBottom: 8,
    marginTop: 8,
  },
  genderContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.tertiary,
    backgroundColor: '#fff',
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: colors.tertiary,
    borderColor: colors.tertiary,
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tertiary,
  },
  genderButtonTextActive: {
    color: '#fff',
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  activityOptionActive: {
    borderColor: colors.tertiary,
    backgroundColor: colors.tertiary,
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.tertiary,
    marginBottom: 4,
  },
  activityLabelActive: {
    color: '#fff',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
  },
  activityDescriptionActive: {
    color: '#fff',
    opacity: 0.9,
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
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  suggestButton: {
    backgroundColor: colors.tertiary,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 15,
  },
  suggestionText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.tertiary,
    marginBottom: 20,
  },
  suggestionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
    justifyContent: 'center',
  },
  suggestionButton: {
    backgroundColor: colors.tertiary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80,
  },
  suggestionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalCloseButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  modalCloseText: {
    color: '#666',
    fontSize: 16,
  },
});

export default EditProfile;
