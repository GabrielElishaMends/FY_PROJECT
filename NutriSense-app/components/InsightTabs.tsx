import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons, AntDesign, Feather } from '@expo/vector-icons';
import InsightPageStyle from '@/app/styles/InsightPageStyles';
import colors from '@/app/config/colors';

type NutrientItem = {
  label: string;
  value: string;
  width: string;
  color: string;
};

export const renderDigestiveTab = ({
  foodName,
  digestionTime,
  timeToEat,
  digestionComplexity,
  additionalDigestionNotes,
}) => (
  <View style={InsightPageStyle.tabContent}>
    <View style={InsightPageStyle.insightCard}>
      <View style={InsightPageStyle.insightHeader}>
        <Ionicons name="book-outline" size={24} color={colors.deepSkyBlue} />
        <Text style={InsightPageStyle.insightTitle}>Digestive Insight</Text>
      </View>
      <Text style={InsightPageStyle.insightSubtitle}>
        How {foodName.charAt(0).toLowerCase() + foodName.slice(1)} affects your
        digestive system
      </Text>

      <View style={InsightPageStyle.infoRow}>
        <View style={InsightPageStyle.infoIcon}>
          <Feather name="clock" size={20} color={colors.deepSkyBlue} />
        </View>
        <View>
          <Text style={InsightPageStyle.infoLabel}>Digestive Time</Text>
          <Text style={InsightPageStyle.infoValue}>{digestionTime} hours</Text>
        </View>
      </View>

      <View style={InsightPageStyle.infoRow}>
        <View style={InsightPageStyle.infoIcon}>
          <Feather name="clock" size={20} color={colors.deepSkyBlue} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={InsightPageStyle.infoLabel}>Best Time to Eat</Text>
          <Text style={InsightPageStyle.infoValue}>{timeToEat}</Text>
        </View>
      </View>

      <Text style={InsightPageStyle.complexityLabel}>
        Digestive Complexity:{' '}
        <Text style={InsightPageStyle.complexityValue}>
          {digestionComplexity}
        </Text>
      </Text>
      <Text style={InsightPageStyle.descriptionText}>
        {additionalDigestionNotes}
      </Text>
    </View>
  </View>
);

export const renderHealthTab = ({ foodName, benefits = [], cautions = [] }) => (
  <View style={InsightPageStyle.tabContent}>
    <View
      style={[InsightPageStyle.insightCard, { backgroundColor: '#ffecb3' }]}
    >
      <View style={InsightPageStyle.insightHeader}>
        <AntDesign name="hearto" size={24} color="#F44336" />
        <Text style={InsightPageStyle.insightTitle}>Health Benefits</Text>
      </View>
      <Text style={InsightPageStyle.insightSubtitle}>
        Health benefits and cautions for {foodName}
      </Text>

      <View style={InsightPageStyle.benefitsContainer}>
        <Text style={InsightPageStyle.sectionTitle}>
          <AntDesign name="like1" size={18} color="green" /> Benefits
        </Text>
        {benefits.length > 0 ? (
          benefits.map((item, index) => (
            <View style={InsightPageStyle.bulletPoint} key={index}>
              <Text style={InsightPageStyle.benefitsBullet}>•</Text>
              <Text style={InsightPageStyle.bulletText}>
                <Text style={{ fontWeight: 'bold' }}>{item.title}: </Text>
                {item.info}
              </Text>
            </View>
          ))
        ) : (
          <Text style={InsightPageStyle.bulletText}>No benefits listed.</Text>
        )}
      </View>

      <View style={InsightPageStyle.cautionsContainer}>
        <Text style={InsightPageStyle.sectionTitle}>
          <AntDesign name="dislike1" size={18} color="#F44336" /> Cautions
        </Text>
        {cautions.length > 0 ? (
          cautions.map((item, index) => (
            <View style={InsightPageStyle.bulletPoint} key={index}>
              <Text style={InsightPageStyle.cautionsBullet}>•</Text>
              <Text style={InsightPageStyle.bulletText}>
                <Text style={{ fontWeight: 'bold' }}>{item.title}: </Text>
                {item.info}
              </Text>
            </View>
          ))
        ) : (
          <Text style={InsightPageStyle.bulletText}>No cautions listed.</Text>
        )}
      </View>
    </View>
  </View>
);

export const renderNutrientsTab = (nutrientData: NutrientItem[]) => (
  <View style={InsightPageStyle.tabContent}>
    <View style={InsightPageStyle.nutrientInsightCard}>
      <Text style={InsightPageStyle.nutrientTitle}>Nutrient Breakdown</Text>
      <Text style={InsightPageStyle.insightSubtitle}>
        Details of key nutrients and their percentage of daily needs
      </Text>

      {nutrientData.map((item, index) => {
        const percentage =
          typeof item.width === 'number' ? item.width : parseInt(item.width);

        return (
          <View style={InsightPageStyle.nutrientRow} key={index}>
            <View style={InsightPageStyle.nutrientHeader}>
              <Text style={InsightPageStyle.nutrientLabel}>{item.label}</Text>
              <Text style={InsightPageStyle.nutrientValue}>{item.value}</Text>
            </View>
            <View
              style={[
                InsightPageStyle.nutrientBarBackground,
                { backgroundColor: item.color },
              ]}
            >
              <View
                style={[
                  InsightPageStyle.nutrientBarFill,
                  {
                    width: `${percentage}%`,
                    backgroundColor: '#4cae4f',
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  </View>
);
