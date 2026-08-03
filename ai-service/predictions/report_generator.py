from datetime import datetime, timedelta


class ReportGenerator:
    def generate_daily_summary(self, data):
        trips = data.get("trucks", [])
        total_trips = len(trips)
        total_distance = sum(t.get("distance_km", 0) for t in trips)
        total_revenue = sum(t.get("revenue", 0) for t in trips)
        total_cost = sum(t.get("cost", 0) for t in trips)
        fuel_used = sum(t.get("fuel_liters", 0) for t in trips)

        avg_efficiency = 0
        if fuel_used > 0:
            avg_efficiency = round(total_distance / fuel_used, 2)

        active_drivers = len(set(t.get("driver_id") for t in trips if t.get("driver_id")))

        alerts = []
        for trip in trips:
            if trip.get("delay_minutes", 0) > 30:
                alerts.append({
                    "type": "delay",
                    "trip_id": trip.get("id"),
                    "message": f"Trip delayed {trip['delay_minutes']} minutes",
                })
            if trip.get("fuel_liters", 0) > trip.get("distance_km", 1) * 0.06:
                alerts.append({
                    "type": "high_fuel",
                    "trip_id": trip.get("id"),
                    "message": "Above-average fuel consumption detected",
                })

        return {
            "report_type": "daily_summary",
            "date": data.get("date", datetime.now().strftime("%Y-%m-%d")),
            "summary": {
                "total_trips": total_trips,
                "total_distance_km": round(total_distance, 2),
                "total_revenue": round(total_revenue, 2),
                "total_cost": round(total_cost, 2),
                "net_profit": round(total_revenue - total_cost, 2),
                "fuel_used_liters": round(fuel_used, 2),
                "avg_fuel_efficiency": avg_efficiency,
                "active_drivers": active_drivers,
            },
            "alerts": alerts,
            "generated_at": datetime.now().isoformat(),
        }

    def generate_weekly_report(self, data):
        daily_data = data.get("daily_summaries", [])
        if not daily_data:
            return {
                "report_type": "weekly_report",
                "status": "no_data",
                "message": "No daily data available for weekly report",
            }

        total_trips = sum(d.get("total_trips", 0) for d in daily_data)
        total_distance = sum(d.get("total_distance_km", 0) for d in daily_data)
        total_revenue = sum(d.get("total_revenue", 0) for d in daily_data)
        total_cost = sum(d.get("total_cost", 0) for d in daily_data)

        daily_trips = [d.get("total_trips", 0) for d in daily_data]
        avg_daily_trips = round(sum(daily_trips) / len(daily_trips), 1) if daily_trips else 0

        best_day = max(daily_data, key=lambda d: d.get("net_profit", 0)) if daily_data else None
        worst_day = min(daily_data, key=lambda d: d.get("net_profit", 0)) if daily_data else None

        trend = "stable"
        if len(daily_data) >= 3:
            first_half = sum(d.get("net_profit", 0) for d in daily_data[: len(daily_data) // 2])
            second_half = sum(d.get("net_profit", 0) for d in daily_data[len(daily_data) // 2 :])
            if second_half > first_half * 1.1:
                trend = "improving"
            elif second_half < first_half * 0.9:
                trend = "declining"

        return {
            "report_type": "weekly_report",
            "period": {
                "start": data.get("start_date"),
                "end": data.get("end_date"),
            },
            "summary": {
                "total_trips": total_trips,
                "total_distance_km": round(total_distance, 2),
                "total_revenue": round(total_revenue, 2),
                "total_cost": round(total_cost, 2),
                "net_profit": round(total_revenue - total_cost, 2),
                "avg_daily_trips": avg_daily_trips,
                "profit_trend": trend,
            },
            "highlights": {
                "best_day": {
                    "date": best_day.get("date") if best_day else None,
                    "profit": best_day.get("net_profit", 0) if best_day else 0,
                },
                "worst_day": {
                    "date": worst_day.get("date") if worst_day else None,
                    "profit": worst_day.get("net_profit", 0) if worst_day else 0,
                },
            },
            "generated_at": datetime.now().isoformat(),
        }

    def generate_fleet_status(self, data):
        trucks = data.get("trucks", [])
        if not trucks:
            return {
                "report_type": "fleet_status",
                "status": "no_data",
                "trucks": [],
            }

        fleet_summary = {
            "total": len(trucks),
            "active": 0,
            "in_maintenance": 0,
            "idle": 0,
        }

        truck_reports = []
        alerts = []

        for truck in trucks:
            status = truck.get("status", "unknown")
            if status == "active":
                fleet_summary["active"] += 1
            elif status == "maintenance":
                fleet_summary["in_maintenance"] += 1
            else:
                fleet_summary["idle"] += 1

            health_score = self._calculate_truck_health(truck)

            truck_reports.append({
                "id": truck.get("id"),
                "plate": truck.get("plate"),
                "status": status,
                "current_km": truck.get("current_km", 0),
                "fuel_efficiency": truck.get("fuel_efficiency_km_l", 0),
                "health_score": health_score,
                "next_maintenance_km": truck.get("next_maintenance_km", 0),
                "days_since_last_service": truck.get("days_since_last_service", 0),
            })

            if health_score < 50:
                alerts.append({
                    "truck_id": truck.get("id"),
                    "type": "critical_health",
                    "message": f"Truck {truck.get('plate', 'N/A')} health score critically low ({health_score})",
                })
            elif health_score < 70:
                alerts.append({
                    "truck_id": truck.get("id"),
                    "type": "warning_health",
                    "message": f"Truck {truck.get('plate', 'N/A')} needs attention (score: {health_score})",
                })

        return {
            "report_type": "fleet_status",
            "fleet_summary": fleet_summary,
            "trucks": truck_reports,
            "alerts": alerts,
            "generated_at": datetime.now().isoformat(),
        }

    def generate_cost_analysis(self, data):
        trips = data.get("trips", [])
        fixed_costs = data.get("fixed_costs", {})

        fuel_total = sum(t.get("fuel_cost", 0) for t in trips)
        maintenance_total = sum(t.get("maintenance_cost", 0) for t in trips)
        toll_total = sum(t.get("toll_cost", 0) for t in trips)
        insurance = fixed_costs.get("insurance_monthly", 0)
        salaries = fixed_costs.get("salaries_monthly", 0)
        depreciation = fixed_costs.get("depreciation_monthly", 0)

        variable_total = fuel_total + maintenance_total + toll_total
        fixed_total = insurance + salaries + depreciation
        grand_total = variable_total + fixed_total

        total_revenue = sum(t.get("revenue", 0) for t in trips)

        cost_per_km = 0
        total_distance = sum(t.get("distance_km", 0) for t in trips)
        if total_distance > 0:
            cost_per_km = round(grand_total / total_distance, 2)

        cost_by_category = {
            "fuel": round(fuel_total, 2),
            "maintenance": round(maintenance_total, 2),
            "tolls": round(toll_total, 2),
            "insurance": round(insurance, 2),
            "salaries": round(salaries, 2),
            "depreciation": round(depreciation, 2),
        }

        breakdown_pct = {}
        if grand_total > 0:
            for key, val in cost_by_category.items():
                breakdown_pct[key] = round((val / grand_total) * 100, 1)

        return {
            "report_type": "cost_analysis",
            "summary": {
                "total_variable_costs": round(variable_total, 2),
                "total_fixed_costs": round(fixed_total, 2),
                "grand_total": round(grand_total, 2),
                "total_revenue": round(total_revenue, 2),
                "net_profit": round(total_revenue - grand_total, 2),
                "cost_per_km": cost_per_km,
                "profit_margin_pct": round(
                    ((total_revenue - grand_total) / total_revenue * 100) if total_revenue > 0 else 0, 2
                ),
            },
            "cost_by_category": cost_by_category,
            "breakdown_percentage": breakdown_pct,
            "recommendations": self._cost_recommendations(cost_by_category, total_revenue),
            "generated_at": datetime.now().isoformat(),
        }

    def _calculate_truck_health(self, truck):
        score = 100

        km = truck.get("current_km", 0)
        next_service = truck.get("next_maintenance_km", km + 15000)
        if km > next_service:
            score -= 40
        elif km > next_service - 2000:
            score -= 15

        efficiency = truck.get("fuel_efficiency_km_l", 8)
        if efficiency < 4:
            score -= 20
        elif efficiency < 5.5:
            score -= 10

        age = truck.get("age_years", 0)
        if age > 8:
            score -= 15
        elif age > 5:
            score -= 5

        return max(0, min(100, score))

    def _cost_recommendations(self, costs, revenue):
        recs = []

        if revenue > 0:
            fuel_pct = (costs.get("fuel", 0) / revenue) * 100
            if fuel_pct > 35:
                recs.append("Fuel costs exceed 35% of revenue. Review routes and driving habits.")

        maintenance = costs.get("maintenance", 0)
        if revenue > 0 and (maintenance / revenue) > 0.15:
            recs.append("Maintenance costs are high. Consider fleet renewal for oldest vehicles.")

        if costs.get("tolls", 0) > costs.get("fuel", 0) * 0.5:
            recs.append("Toll costs are significant. Evaluate alternative routes.")

        return recs
