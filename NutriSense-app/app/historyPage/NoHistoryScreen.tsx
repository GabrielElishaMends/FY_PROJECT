import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import colors from '.././config/colors';

const NoHistoryScreen = () => {
  const navigation = useNavigation();

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Feather name="clock" size={60} color="#777" />
      <Text style={styles.title}>No food history yet</Text>
      <Text style={styles.subtitle}>
        Search or scan foods to build your history
      </Text>
      <TouchableOpacity
        style={styles.searchButton}
        onPress={handleGoBack}
      >
        <Feather
          name="search"
          size={20}
          color="#fff"
          style={styles.searchIcon}
        />
        <Text style={styles.searchButtonText}>Search for foods</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.secondary,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    marginTop: 10,
    textAlign: 'center',
  },
  searchButton: {
    backgroundColor: colors.tertiary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 30,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NoHistoryScreen;
