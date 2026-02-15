import numpy as np
import pandas as pd

def generate_energy_data(samples=300):

    voltage = np.random.normal(220, 5, samples)
    current = np.random.uniform(3, 8, samples)
    temperature = np.random.uniform(25, 45, samples)

    power = voltage * current / 1000

    anomaly_indices = np.random.choice(samples, size=15, replace=False)
    power[anomaly_indices] *= 2.5

    df = pd.DataFrame({
        "voltage": voltage,
        "current": current,
        "temperature": temperature,
        "power": power
    })

    return df
