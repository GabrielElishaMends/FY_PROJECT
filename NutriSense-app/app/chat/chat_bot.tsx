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
  StatusBar,
  Image,
} from 'react-native';
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
      text: `Hello! I'm your Ghanaian food nutrition assistant. I can help you with nutrition information about these foods: ${GHANAIAN_FOODS.join(
        ', '
      )}. 

What would you like to know about nutrition or these foods?`,
      sender: 'bot',
    };
    setMessages([welcomeMessage]);
  }, []);

  // Update the formatText function to handle bold, italics, and bullet points
  const formatText = (text: string) => {
    // First, replace * bullet points with • dots (only at start of lines)
    let formattedText = text.replace(/^\* /gm, '• ');
    formattedText = formattedText.replace(/\n\* /g, '\n• ');

    // Split by both bold (**) and italic (*) markers
    // Use a more complex regex to handle both patterns
    const parts = formattedText.split(/(\*\*.*?\*\*|\*.*?\*)/g);

    return parts.map((part, index) => {
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
      else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
        const italicText = part.slice(1, -1); // Remove * from both ends
        return (
          <Text key={index} style={{ fontStyle: 'italic' }}>
            {italicText}
          </Text>
        );
      }
      // Return regular text
      return <Text key={index}>{part}</Text>;
    });
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
            <Text style={styles.messageText}>{formatText(item.text)}</Text>
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
            placeholder="Ask about nutrition for waakye, banku, fufu, etc..."
            placeholderTextColor="#aaa"
            editable={!isLoading}
            onSubmitEditing={sendMessage}
            multiline={true}
            onContentSizeChange={(e) =>
              setInputHeight(e.nativeEvent.contentSize.height)
            }
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendButton, { opacity: isLoading ? 0.5 : 1 }]}
            disabled={isLoading || !inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
  },
  chatContainer: {
    padding: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 4,
    justifyContent: 'flex-start',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 6,
    backgroundColor: '#e0e0e0',
  },
  userAvatarContainer: {
    width: 30,
    height: 30,
    marginLeft: 6,
  },
  userAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '76.1%',
  },
  userBubble: {
    backgroundColor: '#4CAF50',
    marginRight: 0,
  },
  botBubble: {
    // backgroundColor: '#f0f0f0',
    backgroundColor: '#fff',
    marginLeft: 8,
  },
  messageText: {
    fontSize: 15,
    color: '#000',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    backgroundColor: colors.secondary,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#fff',
    paddingTop: 0,
    paddingBottom: 0,
    fontSize: 16,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    padding: 10,
    marginLeft: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  typingAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 8,
    backgroundColor: '#e0e0e0',
  },
  typingBubble: {
    backgroundColor: '#fff',
    marginLeft: 8,
    padding: 8,
    paddingHorizontal: 12,
  },
});
