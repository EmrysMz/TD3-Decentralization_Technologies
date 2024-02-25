import requests
import json


emrys_url = "https://af87-92-92-90-81.ngrok-free.app"
louis_url = ""
victor_url = ""

urls = [emrys_url]

test_params = {
    'sex':0,
    'age':25,
    'fare':40,
    'adult_male':0,
    'pclass':3
}

def get_predictions(urls, params):
    
    predictions = []
    
    for url in urls:
        response = requests.get(url + '/predict/', params=params)
        print(response.json())
        predictions.append(response.json())

    alive_prob = sum([pred['probability'][0][1] for pred in predictions])/len(predictions)
    dead_prob = sum([pred['probability'][0][0] for pred in predictions])/len(predictions)
    
    print(f"Alive probability: {alive_prob}")
    print(f"Dead probability: {dead_prob}")
    
    


get_predictions(urls, test_params)