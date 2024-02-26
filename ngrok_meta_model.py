import requests
import json

emrys_url = "https://fe68-2a02-8440-3141-88cd-64b6-f9ab-646c-9558.ngrok-free.app"
louis_url = "https://48ea-89-30-29-68.ngrok-free.app/"
victor_url = "https://f1cc-89-30-29-68.ngrok-free.app/"

urls = [emrys_url, louis_url, victor_url]

test_params = [
    {
        'sex': 0,
        'age': 25,
        'fare': 40,
        'adult_male': 0,
        'pclass': 3
    },
    {
        'sex': 1,
        'age': 30,
        'fare': 50,
        'adult_male': 1,
        'pclass': 1
    },
    {
        'sex': 0,
        'age': 20,
        'fare': 100,
        'adult_male': 1,
        'pclass': 2
    },
    {
        'sex': 1,
        'age': 35,
        'fare': 20,
        'adult_male': 0,
        'pclass': 3
    },
    {
        'sex': 0,
        'age': 45,
        'fare': 80,
        'adult_male': 1,
        'pclass': 1
    }
]

def get_predictions(urls, params_list):
    predictions = [[] for _ in urls]
    weights = [[1.0] * len(urls) for _ in params_list]  # Initialize weights with equal values
    
    for i, params in enumerate(params_list):
        for j, url in enumerate(urls):
            response = requests.get(url + '/predict/', params=params)
            predictions[j].append(response.json())
            
            # Update weights based on the accuracy of each model
            if i > 0:
                consensus_prob = sum([pred['probability'][0][1] for pred in predictions[j][:i]]) / i
                individual_prob = predictions[j][i]['probability'][0][1]
                weights[i][j] = individual_prob / consensus_prob
                
        # Normalize weights to ensure they are between 0 and 1
        weight_sum = sum(weights[i])
        weights[i] = [weight / weight_sum for weight in weights[i]]
    
    alive_probs = []
    dead_probs = []
    
    for i, params in enumerate(params_list):
        alive_prob = sum([pred['probability'][0][1] * weight for pred, weight in zip(predictions[j], weights[i])]) / sum(weights[i])
        dead_prob = sum([pred['probability'][0][0] * weight for pred, weight in zip(predictions[j], weights[i])]) / sum(weights[i])
        
        alive_probs.append(alive_prob)
        dead_probs.append(dead_prob)
    
    return alive_probs, dead_probs, weights

alive_probs, dead_probs, weights = get_predictions(urls, test_params)

for i, params in enumerate(test_params):
    print(f"Test {i+1}:")
    print(f"Parameters: {params}")
    print(f"Alive probability: {alive_probs[i]}")
    print(f"Dead probability: {dead_probs[i]}")
    print(f"Weights: {weights[i]}")
    print()