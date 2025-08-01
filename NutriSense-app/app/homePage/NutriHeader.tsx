import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import HomePageStyles from '../styles/HomePageStyles';
import { useRouter } from 'expo-router';
import ClockCounterClockwiseIcon from '../components/ClockCounterClockwiseIcon';

type NutriHeaderProps = {
  profileImage?: string | null;
};

const NutriHeader: React.FC<NutriHeaderProps> = ({ profileImage }) => {
  const router = useRouter();

  return (
    <View style={HomePageStyles.header}>
      <TouchableOpacity
        onPress={() => router.push('/historyPage/history')}
        activeOpacity={0.8}
        style={HomePageStyles.profileButton}
      >
        <ClockCounterClockwiseIcon size={28} color="#FFF" />
      </TouchableOpacity>

      <Text style={HomePageStyles.title}>
        Nutri
        <Text style={HomePageStyles.coloredText}>Sense</Text>
      </Text>

      <TouchableOpacity
        onPress={() => router.push('/homePage/userProfile')}
        activeOpacity={0.8}
        style={HomePageStyles.profileButton}
      >
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={HomePageStyles.pIcon} />
        ) : (
          <Feather name="user" size={20} color="#FFF" />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default NutriHeader;
