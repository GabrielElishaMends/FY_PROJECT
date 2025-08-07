import React, { useEffect, useState } from 'react';
import { View, Text, ImageBackground } from 'react-native';
import { Feather, AntDesign, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import HomeInsightsStyles from '../styles/HomeInsightsStyles';

import colors from '../config/colors';
import foodImages from '../../assets/foodImages/foodImages';

interface HomeInsightsProps {
  foodName?: string;
  numCalories?: string | number; // Accept both string and number for flexibility
  imageSource?: string | number;
  digestionTime?: string;
  timeToEat?: string;
  digestionComplexity?: string;
  additionalDigestionNotes?: string;
  benefits?: Array<{ title: string; info: string }>;
  cautions?: Array<{ title: string; info: string }>;
  nutrientBreakdown?: Array<{
    nutrient?: string;
    label?: string;
    info?: string;
    value?: string;
    percentDailyValue?: number;
    width?: string;
    color?: string;
  }>;
  onBack: () => void;
}

const HomeInsights: React.FC<HomeInsightsProps> = ({
  foodName,
  imageSource,
  numCalories,
  digestionTime,
  timeToEat,
  digestionComplexity,
  additionalDigestionNotes,
  benefits,
  cautions,
  nutrientBreakdown,
  onBack,
}) => {
  const [useFallback, setUseFallback] = useState(false);

  // Function to get the source object for the Image component
  const getActualImageSource = () => {
    // If we've decided to use fallback, stick with it
    if (useFallback) {
      return getFoodNameImage();
    }

    // Check if imageSource is provided
    if (imageSource) {
      if (typeof imageSource === 'string') {
        // Check if it's a Firebase Storage URL, HTTP URL, or file URI
        if (
          imageSource.startsWith('http') ||
          imageSource.startsWith('https') ||
          imageSource.startsWith('gs://') ||
          imageSource.startsWith('file://') ||
          imageSource.includes('firebase') ||
          imageSource.includes('googleapis')
        ) {
          return { uri: imageSource };
        }
        // Check if it's a local path reference
        else if (
          imageSource.startsWith('/') ||
          imageSource.includes('assets')
        ) {
          return { uri: imageSource };
        }
      } else if (typeof imageSource === 'number') {
        return imageSource;
      }
    }

    // If imageSource is not valid, fall back to food name
    setUseFallback(true);
    return getFoodNameImage();
  };

  // Separate function to get image based on food name
  const getFoodNameImage = () => {
    if (foodName) {
      const foodNameKey = foodName.toLowerCase().replace(/_/g, ' ').trim();

      if (foodImages[foodNameKey]) {
        return foodImages[foodNameKey];
      }
    }

    // Final fallback
    return require('../../assets/foodImages/unknown_food.jpg');
  };

  const handleImageError = () => {
    // Immediately switch to fallback on first error
    setUseFallback(true);
  };

  const handleImageLoad = () => {
    // Do nothing - just let it load
  };

  // Reset fallback state only when imageSource changes to a different source
  useEffect(() => {
    if (imageSource && typeof imageSource === 'number') {
      // If it's a local asset number, reset fallback
      setUseFallback(false);
    }
    // For Firebase URLs, don't reset - let them fail once and stick to fallback
  }, [imageSource]);

  const renderDigestiveInsight = () => (
    <View style={HomeInsightsStyles.insightCard}>
      <View style={HomeInsightsStyles.insightHeader}>
        <Ionicons name="book-outline" size={24} color={colors.deepSkyBlue} />
        <Text style={HomeInsightsStyles.insightTitle}>Digestive Insight</Text>
      </View>
      <Text style={HomeInsightsStyles.insightSubtitle}>
        How {foodName?.toLowerCase()} affects your digestive system
      </Text>

      <View style={HomeInsightsStyles.infoRow}>
        <View style={HomeInsightsStyles.infoIcon}>
          <Feather name="clock" size={20} color={colors.deepSkyBlue} />
        </View>
        <View>
          <Text style={HomeInsightsStyles.infoLabel}>Digestive Time</Text>
          <Text style={HomeInsightsStyles.infoValue}>
            {digestionTime} hours
          </Text>
        </View>
      </View>

      <View style={HomeInsightsStyles.infoRow}>
        <View style={HomeInsightsStyles.infoIcon}>
          <Feather name="clock" size={20} color={colors.deepSkyBlue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={HomeInsightsStyles.infoLabel}>Best Time to Eat</Text>
          <Text style={HomeInsightsStyles.infoValue}>{timeToEat}</Text>
        </View>
      </View>

      <Text style={HomeInsightsStyles.complexityLabel}>
        Digestive Complexity:{' '}
        <Text style={HomeInsightsStyles.complexityValue}>
          {digestionComplexity}
        </Text>
      </Text>
      <Text style={HomeInsightsStyles.descriptionText}>
        {additionalDigestionNotes}
      </Text>
    </View>
  );

  const renderHealthInsight = () => (
    <View
      style={[HomeInsightsStyles.insightCard, { backgroundColor: '#ffecb3' }]}
    >
      <View style={HomeInsightsStyles.insightHeader}>
        <AntDesign name="hearto" size={24} color="#F44336" />
        <Text style={HomeInsightsStyles.insightTitle}>Health Benefits</Text>
      </View>
      <Text style={HomeInsightsStyles.insightSubtitle}>
        Health benefits and cautions for {foodName}
      </Text>

      <View style={HomeInsightsStyles.benefitsContainer}>
        <Text style={HomeInsightsStyles.sectionTitle}>
          <AntDesign name="like1" size={18} color="green" /> Benefits
        </Text>
        {(benefits && benefits.length > 0
          ? benefits
          : [{ title: 'No benefits listed', info: '' }]
        ).map((benefit, index) => (
          <View style={HomeInsightsStyles.bulletPoint} key={index}>
            <Text style={HomeInsightsStyles.benefitsBullet}>•</Text>
            <Text style={HomeInsightsStyles.bulletText}>
              <Text style={{ fontWeight: 'bold' }}>{benefit.title}</Text>
              {benefit.info ? `: ${benefit.info}` : ''}
            </Text>
          </View>
        ))}
      </View>

      <View style={HomeInsightsStyles.cautionsContainer}>
        <Text style={HomeInsightsStyles.sectionTitle}>
          <AntDesign name="dislike1" size={18} color="#F44336" /> Cautions
        </Text>
        {(cautions && cautions.length > 0
          ? cautions
          : [{ title: 'No cautions listed', info: '' }]
        ).map((caution, index) => (
          <View style={HomeInsightsStyles.bulletPoint} key={index}>
            <Text style={HomeInsightsStyles.cautionsBullet}>•</Text>
            <Text style={HomeInsightsStyles.bulletText}>
              <Text style={{ fontWeight: 'bold' }}>{caution.title}</Text>
              {caution.info ? `: ${caution.info}` : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderNutrientInsight = () => {
    const nutrientData =
      nutrientBreakdown && nutrientBreakdown.length > 0
        ? nutrientBreakdown
        : [];

    return (
      <View style={HomeInsightsStyles.nutrientInsightCard}>
        <Text style={HomeInsightsStyles.nutrientTitle}>Nutrient Breakdown</Text>
        <Text style={HomeInsightsStyles.insightSubtitle}>
          Details of key nutrients and their percentage of daily needs
        </Text>

        {nutrientData.map((item, index) => {
          // Support both old and new formats
          const label = item.nutrient || item.label;
          const value = item.info || item.value;
          const width = item.percentDailyValue?.toString() || item.width || '0';
          const color = item.color || '#4cae4f'; // Use color from backend or default green

          return (
            <View style={HomeInsightsStyles.nutrientRow} key={index}>
              <View style={HomeInsightsStyles.nutrientHeader}>
                <Text style={HomeInsightsStyles.nutrientLabel}>{label}</Text>
                <Text style={HomeInsightsStyles.nutrientValue}>{value}</Text>
              </View>
              <View
                style={[
                  HomeInsightsStyles.nutrientBarBackground,
                  { backgroundColor: color }, // Background uses backend color
                ]}
              >
                <View
                  style={[
                    HomeInsightsStyles.nutrientBarFill,
                    { width: `${width}%`, backgroundColor: '#4cae4f' }, // Fill bar uses consistent green
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={HomeInsightsStyles.container}>
      <ImageBackground
        key={useFallback ? 'fallback' : imageSource}
        source={getActualImageSource()}
        style={HomeInsightsStyles.headerImage}
        imageStyle={HomeInsightsStyles.headerImageStyle}
        onError={handleImageError}
        onLoad={handleImageLoad}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={HomeInsightsStyles.gradientOverlay}
        >
          <Text style={HomeInsightsStyles.foodName}>{foodName}</Text>
          <Text style={HomeInsightsStyles.foodCalories}>
            {typeof numCalories === 'number'
              ? numCalories
              : parseInt(numCalories || '0')}{' '}
            kcal per serving
          </Text>
        </LinearGradient>
      </ImageBackground>

      <View style={HomeInsightsStyles.insightsContainer}>
        {renderDigestiveInsight()}
        {renderHealthInsight()}
        {renderNutrientInsight()}
      </View>
    </View>
  );
};

export default HomeInsights;
