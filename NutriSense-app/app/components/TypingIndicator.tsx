import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const TypingIndicator = () => {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, index) => {
      return Animated.sequence([
        Animated.delay(index * 200),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, {
              toValue: 1,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        ),
      ]);
    });

    Animated.parallel(animations).start();
  }, []);

  return (
    <View style={styles.container}>
      {dots.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              transform: [
                {
                  scale: dot.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.5],
                  }),
                },
              ],
              opacity: dot.interpolate({
                inputRange: [0, 1],
                outputRange: [0.5, 1],
              }),
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 52,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#90a4ae',
    marginHorizontal: 4,
  },
});

export default TypingIndicator;
