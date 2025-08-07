import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import {
  TOP_ONS_DATA,
  TopOnItem,
  SelectedTopOn,
  calculateTopOnNutrition,
  sumTopOnsNutrition,
} from '../utils/topOnsData';

interface TopOnsModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedTopOns: SelectedTopOn[]) => void;
  onSkip: () => void;
}

const TopOnsModal: React.FC<TopOnsModalProps> = ({
  visible,
  onClose,
  onConfirm,
  onSkip,
}) => {
  const [selectedQuantities, setSelectedQuantities] = useState<{
    [key: string]: number;
  }>({});

  // Reset selections when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedQuantities({});
    }
  }, [visible]);

  // Add some debugging
  console.log('TopOnsModal render:', {
    visible,
    dataCount: TOP_ONS_DATA.length,
  });

  const updateQuantity = (topOnId: string, delta: number) => {
    setSelectedQuantities((prev) => {
      const currentQuantity = prev[topOnId] || 0;
      const newQuantity = Math.max(0, Math.min(5, currentQuantity + delta)); // Max 5 portions

      if (newQuantity === 0) {
        const { [topOnId]: removed, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [topOnId]: newQuantity,
      };
    });
  };

  const getSelectedTopOns = (): SelectedTopOn[] => {
    return Object.entries(selectedQuantities).map(([topOnId, quantity]) => {
      const topOn = TOP_ONS_DATA.find((item) => item.id === topOnId)!;
      return calculateTopOnNutrition(topOn, quantity);
    });
  };

  const handleConfirm = () => {
    const selected = getSelectedTopOns();
    // No need for alert since button is disabled when nothing is selected
    onConfirm(selected);
  };

  const handleSkip = () => {
    setSelectedQuantities({});
    onSkip();
  };

  const selectedTopOns = getSelectedTopOns();
  const totalNutrition = sumTopOnsNutrition(selectedTopOns);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Add Protein Top-ons</Text>
            <Text style={styles.subtitle}>
              Select proteins to add to your meal (optional)
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Feather name="x" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Top-ons List - Make sure this has proper flex */}
          <View style={styles.contentContainer}>
            {/* Debug message */}
            <View
              style={{
                padding: 10,
                backgroundColor: '#f0f0f0',
                margin: 15, // Reduced from 20 to 15
                borderRadius: 8,
              }}
            >
              <Text
                style={{ textAlign: 'center', fontSize: 14, color: '#333' }}
              >
                {TOP_ONS_DATA.length} protein options available
              </Text>
            </View>

            <ScrollView
              style={styles.scrollContainer}
              showsVerticalScrollIndicator={false}
            >
              {TOP_ONS_DATA.map((topOn) => {
                const quantity = selectedQuantities[topOn.id] || 0;
                const nutrition =
                  quantity > 0
                    ? calculateTopOnNutrition(topOn, quantity)
                    : null;

                return (
                  <View key={topOn.id} style={styles.topOnCard}>
                    <View style={styles.topOnHeader}>
                      <View style={styles.topOnInfo}>
                        <Text style={styles.emoji}>{topOn.emoji}</Text>
                        <View style={styles.proteinDetails}>
                          <View style={styles.nameRow}>
                            <Text style={styles.topOnName}>{topOn.name}</Text>
                            <View style={styles.quantityControls}>
                              <TouchableOpacity
                                style={[
                                  styles.quantityButton,
                                  quantity === 0 && styles.disabledButton,
                                ]}
                                onPress={() => updateQuantity(topOn.id, -1)}
                                disabled={quantity === 0}
                              >
                                <Feather
                                  name="minus"
                                  size={16}
                                  color={quantity === 0 ? '#ccc' : '#4CAF50'}
                                />
                              </TouchableOpacity>

                              <Text style={styles.quantityText}>
                                {quantity}
                              </Text>

                              <TouchableOpacity
                                style={[
                                  styles.quantityButton,
                                  quantity === 5 && styles.disabledButton,
                                ]}
                                onPress={() => updateQuantity(topOn.id, 1)}
                                disabled={quantity === 5}
                              >
                                <Feather
                                  name="plus"
                                  size={16}
                                  color={quantity === 5 ? '#ccc' : '#4CAF50'}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>
                          <Text style={styles.topOnBase}>
                            {topOn.calories} cal, {topOn.protein}g protein per
                            50g
                          </Text>
                        </View>
                      </View>
                    </View>

                    {nutrition && (
                      <View style={styles.nutritionSummary}>
                        <Text style={styles.nutritionText}>
                          Total: {nutrition.totalCalories} cal •{' '}
                          {nutrition.totalProtein.toFixed(1)}g protein •{' '}
                          {nutrition.totalFats.toFixed(1)}g fat •{' '}
                          {nutrition.totalCarbs.toFixed(1)}g carbs
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Summary Section */}
            {selectedTopOns.length > 0 && (
              <View style={styles.summarySection}>
                <Text style={styles.summaryTitle}>Total Top-ons Added:</Text>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryItem}>
                    {totalNutrition.calories} cal
                  </Text>
                  <Text style={styles.summaryItem}>
                    {totalNutrition.protein.toFixed(1)}g protein
                  </Text>
                  <Text style={styles.summaryItem}>
                    {totalNutrition.fats.toFixed(1)}g fat
                  </Text>
                  <Text style={styles.summaryItem}>
                    {totalNutrition.carbohydrates.toFixed(1)}g carbs
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                selectedTopOns.length === 0 && styles.disabledConfirmButton,
              ]}
              onPress={handleConfirm}
              disabled={selectedTopOns.length === 0}
            >
              <Text
                style={[
                  styles.confirmButtonText,
                  selectedTopOns.length === 0 &&
                    styles.disabledConfirmButtonText,
                ]}
              >
                Add & Continue
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '88%', // Increased from 80% to 88%
    paddingTop: 20,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    position: 'relative',
    flexShrink: 0, // Prevent header from shrinking
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: -2,
    padding: 4,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 10,
    minHeight: 200, // Ensure minimum height for content
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 15, // Reduced from 20 to 15
    paddingTop: 15,
    paddingBottom: 15, // Add bottom padding
  },
  topOnCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  topOnHeader: {
    // Simplified since controls are now inline with name
  },
  topOnInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Changed to flex-start since we have nested layout
    flex: 1,
  },
  proteinDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  emoji: {
    fontSize: 24,
    marginRight: 8, // Reduced from 12 to 8
  },
  topOnName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  topOnBase: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 6, // Reduced from 8 to 6
    paddingVertical: 3, // Reduced from 4 to 3
    // Removed marginTop to align with protein name
  },
  quantityButton: {
    width: 28, // Reduced from 32 to 28
    height: 28, // Reduced from 32 to 28
    borderRadius: 14, // Adjusted to match new size
    backgroundColor: '#f0f8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 12, // Reduced from 16 to 12
    minWidth: 20,
    textAlign: 'center',
  },
  nutritionSummary: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
  },
  nutritionText: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  summarySection: {
    backgroundColor: '#f0f8f0',
    marginHorizontal: 15, // Reduced from 20 to 15
    marginVertical: 15,
    padding: 15,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    gap: 12,
    flexShrink: 0, // Prevent buttons from shrinking
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledConfirmButton: {
    backgroundColor: '#cccccc',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledConfirmButtonText: {
    color: '#999999',
  },
});

export default TopOnsModal;
