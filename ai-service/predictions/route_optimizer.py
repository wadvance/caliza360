import math
from datetime import datetime


class RouteOptimizer:
    FUEL_CONSUMPTION_BASE = 3.5  # liters per 100km for empty truck
    COST_PER_KM_MAINTENANCE = 0.5
    TOLL_RATES = {
        "highway": 2.5,
        "toll_road": 3.0,
        "rural": 0.0,
    }

    def optimize(self, origin, destination, constraints=None):
        constraints = constraints or {}

        lat1 = origin.get("lat", 0)
        lon1 = origin.get("lng", 0)
        lat2 = destination.get("lat", 0)
        lon2 = destination.get("lng", 0)

        distance_km = self.haversine(lat1, lon1, lat2, lon2)

        road_factor = constraints.get("road_factor", 1.3)
        adjusted_distance = distance_km * road_factor

        truck_weight = constraints.get("truck_weight_tons", 0)
        weight_factor = 1.0 + (truck_weight * 0.02)

        speed = self._estimate_speed(constraints)
        hours = adjusted_distance / max(speed, 1)
        estimated_days = max(1, math.ceil(hours / 10))

        fuel_consumption = self.FUEL_CONSUMPTION_BASE * weight_factor
        fuel_estimate = adjusted_distance * fuel_consumption / 100

        toll_estimate = self._estimate_tolls(adjusted_distance, constraints)

        maintenance_cost = adjusted_distance * self.COST_PER_KM_MAINTENANCE

        traffic_level = self._estimate_traffic(constraints)

        return {
            "distance_km": round(distance_km, 2),
            "adjusted_distance_km": round(adjusted_distance, 2),
            "estimated_hours": round(hours, 1),
            "estimated_days": estimated_days,
            "estimated_speed_kmh": round(speed, 1),
            "fuel_estimate_liters": round(fuel_estimate, 2),
            "fuel_consumption_per_100km": round(fuel_consumption, 2),
            "toll_estimate": round(toll_estimate, 2),
            "maintenance_cost_estimate": round(maintenance_cost, 2),
            "traffic_level": traffic_level,
            "route_type": constraints.get("route_type", "standard"),
            "warnings": self._generate_warnings(constraints),
        }

    def haversine(self, lat1, lon1, lat2, lon2):
        R = 6371.0

        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)

        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad

        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return R * c

    def _estimate_speed(self, constraints):
        route_type = constraints.get("route_type", "standard")
        hour = constraints.get("hour_of_day", datetime.now().hour)

        base_speed = {
            "highway": 80,
            "rural": 50,
            "urban": 35,
            "standard": 60,
        }.get(route_type, 60)

        if 7 <= hour <= 9 or 17 <= hour <= 19:
            base_speed *= 0.6
        elif 12 <= hour <= 14:
            base_speed *= 0.8

        weight = constraints.get("truck_weight_tons", 0)
        if weight > 20:
            base_speed *= 0.85
        if weight > 30:
            base_speed *= 0.8

        return base_speed

    def _estimate_tolls(self, distance_km, constraints):
        route_type = constraints.get("route_type", "standard")
        toll_rate = self.TOLL_RATES.get(route_type, 2.0)

        num_tolls = max(1, int(distance_km / 50))
        return num_tolls * toll_rate

    def _estimate_traffic(self, constraints):
        hour = constraints.get("hour_of_day", datetime.now().hour)

        if 7 <= hour <= 9 or 17 <= hour <= 19:
            return "heavy"
        elif 10 <= hour <= 16:
            return "moderate"
        else:
            return "light"

    def _generate_warnings(self, constraints):
        warnings = []

        weight = constraints.get("truck_weight_tons", 0)
        if weight > 25:
            warnings.append("Heavy load: verify bridge weight limits on route")

        hour = constraints.get("hour_of_day", datetime.now().hour)
        if 7 <= hour <= 9 or 17 <= hour <= 19:
            warnings.append("Peak traffic hours: expect significant delays")

        if constraints.get("weather") == "rain":
            warnings.append("Rain conditions: reduce speed and increase following distance")

        return warnings
