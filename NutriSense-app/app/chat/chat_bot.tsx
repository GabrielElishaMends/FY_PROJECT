import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { StatusBar as RNStatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GoogleGenAI } from '@google/genai';
import config from '../config/api';
import colors from '../config/colors';
import TypingIndicator from '../components/TypingIndicator';
import { GHANAIAN_FOODS } from './ghanaian_foods';
import NutriHeader from '../homePage/NutriHeader';
import { auth, db } from '../../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const BOT_AVATAR = 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
};

type ChatbotScreenProps = {
  profileImage?: string | null;
};

const ChatbotScreen: React.FC<ChatbotScreenProps> = ({
  profileImage: initialProfileImage,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(
    initialProfileImage || null
  );
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // Initialize Google AI with error handling
  let ai: GoogleGenAI | null = null;
  try {
    ai = new GoogleGenAI({
      apiKey: config.googleGenAIApiKey,
    });
  } catch (error) {
    console.error('Failed to initialize Google AI:', error);
    setApiKeyError(
      error instanceof Error ? error.message : 'Failed to initialize AI service'
    );
  }

  // Add this useEffect to fetch profile image from Firebase
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfileImage(data.profileImage ?? null);
          }
        } catch (error) {
          console.error('Error fetching profile image:', error);
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Update the welcome message to be more specific
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: "Hello! I'm your Ghanaian food nutrition assistant. I can help you with nutrition information about Ghanaian foods.\n\nWhat would you like to know about nutrition or these foods?",
      sender: 'bot',
    };
    setMessages([welcomeMessage]);
  }, []);

  // Update the formatText function to handle bold, italics, and bullet points
  const formatText = (text: string) => {
    if (!text || typeof text !== 'string') {
      return <Text style={styles.messageText}></Text>;
    }

    // First, replace * bullet points with • dots (only at start of lines)
    let formattedText = text.replace(/^\* /gm, '• ');
    formattedText = formattedText.replace(/\n\* /g, '\n• ');

    // Split by both bold (**) and italic (*) markers
    // Use a more complex regex to handle both patterns
    const parts = formattedText.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return (
      <Text style={styles.messageText}>
        {parts.map((part, index) => {
          // Skip empty parts
          if (!part) {
            return null;
          }

          // Check if it's bold text (**text**)
          if (part.startsWith('**') && part.endsWith('**')) {
            const boldText = part.slice(2, -2); // Remove ** from both ends
            return (
              <Text key={index} style={{ fontWeight: 'bold' }}>
                {boldText}
              </Text>
            );
          }
          // Check if it's italic text (*text*) but not bullet points
          else if (
            part.startsWith('*') &&
            part.endsWith('*') &&
            part.length > 2
          ) {
            const italicText = part.slice(1, -1); // Remove * from both ends
            return (
              <Text key={index} style={{ fontStyle: 'italic' }}>
                {italicText}
              </Text>
            );
          }
          // Return regular text wrapped in Text component
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  // Add this function right after the formatText function and before sendMessage
  const isValidFoodQuery = (query: string): boolean => {
    const lowerQuery = query.toLowerCase();

    // Check if query contains food-related keywords
    const foodKeywords = [
      'nutrition',
      'calories',
      'vitamin',
      'mineral',
      'protein',
      'carbs',
      'fat',
      'health',
      'benefit',
      'cook',
      'prepare',
      'eat',
      'diet',
      'meal',
      'food',
      'digest',
      'fiber',
      'energy',
      'nutrients',
      'antioxidant',
    ];

    // Check if query mentions any of the 15 foods
    const mentionsGhanaianFood = GHANAIAN_FOODS.some((food) =>
      lowerQuery.includes(food.toLowerCase())
    );

    // Check if query contains food-related keywords
    const containsFoodKeywords = foodKeywords.some((keyword) =>
      lowerQuery.includes(keyword)
    );

    return mentionsGhanaianFood || containsFoodKeywords;
  };

  // Update the sendMessage function to include restrictions
  const sendMessage = async () => {
    if (!inputText.trim()) return;

    // Check if AI is properly initialized
    if (!ai || apiKeyError) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
      };

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text:
          apiKeyError ||
          'AI service is not available. Please check your API key configuration.',
        sender: 'bot',
      };

      setMessages((prev) => [...prev, userMessage, errorMessage]);
      setInputText('');
      return;
    }

    // Add client-side validation before processing
    if (!isValidFoodQuery(inputText)) {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        sender: 'user',
      };

      const restrictionMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `I can only help with nutrition information about these Ghanaian foods: ${GHANAIAN_FOODS.join(
          ', '
        )}. 

Please ask about nutrition, health benefits, cooking methods, or any other food-related questions about these foods.`,
        sender: 'bot',
      };

      setMessages((prev) => [...prev, userMessage, restrictionMessage]);
      setInputText('');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Create a comprehensive prompt with restrictions
      const restrictedPrompt = `
You are a specialized nutrition assistant for Ghanaian foods. You can ONLY provide information about:

**ALLOWED TOPICS:**
- Nutrition and health information for these 15 Ghanaian foods: ${GHANAIAN_FOODS.join(
        ', '
      )}
- Nutritional content (calories, vitamins, minerals, macronutrients)
- Health benefits and cautions of these foods
- Cooking methods and preparation tips for these foods
- Dietary advice related to these foods
- Food combinations and meal planning with these foods
- Digestion information for these foods

**STRICTLY FORBIDDEN:**
- Any topics outside of food and nutrition
- Information about foods not in the 15 Ghanaian foods list
- Medical diagnosis or treatment advice
- Non-food related questions
- Programming, technology, or general knowledge questions

**USER QUESTION:** ${inputText}

**INSTRUCTIONS:**
1. If the question is about the 15 Ghanaian foods or general nutrition, provide helpful information
2. If the question is outside your scope, politely redirect to food and nutrition topics
3. Use markdown bold (**) for important points, calories, and nutrients
4. Keep responses focused on nutrition and the specified foods

Please respond appropriately:`;

      const result = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: restrictedPrompt }],
          },
        ],
      });

      const text =
        result.candidates &&
        result.candidates[0] &&
        result.candidates[0].content &&
        result.candidates[0].content.parts &&
        result.candidates[0].content.parts[0] &&
        typeof result.candidates[0].content.parts[0].text === 'string'
          ? result.candidates[0].content.parts[0].text
          : "I'm sorry, I can only help with nutrition information about Ghanaian foods.";

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: text,
        sender: 'bot',
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble processing your request. Please ask about nutrition or Ghanaian foods.",
        sender: 'bot',
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Scroll to bottom after new message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  // Update the renderItem function to properly handle the formatted text
  const renderItem = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.sender === 'user' && styles.userRow]}>
      {item.sender === 'bot' ? (
        <>
          <Image
            source={{ uri: BOT_AVATAR }}
            style={styles.avatar}
            resizeMode="cover"
          />
          <View style={[styles.messageBubble, styles.botBubble]}>
            {formatText(item.text)}
          </View>
        </>
      ) : (
        <>
          <View style={[styles.messageBubble, styles.userBubble]}>
            <Text style={[styles.messageText, { color: '#fff' }]}>
              {item.text}
            </Text>
          </View>
          <View style={styles.userAvatarContainer}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.userAvatar}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar style="dark" backgroundColor={colors.secondary} />
      <NutriHeader profileImage={profileImage} />{' '}
      {/* Now using the state variable */}
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.chatContainer}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        {isLoading && (
          <View style={styles.typingContainer}>
            <Image
              source={{ uri: BOT_AVATAR }}
              style={styles.typingAvatar}
              resizeMode="cover"
            />
            <View style={[styles.messageBubble, styles.typingBubble]}>
              <TypingIndicator />
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={[
                styles.input,
                {
                  height: Math.min(100, Math.max(40, inputHeight)),
                  maxHeight: 100,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about nutrition..."
              placeholderTextColor="#999"
              editable={!isLoading}
              onSubmitEditing={sendMessage}
              multiline={true}
              onContentSizeChange={(e) =>
                setInputHeight(e.nativeEvent.contentSize.height)
              }
            />
            <TouchableOpacity
              onPress={sendMessage}
              style={[
                styles.sendButton,
                {
                  opacity: isLoading || !inputText.trim() ? 0.5 : 1,
                  backgroundColor: inputText.trim() ? '#4CAF50' : '#ccc',
                },
              ]}
              disabled={isLoading || !inputText.trim()}
            >
              <Ionicons
                name="send"
                size={20}
                color={inputText.trim() ? '#fff' : '#666'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatbotScreen;

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: colors.secondary,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  chatContainer: {
    padding: 8,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 6,
    justifyContent: 'flex-start',
    paddingHorizontal: 2,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 2,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#4CAF50',
    padding: 4,
  },
  userAvatarContainer: {
    width: 32,
    height: 32,
    marginLeft: 2,
  },
  userAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 1,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 18,
    maxWidth: '80%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  userBubble: {
    backgroundColor: '#4CAF50',
    marginRight: 0,
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: '#fff',
    marginLeft: 2,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  messageText: {
    fontSize: 15.5,
    lineHeight: 20,
    color: '#000',
  },
  inputContainer: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.secondary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E8F5E8',
    elevation: 0.5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
    textAlignVertical: 'center',
    backgroundColor: 'transparent',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    alignSelf: 'center',
    elevation: 1,
    shadowColor: '#4CAF50',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 10,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  typingAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 2,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#4CAF50',
    padding: 4,
  },
  typingBubble: {
    backgroundColor: '#fff',
    marginLeft: 2,
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
});
