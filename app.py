from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)

with open('Random Forest_model.pkl', 'rb') as file:
    model_rf = pickle.load(file)
    
with open('K-Nearest Neighbors_model.pkl', 'rb') as file:
    model_kn = pickle.load(file)

with open('Support Vector Machine_model.pkl', 'rb') as file:
    model_svm = pickle.load(file)
    

@app.route('/')
def index():
    return render_template('indexe.html')

@app.route('/predict', methods=['POST'])
def predict():
    try:
        features = request.form.to_dict(flat=False)
        print(features)
    
        feature_values = [float(value) for value in features['value']]
        feature_array = np.array([feature_values])

        prediction_rf = model_rf.predict(feature_array)
        prediction_kn = model_kn.predict(feature_array)
        prediction_svm = model_svm.predict(feature_array)

        prediction_rf_text = 'Alive' if prediction_rf[0] == 1 else 'Dead'
        prediction_kn_text = 'Alive' if prediction_kn[0] == 1 else 'Dead'
        prediction_svm_text = 'Alive' if prediction_svm[0] == 1 else 'Dead'

        return render_template(
            'indexe.html',
            prediction_rf=prediction_rf_text,
            prediction_kn=prediction_kn_text,
            prediction_svm=prediction_svm_text
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