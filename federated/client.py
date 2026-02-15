import flwr as fl
import numpy as np
from sklearn.ensemble import IsolationForest
from federated.data_generator import generate_energy_data


class EnergyClient(fl.client.NumPyClient):

    def __init__(self):
        self.model = IsolationForest(contamination=0.05)
        self.data = generate_energy_data()
        self.X = self.data.values

    def get_parameters(self, config):
        return [np.zeros(1)]

    def fit(self, parameters, config):
        self.model.fit(self.X)
        return parameters, len(self.X), {}

    def evaluate(self, parameters, config):
        predictions = self.model.predict(self.X)
        anomaly_rate = np.mean(predictions == -1)
        print(f"Anomaly Rate: {anomaly_rate}")
        return float(anomaly_rate), len(self.X), {"anomaly_rate": float(anomaly_rate)}

if __name__ == "__main__":
    fl.client.start_numpy_client(
        server_address="localhost:8080",
        client=EnergyClient(),
    )

