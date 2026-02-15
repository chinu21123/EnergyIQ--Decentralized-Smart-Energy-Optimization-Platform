"""
FastAPI Server for EnergyFlow Anomaly Detection

This server provides REST endpoints for anomaly detection and energy grid monitoring.

Run with: uvicorn api_server:app --host 0.0.0.0 --port 8000 --reload
"""

import logging
import sys
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from anomaly_detection import get_detector, AnomalyDetectionError

# Add parent directory to path for self_healing import
sys.path.insert(0, '..')
from backend.self_healing import SelfHealingController, FaultThresholds

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="EnergyFlow Anomaly Detection API",
    description="Smart Energy Grid Anomaly Detection and Monitoring",
    version="1.0.0"
)

# Initialize self-healing controller
try:
    self_healing_controller = SelfHealingController()
    logger.info("Self-healing controller initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize self-healing controller: {str(e)}")
    self_healing_controller = None


# Add CORS middleware to allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request/Response Models
class AnomalyDetectionRequest(BaseModel):
    """Request model for anomaly detection"""
    node_id: str = Field(..., description="Unique node identifier")
    voltage: float = Field(..., description="Grid voltage in Volts", ge=200, le=250)
    current: float = Field(..., description="Grid current in Amperes", ge=0, le=200)
    load: float = Field(..., description="Grid load percentage", ge=0, le=100)
    battery_level: float = Field(..., description="Battery level percentage", ge=0, le=100)


class AnomalyDetectionResponse(BaseModel):
    """Response model for anomaly detection"""
    status: str = Field(..., description="Detection status: ANOMALY or NORMAL")
    anomaly_score: float = Field(..., description="Anomaly score 0-1")
    node_id: str = Field(..., description="Node identifier")
    voltage: float = Field(..., description="Grid voltage")
    current: float = Field(..., description="Grid current")
    load: float = Field(..., description="Grid load")
    battery_level: float = Field(..., description="Battery level")
    timestamp: str = Field(..., description="ISO format timestamp")


class SelfHealRequest(BaseModel):
    """Request model for self-healing fault recovery"""
    node_id: str = Field(..., description="Unique node identifier", min_length=1)
    voltage: float = Field(..., description="Grid voltage in Volts", ge=150, le=300)
    load: float = Field(..., description="Grid load percentage", ge=0, le=200)
    battery_level: float = Field(..., description="Battery level percentage", ge=0, le=100)


class SelfHealResponse(BaseModel):
    """Response model for self-healing fault recovery"""
    status: str = Field(..., description="Recovery status: STABLE or FAULT_DETECTED")
    action_taken: str = Field(..., description="Action performed: NONE or ENERGY_REROUTED")
    node_id: str = Field(..., description="Node identifier")
    grid_status: str = Field(..., description="Grid status: STABLE, DEGRADED, or CRITICAL")
    fault_report: Optional[dict] = Field(None, description="Fault detection report")
    reroute_plan: Optional[dict] = Field(None, description="Energy rerouting plan")
    updated_load: Optional[float] = Field(None, description="Updated node load after recovery")
    updated_battery: Optional[float] = Field(None, description="Updated battery level after recovery")
    timestamp: str = Field(..., description="ISO format timestamp")


class SelfHealErrorResponse(BaseModel):
    """Error response model for self-healing endpoint"""
    error: str = Field(..., description="Error message")
    detail: str = Field(..., description="Detailed error description")
    node_id: str = Field(..., description="Node identifier from request")
    timestamp: str = Field(..., description="ISO format timestamp")


class StatisticsResponse(BaseModel):
    """Response model for anomaly statistics"""
    total_readings: int = Field(..., description="Total readings processed")
    anomaly_count: int = Field(..., description="Number of anomalies detected")
    anomaly_rate: float = Field(..., description="Percentage of anomalies")
    avg_score: float = Field(..., description="Average anomaly score")
    best_state: list[int] = Field(..., description="Best routing configuration")
    best_score: float = Field(..., description="Score of best configuration")
    top_solutions: list[dict] = Field(..., description="Top-k solutions")
    num_nodes: int = Field(..., description="Number of nodes optimized")
    num_iterations: int = Field(..., description="Number of amplification iterations")
    timestamp: str = Field(..., description="ISO format timestamp")


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "status": "operational",
        "service": "EnergyFlow Anomaly Detection API",
        "version": "1.0.0"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    try:
        detector = get_detector()
        return {
            "status": "healthy",
            "detector": "initialized",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Service unavailable"
        )


