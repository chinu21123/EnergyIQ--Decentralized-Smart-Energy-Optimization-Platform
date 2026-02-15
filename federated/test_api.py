#!/usr/bin/env python3
"""
Test script to verify the API is running
"""

import requests
import json
import sys

def test_api():
    """Test the anomaly detection API"""
    
    print("=" * 60)
    print("Testing EnergyFlow Anomaly Detection API")
    print("=" * 60)
    
    base_url = "http://localhost:8000"
    
    # Test 1: Health check
    print("\n1️⃣  Testing /health endpoint...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            print("✅ Health check: SUCCESS")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Connection error: {e}")
        return False
    
    # Test 2: Normal reading
    print("\n2️⃣  Testing /detect-anomaly with NORMAL reading...")
    normal_data = {
        "node_id": "NODE-001",
        "voltage": 230,
        "current": 50,
        "load": 45,
        "battery_level": 85
    }
    try:
        response = requests.post(f"{base_url}/detect-anomaly", json=normal_data, timeout=5)
        if response.status_code == 200:
            result = response.json()
            print("✅ Normal detection: SUCCESS")
            print(f"   Status: {result['status']}")
            print(f"   Score: {result['anomaly_score']:.2%}")
        else:
            print(f"❌ Request failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Request error: {e}")
    
    # Test 3: Anomaly reading
    print("\n3️⃣  Testing /detect-anomaly with ANOMALY reading...")
    anomaly_data = {
        "node_id": "NODE-002",
        "voltage": 245,
        "current": 120,
        "load": 95,
        "battery_level": 20
    }
    try:
        response = requests.post(f"{base_url}/detect-anomaly", json=anomaly_data, timeout=5)
        if response.status_code == 200:
            result = response.json()
            print("✅ Anomaly detection: SUCCESS")
            print(f"   Status: {result['status']}")
            print(f"   Score: {result['anomaly_score']:.2%}")
        else:
            print(f"❌ Request failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Request error: {e}")
    
    # Test 4: Statistics
    print("\n4️⃣  Testing /statistics endpoint...")
    try:
        response = requests.get(f"{base_url}/statistics", timeout=5)
        if response.status_code == 200:
            result = response.json()
            print("✅ Statistics: SUCCESS")
            print(f"   Total readings: {result['total_readings']}")
            print(f"   Anomalies: {result['anomaly_count']}")
            print(f"   Anomaly rate: {result['anomaly_rate']:.1f}%")
    except Exception as e:
        print(f"❌ Request error: {e}")
    
    print("\n" + "=" * 60)
    print("All tests completed!")
    print("=" * 60)
    print("\n📍 API Documentation: http://localhost:8000/docs")
    print("📍 Frontend: http://localhost:3000")
    print("\n")

if __name__ == "__main__":
    test_api()
