import math
from datetime import datetime, timedelta


class MaintenancePredictor:
    def __init__(self):
        self.model = None
        self.is_trained = False

    def train(self, historical_data):
        if len(historical_data) < 5:
            return {"status": "insufficient_data", "min_required": 5}

        try:
            from sklearn.linear_model import LinearRegression
            import numpy as np

            features = []
            targets = []

            for record in historical_data:
                features.append([
                    record.get("mileage_km", 0),
                    record.get("vehicle_age_years", 0),
                    record.get("trip_frequency_monthly", 0),
                    record.get("avg_load_tons", 0),
                ])
                targets.append(record.get("km_until_next_service", 0))

            X = np.array(features)
            y = np.array(targets)

            self.model = LinearRegression()
            self.model.fit(X, y)
            self.is_trained = True

            return {
                "status": "trained",
                "samples": len(historical_data),
                "score": round(self.model.score(X, y), 4),
            }

        except ImportError:
            return {"status": "error", "message": "scikit-learn not available"}

    def predict(self, truck_data):
        mileage = truck_data.get("current_km", 0)
        age = truck_data.get("age_years", 0)
        frequency = truck_data.get("trip_frequency_monthly", 0)
        load = truck_data.get("avg_load_tons", 0)
        last_service_km = truck_data.get("last_service_km", 0)
        maintenance_interval = truck_data.get("maintenance_interval_km", 15000)

        if self.is_trained and self.model is not None:
            return self._ml_predict(mileage, age, frequency, load)

        return self._rules_predict(
            mileage, age, frequency, load, last_service_km, maintenance_interval
        )

    def _ml_predict(self, mileage, age, frequency, load):
        import numpy as np

        features = np.array([[mileage, age, frequency, load]])
        predicted_km = self.model.predict(features)[0]
        predicted_km = max(0, predicted_km)

        score = min(0.95, max(0.5, 0.7 + (age * 0.02) - (frequency * 0.01)))

        actions = []
        if predicted_km < 1000:
            actions.append("Schedule oil change immediately")
            actions.append("Inspect brake pads")
        if predicted_km < 3000:
            actions.append("Check tire condition")
            actions.append("Inspect transmission fluid")
        if age > 5:
            actions.append("Perform comprehensive engine diagnostic")

        return {
            "predicted_km_until_service": round(predicted_km),
            "predicted_date": (
                datetime.now() + timedelta(days=int(predicted_km / max(frequency * 30, 1)))
            ).strftime("%Y-%m-%d"),
            "confidence": round(score, 2),
            "method": "ml_regression",
            "recommended_actions": actions,
        }

    def _rules_predict(
        self, mileage, age, frequency, load, last_service_km, maintenance_interval
    ):
        km_since_service = mileage - last_service_km if last_service_km else mileage
        km_remaining = max(0, maintenance_interval - km_since_service)

        base_factor = 1.0

        if age > 3:
            base_factor *= 0.85
        if age > 7:
            base_factor *= 0.75
        if age > 10:
            base_factor *= 0.65

        if load > 20:
            base_factor *= 0.9
        if load > 30:
            base_factor *= 0.85

        if frequency > 15:
            base_factor *= 0.9
        if frequency > 25:
            base_factor *= 0.85

        adjusted_km = km_remaining * base_factor

        confidence = 0.6
        if mileage > 50000:
            confidence += 0.05
        if last_service_km is not None:
            confidence += 0.1

        actions = []
        if adjusted_km < 1000:
            actions.append("Schedule oil change and filter replacement")
            actions.append("Check brake pads and rotors")
            actions.append("Inspect tire tread depth")
        elif adjusted_km < 3000:
            actions.append("Schedule routine oil change")
            actions.append("Check tire pressure and alignment")
            actions.append("Inspect coolant levels")
        elif adjusted_km < 5000:
            actions.append("Plan upcoming maintenance window")
            actions.append("Monitor fluid levels closely")
        else:
            actions.append("Continue regular monitoring")

        if age > 5 and mileage > 100000:
            actions.append("Perform full engine diagnostic")

        return {
            "predicted_km_until_service": round(adjusted_km),
            "predicted_date": (
                datetime.now() + timedelta(days=int(adjusted_km / max(frequency * 30, 1)))
            ).strftime("%Y-%m-%d"),
            "confidence": round(min(confidence, 0.9), 2),
            "method": "rules_based",
            "recommended_actions": actions,
        }
