import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { auth, db } from '../../firebaseConfig';
import colors from '../config/colors';
import HomePageStyles from '../styles/HomePageStyles';

import foodImages from '@/assets/foodImages/foodImages';
import axios from 'axios';
import { BackendLink } from '../../components/Default';
import TopOnsModal from '../components/TopOnsModal';
import {
  getUserProfile,
  saveFoodHistory,
  uploadImageAsync,
} from '../../utils/firebaseFoodUtils';
import {
  PersonalizedDailyValues,
  updateNutrientBreakdownWithTopOns,
} from '../../utils/nutrientBreakdownUtils';
import { SelectedTopOn, sumTopOnsNutrition } from '../../utils/topOnsData';
import HomeInsights from './HomeInsights';
import NutriHeader from './NutriHeader';

const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const [food, setFood] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [active, setActive] = useState<'camera' | 'search'>('camera');
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [searchedFood, setSearchedFood] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const scanAnim = useRef(new Animated.Value(0)).current;

  // User profile and personalized daily values
  const [personalizedDailyValues, setPersonalizedDailyValues] = useState<
    PersonalizedDailyValues | undefined
  >(undefined);

  // Top-ons modal state
  const [showTopOnsModal, setShowTopOnsModal] = useState(false);
  const [selectedTopOns, setSelectedTopOns] = useState<SelectedTopOn[]>([]);
  const [pendingAnalysis, setPendingAnalysis] = useState<
    'image' | 'search' | null
  >(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfileImage(data.profileImage ?? null);
        }
      }
    });
    return unsubscribe;
  }, []);

  // Fetch user profile and calculate personalized daily values
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (auth.currentUser) {
        try {
          const userProfile = await getUserProfile(auth.currentUser.uid);
          if (
            userProfile &&
            userProfile.dailyCarbs &&
            userProfile.dailyProtein &&
            userProfile.dailyFat
          ) {
            setPersonalizedDailyValues({
              carbohydrates: userProfile.dailyCarbs,
              protein: userProfile.dailyProtein,
              fats: userProfile.dailyFat,
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          // Will use default values if profile fetch fails
        }
      }
    };

    fetchUserProfile();
  }, []);

  const handleTakePicture = async () => {
    if (hasPermission === null) return;
    if (hasPermission === false) {
      alert('Camera permission is required to take a picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const handleAnalyzeImage = async () => {
    if (!image || !auth.currentUser) return;

    // Show top-ons modal first
    setPendingAnalysis('image');
    setShowTopOnsModal(true);
  };

  const handleSearch = async () => {
    if (!food.trim()) return;

    // Show top-ons modal first
    setPendingAnalysis('search');
    setShowTopOnsModal(true);
  };

  // New function to handle the actual image analysis after top-ons selection
  const performImageAnalysis = async (topOns: SelectedTopOn[]) => {
    if (!image || !auth.currentUser) return;

    try {
      setIsScanning(true);
      startScanAnimation();

      // Guess the file extension and type
      const extension = image.split('.').pop()?.toLowerCase();
      let mimeType = 'image/jpeg';
      if (extension === 'png') mimeType = 'image/png';
      else if (extension === 'jpg' || extension === 'jpeg')
        mimeType = 'image/jpeg';

      // Prepare the image for upload
      const formData = new FormData();
      formData.append('file', {
        uri: image,
        name: `food.${extension || 'jpg'}`,
        type: mimeType,
      } as any);

      // Call your Flask backend for prediction
      const response = await axios.post(
        'http://10.132.34.185:5000/predict',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const { predicted_class } = response.data;

      // Upload image to Firebase Storage
      const imageUri = await uploadImageAsync(image, auth.currentUser.uid);

      // Fetch food details from backend
      const foodDetailsResponse = await axios.get(`${BackendLink}/search`, {
        params: { query: predicted_class },
      });
      const foodDetails = foodDetailsResponse.data;

      // Always preserve base nutrition values
      const baseCarbs = foodDetails.carbs || 0;
      const baseProtein = foodDetails.protein || 0;
      const baseFat = foodDetails.fat || 0;

      // Add top-ons nutrition to the food details
      if (topOns.length > 0) {
        const topOnsNutrition = sumTopOnsNutrition(topOns);

        // Ensure numeric conversion to prevent string concatenation
        const baseCalories = parseInt(foodDetails.numCalories) || 0;
        const topOnsCalories = topOnsNutrition.calories || 0;

        // Combine base food nutrition with top-ons
        foodDetails.numCalories = baseCalories + topOnsCalories;

        console.log('🔥 AI Analysis - Calories calculation:', {
          baseCalories,
          topOnsCalories,
          total: foodDetails.numCalories,
          topOnsDetails: topOns.map((t) => ({
            name: t.name,
            quantity: t.quantity,
            totalCal: t.totalCalories,
          })),
        });

        // Update nutrient breakdown with combined values using helper function
        if (foodDetails.nutrientBreakdown) {
          foodDetails.nutrientBreakdown = updateNutrientBreakdownWithTopOns(
            foodDetails.nutrientBreakdown,
            topOnsNutrition,
            personalizedDailyValues || undefined
          );
        }

        // Store the combined nutrition values for easy access during saving
        foodDetails.carbs = baseCarbs + topOnsNutrition.carbohydrates;
        foodDetails.protein = baseProtein + topOnsNutrition.protein;
        foodDetails.fat = baseFat + topOnsNutrition.fats;

        // Store selected top-ons for later reference
        foodDetails.selectedTopOns = topOns;
      } else {
        // No top-ons selected - preserve original base values
        foodDetails.carbs = baseCarbs;
        foodDetails.protein = baseProtein;
        foodDetails.fat = baseFat;
      }

      // Set the image URI in the searchedFood object (don't save automatically)
      foodDetails.imageUri = imageUri;
      foodDetails.capturedImage = image; // Store the original captured image
      setSearchedFood(foodDetails);
      setIsAnalyzed(true);
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('Failed to analyze image.');
    } finally {
      setIsScanning(false);
    }
  };

  // New function to handle the actual search after top-ons selection
  const performSearch = async (topOns: SelectedTopOn[]) => {
    if (!food.trim()) return;
    try {
      const response = await axios.get(`${BackendLink}/search`, {
        params: { query: food.trim() },
      });
      const foodDetails = response.data;

      console.log('🔍 DEBUG - Raw MongoDB response:', {
        name: foodDetails.name,
        rawCarbs: foodDetails.carbs,
        rawProtein: foodDetails.protein,
        rawFat: foodDetails.fat,
        rawCalories: foodDetails.numCalories,
        fullResponse: foodDetails,
      });

      // Always preserve base nutrition values
      const baseCarbs = foodDetails.carbs || 0;
      const baseProtein = foodDetails.protein || 0;
      const baseFat = foodDetails.fat || 0;

      console.log('🔍 DEBUG - Base nutrition from MongoDB:', {
        name: foodDetails.name,
        baseCarbs,
        baseProtein,
        baseFat,
        baseTypes: {
          carbsType: typeof foodDetails.carbs,
          proteinType: typeof foodDetails.protein,
          fatType: typeof foodDetails.fat,
        },
      });

      // Add top-ons nutrition to the food details
      if (topOns.length > 0) {
        const topOnsNutrition = sumTopOnsNutrition(topOns);

        // Ensure numeric conversion to prevent string concatenation
        const baseCalories = parseInt(foodDetails.numCalories) || 0;
        const topOnsCalories = topOnsNutrition.calories || 0;

        // Combine base food nutrition with top-ons
        foodDetails.numCalories = baseCalories + topOnsCalories;

        console.log('🔥 Manual Search - Calories calculation:', {
          baseCalories,
          topOnsCalories,
          total: foodDetails.numCalories,
          topOnsDetails: topOns.map((t) => ({
            name: t.name,
            quantity: t.quantity,
            totalCal: t.totalCalories,
          })),
        });

        // Update nutrient breakdown with combined values using helper function
        if (foodDetails.nutrientBreakdown) {
          foodDetails.nutrientBreakdown = updateNutrientBreakdownWithTopOns(
            foodDetails.nutrientBreakdown,
            topOnsNutrition,
            personalizedDailyValues || undefined
          );
        }

        // Store the combined nutrition values for easy access during saving
        foodDetails.carbs = baseCarbs + topOnsNutrition.carbohydrates;
        foodDetails.protein = baseProtein + topOnsNutrition.protein;
        foodDetails.fat = baseFat + topOnsNutrition.fats;

        // Store selected top-ons for later reference
        foodDetails.selectedTopOns = topOns;
      } else {
        // No top-ons selected - preserve original base values
        foodDetails.carbs = baseCarbs;
        foodDetails.protein = baseProtein;
        foodDetails.fat = baseFat;

        console.log('🔍 DEBUG - No top-ons selected, preserving base values:', {
          name: foodDetails.name,
          preservedCarbs: foodDetails.carbs,
          preservedProtein: foodDetails.protein,
          preservedFat: foodDetails.fat,
          originalBaseValues: { baseCarbs, baseProtein, baseFat },
          valueTypes: {
            carbsType: typeof foodDetails.carbs,
            proteinType: typeof foodDetails.protein,
            fatType: typeof foodDetails.fat,
          },
        });
      }

      // Don't save automatically - let user choose
      const foodKey = foodDetails.name?.toLowerCase().replace(/_/g, ' ').trim();
      const defaultImage = foodImages[foodKey] || null;

      // Store the default image for potential saving later
      foodDetails.defaultImage = defaultImage;

      setSearchedFood(foodDetails);
      setIsAnalyzed(true);
    } catch (error: any) {
      setSearchedFood(null);
      setIsAnalyzed(false);
      alert(
        error?.response?.data?.message || 'Food not found. Try another name.'
      );
    }
  };

  // Handle top-ons modal confirmation
  const handleTopOnsConfirm = async (topOns: SelectedTopOn[]) => {
    setSelectedTopOns(topOns);
    setShowTopOnsModal(false);

    // Perform the appropriate analysis based on pending type
    if (pendingAnalysis === 'image') {
      await performImageAnalysis(topOns);
    } else if (pendingAnalysis === 'search') {
      await performSearch(topOns);
    }

    setPendingAnalysis(null);
  };

  // Handle top-ons modal skip
  const handleTopOnsSkip = async () => {
    setSelectedTopOns([]);
    setShowTopOnsModal(false);

    // Perform the appropriate analysis without top-ons
    if (pendingAnalysis === 'image') {
      await performImageAnalysis([]);
    } else if (pendingAnalysis === 'search') {
      await performSearch([]);
    }

    setPendingAnalysis(null);
  };

  // Handle top-ons modal close
  const handleTopOnsClose = () => {
    setShowTopOnsModal(false);
    setPendingAnalysis(null);
  };

  const startScanAnimation = () => {
    scanAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  // Function to save food to history
  const handleSaveToHistory = async () => {
    if (!searchedFood || !auth.currentUser) return;

    try {
      setIsSaving(true);
      const imageToSave = searchedFood.imageUri || searchedFood.defaultImage;

      // Debug: Log the searchedFood values
      console.log('🔍 DEBUG - searchedFood before saving:', {
        name: searchedFood.name,
        numCalories: searchedFood.numCalories,
        carbs: searchedFood.carbs,
        protein: searchedFood.protein,
        fat: searchedFood.fat,
        hasSelectedTopOns: searchedFood.selectedTopOns
          ? searchedFood.selectedTopOns.length > 0
          : false,
        selectedTopOns: searchedFood.selectedTopOns || [],
      });

      // Prepare combined nutrition data that includes top-ons (or base values if no top-ons)
      const combinedNutrition = {
        calories: parseInt(searchedFood.numCalories) || 0,
        carbs: searchedFood.carbs || 0,
        protein: searchedFood.protein || 0,
        fat: searchedFood.fat || 0,
      };

      console.log('🔍 DEBUG - combinedNutrition to save:', combinedNutrition);
      console.log('🔍 DEBUG - Nutrition value types:', {
        carbsType: typeof searchedFood.carbs,
        proteinType: typeof searchedFood.protein,
        fatType: typeof searchedFood.fat,
        carbsValue: searchedFood.carbs,
        proteinValue: searchedFood.protein,
        fatValue: searchedFood.fat,
      });

      await saveFoodHistory({
        userId: auth.currentUser.uid,
        imageUri: imageToSave,
        foodName: searchedFood.name,
        calories: parseInt(searchedFood.numCalories) || 0,
        createdAt: new Date().toISOString(),
        portionMultiplier: searchedFood.portionMultiplier || 1,
        combinedNutrition, // Pass the combined nutrition data
      });

      alert('Food saved to your nutrition history!');

      // Reset to scan/search again
      setIsAnalyzed(false);
      setSearchedFood(null);
      setImage(null);
      setFood('');
    } catch (error) {
      console.error('Error saving food to history:', error);
      alert('Failed to save food to history. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to ignore and go back to scanning/searching
  const handleIgnoreFood = () => {
    setIsAnalyzed(false);
    setSearchedFood(null);
    setImage(null);
    setFood('');
    setSelectedTopOns([]); // Reset selected top-ons
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Status Bar Background */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: insets.top,
          backgroundColor: colors.secondary,
          zIndex: 1000,
        }}
      />
      <StatusBar style="dark" />
      <SafeAreaView style={HomePageStyles.safeContainer}>
        <NutriHeader profileImage={profileImage} />
        <ScrollView
          contentContainerStyle={HomePageStyles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={HomePageStyles.container}>
            <View style={HomePageStyles.content}>
              {/* SHOW camera/search UI ONLY when not analyzed */}
              {!isAnalyzed ? (
                <>
                  <Text style={HomePageStyles.question}>
                    Analyze your food for detailed nutritional insights
                  </Text>

                  <View style={HomePageStyles.toggleContainer}>
                    <TouchableOpacity
                      onPress={() => setActive('camera')}
                      style={[
                        HomePageStyles.toggleButton,
                        active === 'camera' && HomePageStyles.activeButton,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Feather
                        name="camera"
                        size={16}
                        color={active === 'camera' ? '#fff' : '#4CAF50'}
                      />
                      <Text
                        style={[
                          HomePageStyles.toggleText,
                          active === 'camera' &&
                            HomePageStyles.toggleTextActive,
                        ]}
                      >
                        Camera
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setActive('search')}
                      style={[
                        HomePageStyles.toggleButton,
                        active === 'search' && HomePageStyles.activeButton,
                      ]}
                      activeOpacity={0.8}
                    >
                      <Feather
                        name="search"
                        size={16}
                        color={active === 'search' ? '#fff' : '#4CAF50'}
                      />
                      <Text
                        style={[
                          HomePageStyles.toggleText,
                          active === 'search' &&
                            HomePageStyles.toggleTextActive,
                        ]}
                      >
                        Search
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Camera UI */}
                  {active === 'camera' && (
                    <>
                      {!image ? (
                        <View style={HomePageStyles.cameraContainer}>
                          <View style={HomePageStyles.cameraSection}>
                            <Feather
                              name="camera"
                              size={40}
                              color="#4CAF50"
                              style={HomePageStyles.topIcon}
                            />
                            <Text style={HomePageStyles.descriptionText}>
                              Capture your food to analyze its nutritional
                              content with AI
                            </Text>
                          </View>

                          <View style={HomePageStyles.cameraActionContainer}>
                            <TouchableOpacity
                              style={HomePageStyles.primaryCameraButton}
                              onPress={handleTakePicture}
                              activeOpacity={0.8}
                            >
                              <Feather name="camera" size={24} color="#fff" />
                              <Text style={HomePageStyles.primaryButtonText}>
                                Take Photo
                              </Text>
                            </TouchableOpacity>

                            <View style={HomePageStyles.dividerContainer}>
                              <View style={HomePageStyles.dividerLine} />
                              <Text style={HomePageStyles.dividerText}>or</Text>
                              <View style={HomePageStyles.dividerLine} />
                            </View>

                            <TouchableOpacity
                              style={HomePageStyles.secondaryCameraButton}
                              onPress={handlePickImage}
                              activeOpacity={0.8}
                            >
                              <Feather name="image" size={20} color="#4CAF50" />
                              <Text style={HomePageStyles.secondaryButtonText}>
                                Choose from Gallery
                              </Text>
                            </TouchableOpacity>
                          </View>

                          <View style={HomePageStyles.cameraHintContainer}>
                            <Text style={HomePageStyles.cameraHintTitle}>
                              Tips for best results:
                            </Text>
                            <View style={HomePageStyles.cameraHints}>
                              <Text style={HomePageStyles.cameraHintText}>
                                • Good lighting
                              </Text>
                              <Text style={HomePageStyles.cameraHintText}>
                                • Clear view of food
                              </Text>
                              <Text style={HomePageStyles.cameraHintText}>
                                • Close-up shots work best
                              </Text>
                            </View>
                          </View>
                        </View>
                      ) : (
                        <View style={HomePageStyles.imagePreviewContainer}>
                          <View style={HomePageStyles.imageWrapper}>
                            <Image
                              source={{ uri: image }}
                              style={HomePageStyles.capturedImage}
                            />

                            {/* 🔄 Scanning effect overlay */}
                            {isScanning && (
                              <Animated.View
                                style={[
                                  HomePageStyles.scanOverlay,
                                  {
                                    transform: [
                                      {
                                        translateY: scanAnim.interpolate({
                                          inputRange: [0, 1],
                                          outputRange: [0, 290],
                                        }),
                                      },
                                    ],
                                  },
                                ]}
                              />
                            )}

                            {/* Only show close button when not scanning */}
                            {!isScanning && (
                              <TouchableOpacity
                                style={HomePageStyles.closeButton}
                                onPress={() => setImage(null)}
                                activeOpacity={0.7}
                              >
                                <Feather name="x" size={24} color="#fff" />
                              </TouchableOpacity>
                            )}
                          </View>

                          <TouchableOpacity
                            style={[
                              HomePageStyles.analyzeButton,
                              isScanning && HomePageStyles.disabledButton,
                            ]}
                            onPress={handleAnalyzeImage}
                            activeOpacity={0.8}
                            disabled={isScanning}
                          >
                            <Text style={HomePageStyles.buttonText}>
                              {isScanning
                                ? 'Analyzing...'
                                : selectedTopOns.length > 0
                                ? `Analyze with ${
                                    selectedTopOns.length
                                  } protein${
                                    selectedTopOns.length > 1 ? 's' : ''
                                  }`
                                : 'Select Proteins & Analyze'}
                            </Text>
                          </TouchableOpacity>

                          {/* Show selected top-ons summary */}
                          {selectedTopOns.length > 0 && (
                            <View style={topOnsSummaryStyles.container}>
                              <Text style={topOnsSummaryStyles.title}>
                                Selected Proteins:
                              </Text>
                              <Text style={topOnsSummaryStyles.items}>
                                {selectedTopOns
                                  .map(
                                    (topOn) =>
                                      `${topOn.quantity}x ${topOn.name}`
                                  )
                                  .join(', ')}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </>
                  )}

                  {/* Search UI */}
                  {active === 'search' && (
                    <View style={HomePageStyles.searchContainer}>
                      <View style={HomePageStyles.searchSection}>
                        <Feather
                          name="search"
                          size={40}
                          color="#4CAF50"
                          style={HomePageStyles.topIcon}
                        />
                        <Text style={HomePageStyles.descriptionText}>
                          Search for your food by name to get detailed
                          nutritional information
                        </Text>
                      </View>

                      <View style={HomePageStyles.inputWrapper}>
                        <Feather
                          name="search"
                          size={20}
                          color="#999"
                          style={HomePageStyles.searchIcon}
                        />
                        <TextInput
                          style={HomePageStyles.input}
                          placeholder="Type food name..."
                          value={food}
                          onChangeText={setFood}
                          placeholderTextColor="#999"
                          returnKeyType="search"
                          onSubmitEditing={handleSearch}
                        />
                        {food.trim() !== '' && (
                          <TouchableOpacity
                            onPress={() => setFood('')}
                            style={HomePageStyles.clearButton}
                            activeOpacity={0.7}
                          >
                            <Feather name="x" size={18} color="#999" />
                          </TouchableOpacity>
                        )}
                      </View>

                      <TouchableOpacity
                        onPress={handleSearch}
                        style={[
                          HomePageStyles.searchButton,
                          food.trim() === '' &&
                            HomePageStyles.disabledSearchButton,
                        ]}
                        activeOpacity={0.8}
                        disabled={food.trim() === ''}
                      >
                        <Feather name="search" size={20} color="#fff" />
                        <Text style={HomePageStyles.searchButtonText}>
                          {selectedTopOns.length > 0
                            ? `Search with ${selectedTopOns.length} protein${
                                selectedTopOns.length > 1 ? 's' : ''
                              }`
                            : 'Select Proteins & Search'}
                        </Text>
                      </TouchableOpacity>

                      {/* Show selected top-ons summary */}
                      {selectedTopOns.length > 0 && (
                        <View style={topOnsSummaryStyles.container}>
                          <Text style={topOnsSummaryStyles.title}>
                            Selected Proteins:
                          </Text>
                          <Text style={topOnsSummaryStyles.items}>
                            {selectedTopOns
                              .map(
                                (topOn) => `${topOn.quantity}x ${topOn.name}`
                              )
                              .join(', ')}
                          </Text>
                        </View>
                      )}

                      <View style={HomePageStyles.suggestionContainer}>
                        <Text style={HomePageStyles.suggestionTitle}>
                          Popular searches:
                        </Text>
                        <View style={HomePageStyles.suggestionTags}>
                          {[
                            'waakye',
                            'fufu',
                            'banku',
                            'jollof rice',
                            'kelewele',
                          ].map((suggestion) => (
                            <TouchableOpacity
                              key={suggestion}
                              style={HomePageStyles.suggestionTag}
                              onPress={() => setFood(suggestion)}
                              activeOpacity={0.7}
                            >
                              <Text style={HomePageStyles.suggestionTagText}>
                                {suggestion}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                  )}
                </>
              ) : (
                searchedFood && (
                  <>
                    <HomeInsights
                      foodName={searchedFood.name}
                      numCalories={searchedFood.numCalories}
                      imageSource={searchedFood.imageUri}
                      digestionTime={searchedFood.digestionTime}
                      timeToEat={searchedFood.timeToEat}
                      digestionComplexity={searchedFood.digestionComplexity}
                      additionalDigestionNotes={
                        searchedFood.additionalDigestionNotes
                      }
                      nutrientBreakdown={searchedFood.nutrientBreakdown}
                      benefits={searchedFood.benefits}
                      cautions={searchedFood.cautions}
                      onBack={() => {
                        setIsAnalyzed(false);
                        setSearchedFood(null);
                        setImage(null);
                      }}
                    />

                    {/* Action Buttons */}
                    <View style={actionButtonStyles.container}>
                      <TouchableOpacity
                        style={actionButtonStyles.saveButton}
                        onPress={handleSaveToHistory}
                        activeOpacity={0.8}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <ActivityIndicator size="small" color="#fff" />
                            <Text style={actionButtonStyles.saveButtonText}>
                              Adding calories...
                            </Text>
                          </>
                        ) : (
                          <>
                            <Feather
                              name="plus-circle"
                              size={20}
                              color="#fff"
                            />
                            <Text style={actionButtonStyles.saveButtonText}>
                              Add to track my calories
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={actionButtonStyles.ignoreButton}
                        onPress={handleIgnoreFood}
                        activeOpacity={0.8}
                      >
                        <Feather name="x-circle" size={20} color="#666" />
                        <Text style={actionButtonStyles.ignoreButtonText}>
                          Skip & Scan Again
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )
              )}
            </View>
          </View>
        </ScrollView>

        {/* Top-ons Modal */}
        <TopOnsModal
          visible={showTopOnsModal}
          onClose={handleTopOnsClose}
          onConfirm={handleTopOnsConfirm}
          onSkip={handleTopOnsSkip}
        />
      </SafeAreaView>
    </View>
  );
};

const topOnsSummaryStyles = {
  container: {
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    marginBottom: 20, // Added bottom margin for spacing
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  title: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#4CAF50',
    marginBottom: 4,
  },
  items: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
  },
};

const actionButtonStyles = {
  container: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 8, // Reduced to push buttons to edges
    paddingVertical: 12, // Reduced from 20 to 12
    paddingBottom: 20, // Keep bottom padding for safe area
    gap: 16, // Increased gap between buttons
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  ignoreButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  ignoreButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600' as const,
  },
};

export default HomeScreen;
