import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import colors from '../config/colors';
import { auth } from '../../firebaseConfig';
import {
  UserHealthInfo,
  calculateDailyCalories,
  calculateMacronutrients,
  getHeightSuggestions,
  getWeightSuggestions,
} from '../utils/calculateCalories';
import { saveUserProfile } from '../utils/firebaseFoodUtils';

const UserInfoScreen = () => {
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
  const [loading, setLoading] = useState(false);
  const [showHeightModal, setShowHeightModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);

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

  const validateInputs = () => {
    if (!age || !gender || !height || !weight || !activityLevel) {
      Alert.alert('Error', 'All fields are required.');
      return false;
    }

    const ageNum = parseInt(age);
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);

    if (ageNum < 1 || ageNum > 120) {
      Alert.alert('Error', 'Please enter a valid age (1-120 years).');
      return false;
    }

    if (heightNum < 50 || heightNum > 250) {
      Alert.alert('Error', 'Please enter a valid height (50-250 cm).');
      return false;
    }

    if (weightNum < 10 || weightNum > 300) {
      Alert.alert('Error', 'Please enter a valid weight (10-300 kg).');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateInputs()) return;

    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Error', 'No authenticated user found.');
      return;
    }

    setLoading(true);
    try {
      const userHealthInfo: UserHealthInfo = {
        age: parseInt(age),
        gender: gender as 'male' | 'female',
        height: parseFloat(height),
        weight: parseFloat(weight),
        activityLevel: activityLevel as UserHealthInfo['activityLevel'],
      };

      // Calculate daily calories
      const dailyCalories = calculateDailyCalories(userHealthInfo);

      // Calculate macronutrients
      const nutritionNeeds = calculateMacronutrients(dailyCalories);

      // Save to Firebase
      await saveUserProfile(user.uid, {
        age: userHealthInfo.age,
        gender: userHealthInfo.gender,
        height: userHealthInfo.height,
        weight: userHealthInfo.weight,
        activityLevel: userHealthInfo.activityLevel,
        dailyCalories: nutritionNeeds.dailyCalories,
        dailyCarbs: nutritionNeeds.dailyCarbs,
        dailyProtein: nutritionNeeds.dailyProtein,
        dailyFat: nutritionNeeds.dailyFat,
      });

      Alert.alert(
        'Success!',
        `Your daily nutrition needs have been calculated:\n\n• Calories: ${nutritionNeeds.dailyCalories} kcal\n• Carbs: ${nutritionNeeds.dailyCarbs}g\n• Protein: ${nutritionNeeds.dailyProtein}g\n• Fat: ${nutritionNeeds.dailyFat}g`,
        [
          {
            text: 'Continue',
            onPress: () => router.push('/(tabs)/dashboard'),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving user info:', error);
      Alert.alert(
        'Error',
        'Failed to save your information. Please try again.'
      );
    } finally {
      setLoading(false);
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
              Typical range for{' '}
              {ageNum < 13 ? 'children' : ageNum < 18 ? 'teens' : 'adults'}:
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
                    ((suggestions.min + suggestions.max) / 2).toString()
                  );
                  setShowHeightModal(false);
                }}
              >
                <Text style={styles.suggestionButtonText}>Use Average</Text>
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
              Typical range for{' '}
              {ageNum < 13 ? 'children' : ageNum < 18 ? 'teens' : 'adults'}:
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
                    ((suggestions.min + suggestions.max) / 2).toString()
                  );
                  setShowWeightModal(false);
                }}
              >
                <Text style={styles.suggestionButtonText}>Use Average</Text>
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
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Health Information</Text>
          </View>

          <Text style={styles.subtitle}>
            Help us calculate your daily nutrition needs
          </Text>

          {/* Form Fields */}
          <View style={styles.form}>
            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age *</Text>
              <TextInput
                style={styles.input}
                value={age}
                onChangeText={setAge}
                placeholder="Enter your age"
                keyboardType="numeric"
                maxLength={3}
              />
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderContainer}>
                <TouchableOpacity
                  style={[
                    styles.genderButton,
                    gender === 'male' && styles.genderButtonActive,
                  ]}
                  onPress={() => setGender('male')}
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
            </View>

            {/* Height */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Height (cm) *</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="Enter height in cm"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.suggestButton}
                  onPress={() => setShowHeightModal(true)}
                  disabled={!age}
                >
                  <Text style={styles.suggestButtonText}>?</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Weight */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Weight (kg) *</Text>
              <View style={styles.inputWithButton}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="Enter weight in kg"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.suggestButton}
                  onPress={() => setShowWeightModal(true)}
                  disabled={!age}
                >
                  <Text style={styles.suggestButtonText}>?</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Activity Level */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Activity Level *</Text>
              {activityOptions.map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.activityOption,
                    activityLevel === option.key && styles.activityOptionActive,
                  ]}
                  onPress={() => setActivityLevel(option.key as any)}
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
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Calculating...' : 'Calculate My Nutrition Needs'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderHeightSuggestions()}
      {renderWeightSuggestions()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    marginBottom: 10,
  },
  backButton: {
    marginRight: 15,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputWithButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
  genderContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.tertiary,
    backgroundColor: '#fff',
    gap: 8,
  },
  genderButtonActive: {
    backgroundColor: colors.tertiary,
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
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  activityOptionActive: {
    backgroundColor: colors.tertiary,
    borderColor: colors.tertiary,
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  activityLabelActive: {
    color: '#fff',
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  activityDescriptionActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  submitButton: {
    backgroundColor: colors.tertiary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
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
    gap: 10,
    marginBottom: 15,
  },
  suggestionButton: {
    backgroundColor: colors.tertiary,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  suggestionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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

export default UserInfoScreen;
