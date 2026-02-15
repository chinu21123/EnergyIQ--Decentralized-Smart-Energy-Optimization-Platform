"""
Anomaly Detection Module for Smart Energy Grid System

This module uses Isolation Forest to detect anomalies in energy grid metrics
and triggers self-healing protocols when anomalies are detected.

Author: EnergyFlow System
Version: 1.0.0
"""

import json
import logging
import pickle
from pathlib import Path
from typing import Dict, Tuple, Optional, List
import numpy as np
from sklearn.ensemble import IsolationForest
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Constants
MODEL_PATH = Path(__file__).parent / "models" / "federated_model.pkl"
CONFIG_PATH = Path(__file__).parent / "config" / "anomaly_config.json"
ANOMALY_THRESHOLD = 0.7  # Anomaly score threshold (0-1)
SENSITIVITY_LEVEL = 0.5  # Sensitivity level (0-1, higher = more sensitive)

# Feature bounds for validation
FEATURE_BOUNDS = {
    "voltage": (200, 250),  # Volts
    "current": (0, 200),     # Amperes
    "load": (0, 100),        # Percentage
    "battery_level": (0, 100)  # Percentage
}


class AnomalyDetectionError(Exception):
    """Custom exception for anomaly detection errors"""
    pass


class AnomalyDetector:
    """
    Production-grade anomaly detector for energy grid metrics using Isolation Forest.
    
    Attributes:
        model: Fitted IsolationForest model
        threshold: Anomaly score threshold
        feature_names: List of feature names
        anomaly_history: List of recent anomalies for trend analysis
    """
    
    def __init__(self, model_path: Optional[Path] = None, threshold: float = ANOMALY_THRESHOLD):
        """
        Initialize the AnomalyDetector.
        
        Args:
            model_path: Path to the federated model file. Defaults to MODEL_PATH
            threshold: Anomaly score threshold (0-1). Defaults to ANOMALY_THRESHOLD
            
        Raises:
            AnomalyDetectionError: If model cannot be loaded
        """
        self.model_path = model_path or MODEL_PATH
        self.threshold = threshold
        self.feature_names = ["voltage", "current", "load", "battery_level"]
        self.model: Optional[IsolationForest] = None
        self.anomaly_history: List[Dict] = []
        self.max_history = 100  # Keep last 100 anomalies
        
        logger.info(f"Initializing AnomalyDetector with threshold: {self.threshold}")
        self._load_model()
    
    def _load_model(self) -> None:
        """
        Load the federated model from disk.
        
        Raises:
            AnomalyDetectionError: If model file not found or corrupted
        """
        try:
            if not self.model_path.exists():
                logger.warning(f"Model not found at {self.model_path}. Using default model.")
                self._create_default_model()
            else:
                with open(self.model_path, 'rb') as f:
                    self.model = pickle.load(f)
                logger.info(f"Successfully loaded federated model from {self.model_path}")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise AnomalyDetectionError(f"Cannot load federated model: {str(e)}")
    
    def _create_default_model(self) -> None:
        """Create a default Isolation Forest model for initialization."""
        logger.info("Creating default Isolation Forest model")
        self.model = IsolationForest(
            n_estimators=100,
            contamination=0.1,  # Expected proportion of anomalies
            random_state=42,
            n_jobs=-1  # Use all processors
        )
        # Train on synthetic default data
        synthetic_data = np.array([
            [230, 50, 45, 85],    # Normal
            [228, 48, 42, 87],    # Normal
            [232, 52, 48, 83],    # Normal
            [231, 49, 46, 84],    # Normal
            [229, 51, 44, 86],    # Normal
        ])
        self.model.fit(synthetic_data)
    
    def _validate_input(self, voltage: float, current: float, load: float, 
                        battery_level: float) -> None:
        """
        Validate input values are within acceptable bounds.
        
        Args:
            voltage: Grid voltage in Volts
            current: Grid current in Amperes
            load: Grid load percentage (0-100)
            battery_level: Battery level percentage (0-100)
            
        Raises:
            ValueError: If any value is out of bounds
        """
        values = {
            "voltage": voltage,
            "current": current,
            "load": load,
            "battery_level": battery_level
        }
        
        for feature, value in values.items():
            min_val, max_val = FEATURE_BOUNDS[feature]
            if not (min_val <= value <= max_val):
                raise ValueError(
                    f"{feature}={value} out of bounds [{min_val}, {max_val}]"
                )
    
    def detect_anomaly(self, voltage: float, current: float, load: float,
                      battery_level: float) -> Tuple[float, bool]:
        """
        Detect anomalies in energy grid metrics.
        
        Args:
            voltage: Grid voltage in Volts (200-250V)
            current: Grid current in Amperes (0-200A)
            load: Grid load percentage (0-100%)
            battery_level: Battery level percentage (0-100%)
            
        Returns:
            Tuple containing:
                - anomaly_score: Float (0-1, higher = more anomalous)
                - is_anomaly: Boolean (True if anomaly detected)
                
        Raises:
            ValueError: If input values are invalid
            AnomalyDetectionError: If detection fails
        """
        try:
            # Validate input
            self._validate_input(voltage, current, load, battery_level)
            
            # Prepare input data
            X = np.array([[voltage, current, load, battery_level]])
            
            # Get anomaly score (-1 for anomaly, 1 for normal)
            prediction = self.model.predict(X)[0]
            
            # Get normalized anomaly score (0-1)
            scores = self.model.score_samples(X)
            anomaly_score = self._normalize_score(scores[0])
            
            # Determine if anomaly
            is_anomaly = anomaly_score > self.threshold
            
            # Log detection
            log_entry = {
                "timestamp": datetime.utcnow().isoformat(),
                "voltage": voltage,
                "current": current,
                "load": load,
                "battery_level": battery_level,
                "anomaly_score": float(anomaly_score),
                "is_anomaly": bool(is_anomaly)
            }
            self._record_anomaly(log_entry)
            
            if is_anomaly:
                logger.warning(
                    f"Anomaly detected! Score: {anomaly_score:.3f} | "
                    f"V:{voltage:.1f}V C:{current:.1f}A L:{load:.1f}% B:{battery_level:.1f}%"
                )
            else:
                logger.debug(f"Normal reading. Score: {anomaly_score:.3f}")
            
            return anomaly_score, is_anomaly
            
        except ValueError as e:
            logger.error(f"Invalid input: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Anomaly detection failed: {str(e)}")
            raise AnomalyDetectionError(f"Detection failed: {str(e)}")
    
    def _normalize_score(self, raw_score: float) -> float:
        """
        Normalize isolation forest score to 0-1 range.
        
        Args:
            raw_score: Raw score from isolation forest (-inf to +inf)
            
        Returns:
            Normalized score (0-1, higher = more anomalous)
        """
        # Isolation forest returns negative scores for anomalies
        # We normalize to 0-1 range with sigmoid-like transformation
        normalized = 1 / (1 + np.exp(raw_score))
        return float(max(0, min(1, normalized)))
    
    def _record_anomaly(self, log_entry: Dict) -> None:
        """
        Record anomaly in history for trend analysis.
        
        Args:
            log_entry: Dictionary containing anomaly details
        """
        self.anomaly_history.append(log_entry)
        
        # Keep history size manageable
        if len(self.anomaly_history) > self.max_history:
            self.anomaly_history.pop(0)
    
    def get_anomaly_statistics(self) -> Dict:
        """
        Get statistics on recent anomalies.
        
        Returns:
            Dictionary containing:
                - total_readings: Total anomalies recorded
                - anomaly_count: Count of detected anomalies
                - anomaly_rate: Percentage of readings that were anomalies
                - avg_score: Average anomaly score
        """
        if not self.anomaly_history:
            return {
                "total_readings": 0,
                "anomaly_count": 0,
                "anomaly_rate": 0.0,
                "avg_score": 0.0
            }
        
        total = len(self.anomaly_history)
        anomalies = sum(1 for a in self.anomaly_history if a["is_anomaly"])
        avg_score = np.mean([a["anomaly_score"] for a in self.anomaly_history])
        
        return {
            "total_readings": total,
            "anomaly_count": anomalies,
            "anomaly_rate": float(anomalies / total * 100),
            "avg_score": float(avg_score)
        }
    
    def trigger_self_healing(self, anomaly_details: Dict) -> bool:
        """
        Trigger self-healing module when anomaly is detected.
        
        Args:
            anomaly_details: Dictionary containing anomaly information
            
        Returns:
            Boolean indicating if self-healing was successfully triggered
        """
        try:
            # Import self_healing module dynamically
            from . import self_healing
            
            logger.info("Triggering self-healing protocol...")
            
            # Prepare healing parameters based on anomaly
            healing_params = self._generate_healing_params(anomaly_details)
            
            # Execute self-healing
            result = self_healing.execute_healing(healing_params)
            
            logger.info(f"Self-healing result: {result}")
            return result
            
        except ImportError:
            logger.error("self_healing module not available")
            return False
        except Exception as e:
            logger.error(f"Failed to trigger self-healing: {str(e)}")
            return False
    
    def _generate_healing_params(self, anomaly_details: Dict) -> Dict:
        """
        Generate healing parameters based on anomaly characteristics.
        
        Args:
            anomaly_details: Dictionary containing anomaly information
            
        Returns:
            Dictionary of healing parameters
        """
        voltage = anomaly_details.get("voltage", 230)
        current = anomaly_details.get("current", 50)
        
        # Determine healing strategy based on anomaly type
        if voltage < 210:
            strategy = "voltage_boost"
        elif voltage > 240:
            strategy = "voltage_reduce"
        elif current > 150:
            strategy = "load_balancing"
        else:
            strategy = "general_optimization"
        
        return {
            "strategy": strategy,
            "target_voltage": 230,
            "max_current": 100,
            "priority": "high" if anomaly_details.get("anomaly_score", 0) > 0.8 else "medium",
            "timestamp": anomaly_details.get("timestamp", datetime.utcnow().isoformat())
        }


