import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import HomePageStyles from '../styles/HomePageStyles';
import { auth, db } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Animated, Easing } from 'react-native';
import NutriHeader from './NutriHeader';
import HomeInsights from './HomeInsights';
import { uploadImageAsync, saveFoodHistory } from '../utils/firebaseFoodUtils';
import axios from 'axios';
import { BackendLink } from '@/components/Default';
import foodImages from '@/assets/foodImages/foodImages';

const HomeScreen = () => {
  const navigation = useNavigation();
  const [food, setFood] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [active, setActive] = useState<'camera' | 'search'>('camera');
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<{
    predicted_class: string;
    confidence: number;
  } | null>(null);
  const [searchedFood, setSearchedFood] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scanAnim = useRef(new Animated.Value(0)).current;

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
      const responseBlob = await fetch(image);
      const blob = await responseBlob.blob();
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

      const { predicted_class, confidence } = response.data;

      // Upload image to Firebase Storage
      const imageUri = await uploadImageAsync(image, auth.currentUser.uid);

      // Fetch food details from backend
      const foodDetailsResponse = await axios.get(`${BackendLink}/search`, {
        params: { query: predicted_class },
      });
      const foodDetails = foodDetailsResponse.data;

      // Set the image URI in the searchedFood object (don't save automatically)
      foodDetails.imageUri = imageUri;
      foodDetails.capturedImage = image; // Store the original captured image
      setSearchedFood(foodDetails);
      setIsAnalyzed(true);
      setAiResult({ predicted_class, confidence });
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('Failed to analyze image.');
    } finally {
      setIsScanning(false);
    }
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

  const handleSearch = async () => {
    if (!food.trim()) return;
    try {
      const response = await axios.get(`${BackendLink}/search`, {
        params: { query: food.trim() },
      });
      const foodDetails = response.data;

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

  // Function to save food to history
  const handleSaveToHistory = async () => {
    if (!searchedFood || !auth.currentUser) return;

    try {
      const imageToSave = searchedFood.imageUri || searchedFood.defaultImage;

      await saveFoodHistory({
        userId: auth.currentUser.uid,
        imageUri: imageToSave,
        foodName: searchedFood.name,
        calories: searchedFood.numCalories,
        createdAt: new Date().toISOString(),
        portionMultiplier: searchedFood.portionMultiplier || 1,
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
    }
  };

  // Function to ignore and go back to scanning/searching
  const handleIgnoreFood = () => {
    setIsAnalyzed(false);
    setSearchedFood(null);
    setImage(null);
    setFood('');
  };

  return (
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
                        active === 'camera' && HomePageStyles.toggleTextActive,
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
                        active === 'search' && HomePageStyles.toggleTextActive,
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
                      <View style={HomePageStyles.outerContainer}>
                        <View style={HomePageStyles.innerContainer}>
                          <Feather
                            name="image"
                            size={40}
                            color="#4CAF50"
                            style={HomePageStyles.topIcon}
                          />
                          <Text style={HomePageStyles.descriptionText}>
                            Take a photo of your food to analyze its nutritional
                            content
                          </Text>

                          <TouchableOpacity
                            style={HomePageStyles.cameraButton}
                            onPress={handleTakePicture}
                            activeOpacity={0.8}
                          >
                            <Feather name="camera" size={24} color="#fff" />
                            <Text style={HomePageStyles.buttonText}>
                              Take Photo
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={HomePageStyles.uploadButton}
                            onPress={handlePickImage}
                            activeOpacity={0.8}
                          >
                            <Text style={HomePageStyles.uploadButtonText}>
                              Upload from Gallery
                            </Text>
                          </TouchableOpacity>
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
                          style={HomePageStyles.analyzeButton}
                          onPress={handleAnalyzeImage}
                          activeOpacity={0.8}
                        >
                          <Text style={HomePageStyles.buttonText}>Analyze</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </>
                )}

                {/* Search UI */}
                {active === 'search' && (
                  <View style={HomePageStyles.searchContainer}>
                    <View style={HomePageStyles.inputWrapper}>
                      <TextInput
                        style={HomePageStyles.input}
                        placeholder="Search for food"
                        value={food}
                        onChangeText={setFood}
                        placeholderTextColor="#999"
                      />
                      <TouchableOpacity
                        onPress={handleSearch}
                        style={[
                          HomePageStyles.searchIconButton,
                          food.trim() === '' &&
                            HomePageStyles.disabledSearchButton,
                        ]}
                        activeOpacity={0.8}
                        disabled={food.trim() === ''}
                      >
                        <Feather name="search" size={18} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <Text style={HomePageStyles.suggestionText}>
                      Try searching for: waakye, fufu, banku...
                    </Text>
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
                    >
                      <Feather name="plus-circle" size={20} color="#fff" />
                      <Text style={actionButtonStyles.saveButtonText}>
                        Add to track my calories
                      </Text>
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
    </SafeAreaView>
  );
};

const actionButtonStyles = {
  container: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 8, // Reduced to push buttons to edges
    paddingVertical: 20,
    paddingBottom: 20, // Reduced bottom padding
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
