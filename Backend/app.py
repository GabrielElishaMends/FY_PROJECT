from flask import Flask, request, jsonify
from tensorflow.keras.models import load_model
import numpy as np
import os
from PIL import Image

app = Flask(__name__)

# Load your trained model - Switch to MobileNetV2
# MODEL_PATH = os.path.join('model', 'ghanaian_food_model_final.h5')
MODEL_PATH = os.path.join('model', 'mobilenetv2_improved.h5')
model = load_model(MODEL_PATH)

# Define class names in order as used during training
class_names = ['Banku', 'Plantain', "Yam", 'Etɔ', 'Fante Kenkey', 'Fufu', 'Ga Kenkey', 'Gob3', 'Jollof Rice', 'Kelewele', 'Kokonte', 'Plain Rice', 'Rice Balls', 'Tuo Zaafi', 'Waakye', ]

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400

    try:
        img = Image.open(file.stream).convert('RGB')
        
        # MobileNetV2 typically uses 224x224 input size (check your model's requirements)
        img = img.resize((224, 224))  # Changed from (150, 150)
        
        img_array = np.array(img) / 255.0
        img_array = np.expand_dims(img_array, axis=0)
        prediction = model.predict(img_array)
        predicted_index = np.argmax(prediction[0])
        predicted_label = class_names[predicted_index]
        confidence = float(np.max(prediction[0]))

        return jsonify({
            'predicted_class': predicted_label,
            'confidence': round(confidence, 4)
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