# Singleton instance
_detector_instance: Optional[AnomalyDetector] = None


def get_detector() -> AnomalyDetector:
    """
    Get or create the singleton AnomalyDetector instance.
    
    Returns:
        AnomalyDetector instance
    """
    global _detector_instance
    if _detector_instance is None:
        _detector_instance = AnomalyDetector()
    return _detector_instance


def detect_anomaly(voltage: float, current: float, load: float,
                   battery_level: float) -> Dict:
    """
    Convenience function to detect anomalies.
    
    Args:
        voltage: Grid voltage in Volts
        current: Grid current in Amperes
        load: Grid load percentage
        battery_level: Battery level percentage
        
    Returns:
        Dictionary containing:
            - anomaly_score: Float (0-1)
            - is_anomaly: Boolean
            - timestamp: ISO format timestamp
    """
    detector = get_detector()
    anomaly_score, is_anomaly = detector.detect_anomaly(
        voltage, current, load, battery_level
    )
    
    result = {
        "anomaly_score": float(anomaly_score),
        "is_anomaly": bool(is_anomaly),
        "timestamp": datetime.utcnow().isoformat(),
        "voltage": voltage,
        "current": current,
        "load": load,
        "battery_level": battery_level
    }
    
    # Trigger self-healing if anomaly detected
    if is_anomaly:
        detector.trigger_self_healing(result)
    
    return result


def get_statistics() -> Dict:
    """
    Get anomaly statistics.
    
    Returns:
        Dictionary containing anomaly statistics
    """
    detector = get_detector()
    return detector.get_anomaly_statistics()


if __name__ == "__main__":
    # Test the module
    logger.info("Testing Anomaly Detection Module")
    
    detector = get_detector()
    
    # Test normal readings
    test_cases = [
        (230, 50, 45, 85, "Normal"),
        (228, 48, 42, 87, "Normal"),
        (245, 120, 95, 20, "Anomaly - High voltage and current"),
        (210, 180, 100, 10, "Anomaly - Low voltage, high current"),
        (232, 49, 44, 86, "Normal"),
    ]
    
    for voltage, current, load, battery, description in test_cases:
        try:
            score, is_anomaly = detector.detect_anomaly(voltage, current, load, battery)
            status = "ANOMALY" if is_anomaly else "NORMAL"
            print(f"{description}: {status} (score: {score:.3f})")
        except Exception as e:
            print(f"Error: {str(e)}")
    
    # Print statistics
    stats = detector.get_anomaly_statistics()
    print(f"\nStatistics: {json.dumps(stats, indent=2)}")
