import { StyleSheet } from 'react-native';
import { Platform, StatusBar } from 'react-native';
import colors from '.././config/colors';

const HistoryPageStyles = StyleSheet.create({
  backbutton: {
    marginLeft: 10,
  },
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  headerTab: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    position: 'relative',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  safeContainer: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
    color: colors.tertiary,
  },
  logItem: {
    fontSize: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});

export default HistoryPageStyles;
