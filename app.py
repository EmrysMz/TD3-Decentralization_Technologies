from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np


app = Flask(__name__)
CORS(app)

# Load the models
with open('K-Nearest_Neighbors_model.pkl', 'rb') as file:
    knn_model = pickle.load(file)

with open('Random_Forest_model.pkl', 'rb') as file:
    rf_model = pickle.load(file)

with open('Support_Vector_Machine_model.pkl', 'rb') as file:
    svm_model = pickle.load(file)


@app.route('/')
def index():
    return render_template('indexe.html')

@app.route('/predict', methods=['POST'])
@app.route('/predict', methods=['POST'])
def predict():
    try:
        features = request.form.to_dict(flat=False)

        # Extract feature values
        sex = int(features['sex'][0])
        age = float(features['age'][0])
        fare = float(features['fare'][0])
        adult_male = int(features['adult_male'][0])
        pclass = int(features['pclass'][0])

        if pclass == 1:
            pclass_1 = 1
            pclass_2 = 0
            pclass_3 = 0
        elif pclass == 2:
            pclass_1 = 0
            pclass_2 = 1
            pclass_3 = 0
        else:
            pclass_1 = 0
            pclass_2 = 0
            pclass_3 = 1

        # Create feature array
        feature_array = np.array([[sex, age, fare, adult_male, pclass_1, pclass_2, pclass_3]])

        # Make the predictions
        knn_prediction = knn_model.predict(feature_array)
        rf_prediction = rf_model.predict(feature_array)
        svm_prediction = svm_model.predict(feature_array)

        # Convert predictions to readable labels
        prediction_dict = {
            0: 'Dead',
            1: 'Alive'
        }

        knn_prediction = prediction_dict[knn_prediction[0]]
        rf_prediction = prediction_dict[rf_prediction[0]]
        svm_prediction = prediction_dict[svm_prediction[0]]
        
        print(feature_array)
        
        print(knn_prediction, rf_prediction, svm_prediction)

        return render_template(
            'indexe.html',
            knn_prediction=knn_prediction,
            rf_prediction=rf_prediction,
            svm_prediction=svm_prediction,
            form_data=features  # Pass the form data back to the template
        )

    except Exception as e:
        return render_template('indexe.html', error=str(e))

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store'
    return response

if __name__ == '__main__':
    host = '0.0.0.0'
    port = 5000
    print(f"API running on http://{host}:{port}")
    app.run(host=host, port=port)