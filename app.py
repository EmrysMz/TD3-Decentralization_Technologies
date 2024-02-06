from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np



app = Flask(__name__)
CORS(app)

with open('rf_classifier_model.pkl', 'rb') as file:
    model = pickle.load(file)
    
with open('scaler.pkl', 'rb') as file:
    scaler = pickle.load(file)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        features = request.form.to_dict(flat=False)
        
        print(features)
        feature_values = [float(value) for value in features['value']]

        feature_array = np.array([feature_values])
        

        scaled_feature_array = scaler.transform(feature_array)

        prediction = model.predict(scaled_feature_array)
        prediction_list = prediction.tolist()
        
        if prediction_list[0] == 0:
            prediction_list[0] = 'Not popular'
        elif prediction_list[0] == 1:
            prediction_list[0] = 'Popular'
        print(prediction_list)

        return render_template('index.html', prediction=prediction_list[0])

    except Exception as e:
        return render_template('index.html', error=str(e))


@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store'
    return response



if __name__ == '__main__':
    host = '0.0.0.0'
    port = 5000
    print(f"API running on http://{host}:{port}")
    app.run(host=host, port=port)
