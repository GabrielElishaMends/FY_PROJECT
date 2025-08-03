import { StyleSheet } from 'react-native';
import { Platform, StatusBar } from 'react-native';
import colors from '../config/colors';

const HomeInsightsStyles = StyleSheet.create({
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingTop: 10,
    marginBottom: 5,
  },
  backButtonText: {
    marginLeft: 8,
    color: colors.tertiary,
    fontSize: 16,
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  headerImage: {
    width: '100%',
    height: 160,
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  headerImageStyle: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 15,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  foodCalories: {
    color: '#fff',
    fontSize: 14,
  },
  insightsContainer: {
    padding: 10,
    backgroundColor: '#fff',
    paddingBottom: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 2,
    marginBottom: 20,
  },
  insightCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 0.5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  nutrientInsightCard: {
    backgroundColor: '#e0f5e0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaecea',
    marginBottom: 16,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  insightTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  insightSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#F7FBFE',
    padding: 15,
    borderRadius: 10,
  },
  infoIcon: {
    marginRight: 10,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 14,
  },
  complexityLabel: {
    fontSize: 14,
    marginTop: 10,
    fontWeight: '600',
  },
  complexityValue: {
    color: '#4CAF50',
  },
  descriptionText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: '#444',
  },
  benefitsContainer: {
    backgroundColor: '#fff9e8',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  cautionsContainer: {
    backgroundColor: '#fff9e8',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 6,
  },
  benefitsBullet: {
    fontSize: 16,
    lineHeight: 20,
    color: 'green',
  },
  cautionsBullet: {
    fontSize: 16,
    lineHeight: 20,
    color: '#F44336',
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
  },
  nutrientTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  nutrientRow: {
    marginVertical: 10,
  },
  nutrientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  nutrientLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  nutrientValue: {
    fontSize: 13,
    color: '#555',
  },
  nutrientBarBackground: {
    height: 10,
    width: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  nutrientBarFill: {
    height: '100%',
    borderRadius: 5,
  },
});

export default HomeInsightsStyles;
