from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)

with open('K-Nearest Neighbors_model.pkl', 'rb') as file:
    model_rf = pickle.load(file)
    


@app.route('/predict/', methods=['GET'])
def predict():
    try:
        
        sex = int(request.args.get('sex'))
        age = float(request.args.get('age'))
        fare = float(request.args.get('fare'))
        adult_male = int(request.args.get('adult_male'))
        pclass = int(request.args.get('pclass'))
        
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
            
        
        feature_array = np.array([[sex, age, fare, adult_male, pclass_1,pclass_2,pclass_3]])

        prediction_rf = model_rf.predict(feature_array)

        prediction_rf_text = 'Alive' if prediction_rf[0] == 1 else 'Dead'
        
        print(f"Prediction KNN: {prediction_rf_text}")
        
        response = {
            'prediction_KNN': prediction_rf_text,
            'probability': model_rf.predict_proba(feature_array).tolist()
        }

        return jsonify(response)

    except Exception as e:
        return jsonify({'error': str(e)})


@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store'
    return response

if __name__ == '__main__':
    host = '0.0.0.0'
    port = 5000
    print(f"API running on http://{host}:{port}")
    app.run(host=host, port=port)