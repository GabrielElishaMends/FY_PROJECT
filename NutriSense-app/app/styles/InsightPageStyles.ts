import { StyleSheet } from 'react-native';
import { Platform, StatusBar } from 'react-native';
import colors from '.././config/colors';
import { Dimensions } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const horizontalMargin = 15;
const imageWidth = screenWidth - horizontalMargin * 2;

const InsightsPageStyle = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  contain: {
    backgroundColor: colors.secondary,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.secondary,
  },
  cont: {
    marginBottom: 15,
    backgroundColor: colors.secondary,
  },
  detailCardContainer: {
    backgroundColor: '#fff',
    paddingBottom: 20,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginHorizontal: 15,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Elevation for Android
    elevation: 2,
    marginBottom: 20,
  },

  headerContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
  },
  headContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    borderRadius: 10,
  },
  headerImage: {
    width: imageWidth,
    height: 170,
    justifyContent: 'flex-end',
    padding: 0,
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
    borderRadius: 10,
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
  headerImageStyle: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  insightsContainer: {
    padding: 0,
    // marginHorizontal: 15,
    width: '91%',
    alignSelf: 'center',
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
    // marginBottom: 20,
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: colors.tabBackgColor,
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 19,
  },
  activeTab: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    margin: 3,
  },
  tabText: {
    fontSize: 14,
    color: '#7b7770',
  },
  activeTabText: {
    color: colors.black,
    fontWeight: 'bold',
  },
  tabContent: {
    paddingHorizontal: 16,
  },
  insightCard: {
    backgroundColor: '#E3F2FD',
    padding: 16,
    borderRadius: 12,

    elevation: 0.5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  nutrientInsightCard: {
    backgroundColor: '#F4FAF7',
    // backgroundColor: '#e0f5e0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eaecea',
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
    color: '#92400E',
    // backgroundColor: '#FEF3C7',
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
  nutrientValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nutrientBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 10,
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
  nutrientValue: {
    fontSize: 13,
    color: '#555',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.black,
    marginBottom: 4,
    marginTop: 10,
    marginLeft: 16,
    textAlign: 'left',
  },

  pageSubtitle: {
    fontSize: 16,
    marginBottom: 5,
    marginLeft: 16,
    textAlign: 'left',
    color: colors.gray,
  },

  // Modern Styles for FoodInsightsScreen
  modernSafeContainer: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  modernHeaderSection: {
    backgroundColor: colors.tertiary,
    paddingVertical: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  titleContainer: {
    flex: 1,
  },

  modernPageTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },

  modernPageSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
  },

  headerIconContainer: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.secondary,
  },

  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },

  modernScrollView: {
    flex: 1,
    backgroundColor: colors.secondary,
  },

  scrollContent: {
    paddingBottom: 30,
  },

  modernContainer: {
    paddingHorizontal: 20,
    paddingTop: 25,
  },

  modernFoodCard: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },

  modernHeaderImage: {
    width: '100%',
    height: 200,
    justifyContent: 'flex-end',
  },

  foodImageStyle: {
    borderRadius: 20,
  },

  modernGradientOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 20,
    borderRadius: 20,
  },

  foodContentContainer: {
    width: '100%',
  },

  modernFoodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  caloriesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },

  modernFoodCalories: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },

  tapIndicator: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
});

export default InsightsPageStyle;
