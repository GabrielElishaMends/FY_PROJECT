import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import HistoryPageStyles from '../styles/HistoryPageStyles';
import HistoryList from './HistoryList';
import { auth, db } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import foodImages from '../../assets/foodImages/foodImages';

dayjs.extend(relativeTime);

// Update type definition
type HistoryItemType = {
  id: string;
  name: string;
  calories: string;
  imageUri: string | number;
  timeAgo: string;
};

const HistoryScreen = () => {
  const navigation = useNavigation();
  const [historyData, setHistoryData] = useState<HistoryItemType[]>([]);
  const [loading, setLoading] = useState(true);

  const handleGoBack = () => {
    navigation.goBack();
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const historyQuery = query(
          collection(db, 'history'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );

        const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
          const newHistoryData: HistoryItemType[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            const name = data.foodName || data.name || 'Unknown Food';
            const foodKey = name.toLowerCase().replace(/_/g, ' ').trim();

            let imageUri: string | number;
            if (typeof data.imageUri === 'string') {
              imageUri = data.imageUri;
            } else if (typeof data.imageUri === 'number') {
              imageUri = data.imageUri;
            } else if (foodImages[foodKey]) {
              imageUri = foodImages[foodKey];
            } else {
              imageUri = require('../../assets/foodImages/waakye.jpg');
            }

            return {
              id: doc.id,
              name,
              calories: data.calories ?? '0',
              imageUri,
              timeAgo: dayjs(data.createdAt?.toDate()).fromNow(),
            };
          });

          setHistoryData(newHistoryData);
          setLoading(false);
        });

        return () => unsubscribeHistory();
      } else {
        setHistoryData([]);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <SafeAreaView style={HistoryPageStyles.safeContainer}>
      <View style={HistoryPageStyles.container}>
        <View style={HistoryPageStyles.headerTab}>
          <TouchableOpacity
            style={HistoryPageStyles.backbutton}
            onPress={handleGoBack}
          >
            <Feather name="arrow-left" size={30} color="#4CAF50" />
          </TouchableOpacity>
          <Text style={HistoryPageStyles.title}>Food History</Text>
        </View>

        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={{ marginTop: 10, color: '#555' }}>Loading history...</Text>
          </View>
        ) : (
          <HistoryList data={historyData} />
        )}
      </View>
    </SafeAreaView>
  );
};

export default HistoryScreen;