@app.post(
    "/detect-anomaly",
    response_model=AnomalyDetectionResponse,
    tags=["Anomaly Detection"],
    summary="Detect anomalies in energy grid metrics"
)
async def detect_anomaly(request: AnomalyDetectionRequest) -> AnomalyDetectionResponse:
    """
    Detect anomalies in energy grid metrics.
    
    This endpoint accepts energy grid metrics and uses an Isolation Forest model
    to detect anomalies. Returns anomaly score and status.
    
    Args:
        request: AnomalyDetectionRequest with energy metrics
        
    Returns:
        AnomalyDetectionResponse with status and anomaly score
        
    Raises:
        HTTPException: If detection fails or invalid input
    """
    try:
        logger.info(
            f"Anomaly detection request - Node: {request.node_id}, "
            f"V: {request.voltage}V, I: {request.current}A, "
            f"L: {request.load}%, B: {request.battery_level}%"
        )
        
        # Get detector instance
        detector = get_detector()
        
        # Perform anomaly detection
        anomaly_score, is_anomaly = detector.detect_anomaly(
            voltage=request.voltage,
            current=request.current,
            load=request.load,
            battery_level=request.battery_level
        )
        
        # Determine status
        status = "ANOMALY" if is_anomaly else "NORMAL"
        
        # Log result
        logger.info(
            f"Detection result - Node: {request.node_id}, "
            f"Status: {status}, Score: {anomaly_score:.3f}"
        )
        
        # Return response
        response = AnomalyDetectionResponse(
            status=status,
            anomaly_score=anomaly_score,
            node_id=request.node_id,
            voltage=request.voltage,
            current=request.current,
            load=request.load,
            battery_level=request.battery_level,
            timestamp=datetime.utcnow().isoformat()
        )
        
        return response
        
    except ValueError as e:
        logger.error(f"Invalid input: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input: {str(e)}"
        )
    except AnomalyDetectionError as e:
        logger.error(f"Detection error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Detection failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )


@app.post(
    "/batch-detect",
    tags=["Anomaly Detection"],
    summary="Batch detect anomalies for multiple nodes"
)
async def batch_detect_anomaly(requests: list[AnomalyDetectionRequest]):
    """
    Detect anomalies for multiple nodes in a single request.
    
    Args:
        requests: List of AnomalyDetectionRequest objects
        
    Returns:
        List of AnomalyDetectionResponse objects
    """
    try:
        logger.info(f"Batch detection request - {len(requests)} nodes")
        
        results = []
        for req in requests:
            # Reuse single detection logic
            detector = get_detector()
            anomaly_score, is_anomaly = detector.detect_anomaly(
                voltage=req.voltage,
                current=req.current,
                load=req.load,
                battery_level=req.battery_level
            )
            
            status = "ANOMALY" if is_anomaly else "NORMAL"
            
            results.append(AnomalyDetectionResponse(
                status=status,
                anomaly_score=anomaly_score,
                node_id=req.node_id,
                voltage=req.voltage,
                current=req.current,
                load=req.load,
                battery_level=req.battery_level,
                timestamp=datetime.utcnow().isoformat()
            ))
        
        logger.info(f"Batch detection complete - {len(results)} results")
        return results
        
    except Exception as e:
        logger.error(f"Batch detection error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Batch detection failed: {str(e)}"
        )


@app.get(
    "/statistics",
    response_model=StatisticsResponse,
    tags=["Analytics"],
    summary="Get anomaly statistics"
)
async def get_statistics() -> StatisticsResponse:
    """
    Get statistics on recent anomaly detections.
    
    Returns:
        StatisticsResponse with anomaly statistics
    """
    try:
        detector = get_detector()
        stats = detector.get_anomaly_statistics()
        
        return StatisticsResponse(
            total_readings=stats["total_readings"],
            anomaly_count=stats["anomaly_count"],
            anomaly_rate=stats["anomaly_rate"],
            avg_score=stats["avg_score"]
        )
        
    except Exception as e:
        logger.error(f"Statistics error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve statistics"
        )


@app.post(
    "/reset-statistics",
    tags=["Analytics"],
    summary="Reset anomaly statistics"
)
async def reset_statistics():
    """Reset the anomaly detection statistics and history."""
    try:
        detector = get_detector()
        detector.anomaly_history = []
        logger.info("Statistics reset")
        return {"status": "success", "message": "Statistics reset"}
    except Exception as e:
        logger.error(f"Reset error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to reset statistics"
        )


# Self-Healing Fault Recovery Endpoints

@app.post(
    "/self-heal",
    response_model=SelfHealResponse,
    tags=["Self-Healing"],
    summary="Detect and recover from faults using self-healing protocol"
)
async def self_heal(request: SelfHealRequest) -> SelfHealResponse:
    """
    Detect faults in energy grid and execute automated recovery actions.
    
    This endpoint monitors for various fault conditions:
    - Low voltage (< 200V)
    - High voltage (> 250V)
    - Critical battery level (< 15%)
    - Load overload (> 90%)
    
    If a fault is detected, the system automatically:
    1. Reduces load by 20%
    2. Redistributes energy to safer nodes
    3. Activates battery support
    4. Returns detailed recovery plan
    
    Args:
        request: SelfHealRequest with grid state
        
    Returns:
        SelfHealResponse with recovery status and plan
        
    Raises:
        HTTPException: If controller unavailable or processing fails
    """
    try:
        # Validate controller is initialized
        if self_healing_controller is None:
            logger.error("Self-healing controller not available")
            raise HTTPException(
                status_code=503,
                detail="Self-healing service unavailable"
            )
        
        logger.info(
            f"Self-heal request - Node: {request.node_id}, "
            f"V: {request.voltage}V, L: {request.load}%, B: {request.battery_level}%"
        )
        
        # Prepare grid data dictionary
        grid_data = {
            'node_id': request.node_id,
            'voltage': request.voltage,
            'load': request.load,
            'max_capacity': 100.0,  # Standard capacity
            'battery_level': request.battery_level,
            'battery_capacity': 100.0,  # Standard capacity
            'trust_score': 0.85  # Default trust score
        }
        
        # Execute fault detection and recovery
        result = self_healing_controller.handle_fault(grid_data)
        
        # Log result
        logger.info(
            f"Self-heal result - Node: {request.node_id}, "
            f"Status: {result['status']}, "
            f"Action: {result['action_taken']}, "
            f"Grid Status: {result['grid_status']}"
        )
        
        # Build response
        response = SelfHealResponse(
            status=result['status'],
            action_taken=result['action_taken'],
            node_id=result['node_id'],
            grid_status=result['grid_status'],
            fault_report=result.get('fault_report'),
            reroute_plan=result.get('reroute_plan'),
            updated_load=result.get('updated_load'),
            updated_battery=result.get('updated_battery'),
            timestamp=result['timestamp']
        )
        
        return response
        
    except ValueError as e:
        logger.error(f"Invalid input for node {request.node_id}: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Self-healing error for node {request.node_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Self-healing process failed: {str(e)}"
        )


@app.get(
    "/self-heal/recovery-history",
    tags=["Self-Healing"],
    summary="Get self-healing recovery history and statistics"
)
async def get_recovery_history():
    """
    Retrieve summary of all fault recovery events.
    
    Returns statistics on:
    - Total recovery events processed
    - Critical faults encountered
    - Degraded faults handled
    - Total faults detected
    - Recent recovery events
    
    Returns:
        Dictionary with recovery statistics and recent events
        
    Raises:
        HTTPException: If controller unavailable
    """
    try:
        if self_healing_controller is None:
            raise HTTPException(
                status_code=503,
                detail="Self-healing service unavailable"
            )
        
        summary = self_healing_controller.get_recovery_summary()
        
        logger.info(
            f"Recovery history retrieved - "
            f"Total events: {summary['total_recoveries']}, "
            f"Critical: {summary['critical_faults']}, "
            f"Degraded: {summary['degraded_faults']}"
        )
        
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'recovery_history': summary
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve recovery history: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve recovery history"
        )


# Error handlers
@app.exception_handler(ValueError)
async def value_error_handler(request, exc):
    """Handle validation errors"""
    logger.error(f"Validation error: {str(exc)}")
    return {
        "error": "Validation Error",
        "detail": str(exc),
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    
    logger.info("Starting EnergyFlow Anomaly Detection API Server")
    logger.info("Visit http://localhost:8000/docs for API documentation")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
