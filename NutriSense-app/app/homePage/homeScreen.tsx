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
      });

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

      // Save to Firestore
      await saveFoodHistory({
        userId: auth.currentUser.uid,
        imageUri: imageUri,
        foodName: foodDetails.name,
        calories: foodDetails.numCalories,
        createdAt: new Date().toISOString(), // Add timestamp
      });

      // Set the image URI in the searchedFood object
      foodDetails.imageUri = imageUri;
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
      setSearchedFood(response.data);
      setIsAnalyzed(true);

      if (auth.currentUser) {
        const foodKey = response.data.name
          ?.toLowerCase()
          .replace(/_/g, ' ')
          .trim();
        const defaultImage = foodImages[foodKey] || null;

        await saveFoodHistory({
          userId: auth.currentUser.uid,
          imageUri: defaultImage,
          foodName: response.data.name,
          calories: response.data.numCalories,
          createdAt: new Date().toISOString(), // Add timestamp
        });
      }
    } catch (error: any) {
      setSearchedFood(null);
      setIsAnalyzed(false);
      alert(
        error?.response?.data?.message || 'Food not found. Try another name.'
      );
    }
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
                    <Feather name="camera" size={16} color="#000" />
                    <Text style={HomePageStyles.toggleText}>Camera</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActive('search')}
                    style={[
                      HomePageStyles.toggleButton,
                      active === 'search' && HomePageStyles.activeButton,
                    ]}
                    activeOpacity={0.8}
                  >
                    <Feather name="search" size={16} color="#000" />
                    <Text style={HomePageStyles.toggleText}>Search</Text>
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

                          <TouchableOpacity
                            style={HomePageStyles.closeButton}
                            onPress={() => setImage(null)}
                            activeOpacity={0.7}
                          >
                            <Feather name="x" size={24} color="#fff" />
                          </TouchableOpacity>
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
                </>
              )
            )}
          </View>
        </View>
      </ScrollView>

      {/* Fixed FAB - only show when insights are displayed */}
      {isAnalyzed && searchedFood && (
        <TouchableOpacity
          style={fabStyles.fab}
          onPress={() => {
            setIsAnalyzed(false);
            setSearchedFood(null);
            setImage(null);
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const fabStyles = {
  fab: {
    position: 'absolute' as const,
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 9999,
  },
};

export default HomeScreen;
