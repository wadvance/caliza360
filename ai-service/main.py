import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from predictions.maintenance_predictor import MaintenancePredictor
from predictions.route_optimizer import RouteOptimizer
from predictions.report_generator import ReportGenerator

load_dotenv()

app = Flask(__name__)
CORS(app)

maintenance_predictor = MaintenancePredictor()
route_optimizer = RouteOptimizer()
report_generator = ReportGenerator()


@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "service": "caliza-ai-service",
        "version": "1.0.0",
    })


@app.route("/api/ai/predict-maintenance", methods=["POST"])
def predict_maintenance():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No truck data provided"}), 400

    prediction = maintenance_predictor.predict(data)
    return jsonify(prediction)


@app.route("/api/ai/predict-cost", methods=["POST"])
def predict_cost():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No trip data provided"}), 400

    origin = data.get("origin", {})
    destination = data.get("destination", {})
    truck_weight = data.get("truck_weight_tons", 0)
    cargo_type = data.get("cargo_type", "general")

    route_info = route_optimizer.optimize(origin, destination, {
        "truck_weight_tons": truck_weight,
        "cargo_type": cargo_type,
    })

    fuel_cost_per_liter = data.get("fuel_cost_per_liter", 24.5)
    driver_daily_rate = data.get("driver_daily_rate", 1500)

    fuel_cost = route_info["fuel_estimate_liters"] * fuel_cost_per_liter
    toll_cost = route_info.get("toll_estimate", 0)
    driver_cost = driver_daily_rate * max(1, route_info["estimated_days"])
    maintenance_cost = route_info["distance_km"] * 0.5

    total_cost = fuel_cost + toll_cost + driver_cost + maintenance_cost

    return jsonify({
        "total_cost": round(total_cost, 2),
        "breakdown": {
            "fuel": round(fuel_cost, 2),
            "tolls": round(toll_cost, 2),
            "driver": round(driver_cost, 2),
            "maintenance": round(maintenance_cost, 2),
        },
        "route": route_info,
    })


@app.route("/api/ai/optimize-route", methods=["POST"])
def optimize_route():
    data = request.get_json()
    if not data:
        return jsonify({"error": "No route data provided"}), 400

    origin = data.get("origin", {})
    destination = data.get("destination", {})
    constraints = data.get("constraints", {})

    optimized = route_optimizer.optimize(origin, destination, constraints)
    return jsonify(optimized)


@app.route("/api/ai/fleet-analysis", methods=["GET"])
def fleet_analysis():
    data = request.get_json(silent=True) or {}

    trucks = data.get("trucks", [])
    if not trucks:
        return jsonify({
            "summary": {
                "total_trucks": 0,
                "active_trucks": 0,
                "maintenance_needed": 0,
                "average_efficiency": 0,
            },
            "alerts": [],
            "recommendations": [],
        })

    total = len(trucks)
    active = sum(1 for t in trucks if t.get("status") == "active")
    maintenance_needed = sum(
        1 for t in trucks
        if t.get("current_km", 0) >= t.get("next_maintenance_km", float("inf"))
    )

    efficiencies = [t.get("fuel_efficiency_km_l", 0) for t in trucks]
    avg_efficiency = sum(efficiencies) / len(efficiencies) if efficiencies else 0

    alerts = []
    for truck in trucks:
        if truck.get("current_km", 0) >= truck.get("next_maintenance_km", float("inf")):
            alerts.append({
                "truck_id": truck.get("id"),
                "type": "maintenance_overdue",
                "message": f"Truck {truck.get('plate', 'N/A')} needs maintenance",
            })
        if truck.get("fuel_efficiency_km_l", 10) < 4:
            alerts.append({
                "truck_id": truck.get("id"),
                "type": "low_efficiency",
                "message": f"Truck {truck.get('plate', 'N/A')} has low fuel efficiency",
            })

    recommendations = []
    if avg_efficiency < 5:
        recommendations.append("Fleet fuel efficiency is below target. Review routes and driver behavior.")
    if maintenance_needed > total * 0.2:
        recommendations.append(f"{maintenance_needed} trucks need immediate maintenance attention.")

    return jsonify({
        "summary": {
            "total_trucks": total,
            "active_trucks": active,
            "maintenance_needed": maintenance_needed,
            "average_efficiency": round(avg_efficiency, 2),
        },
        "alerts": alerts,
        "recommendations": recommendations,
    })


if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    debug = os.getenv("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
