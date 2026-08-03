<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Control de costos de producción: gastos operativos por tonelada de cal
        Schema::create('accountant_costs', function (Blueprint $table) {
            $table->id();
            $table->enum('category', ['electricidad', 'combustible', 'maquinaria', 'explosivos', 'personal', 'mantenimiento', 'otros'])->default('otros');
            $table->string('description');
            $table->decimal('amount', 12, 2)->default(0);
            $table->decimal('tonnage', 12, 2)->nullable();
            $table->decimal('unit_cost', 12, 2)->nullable();
            $table->date('cost_date');
            $table->text('notes')->nullable();
            $table->enum('status', ['registrado', 'verificado', 'anulado'])->default('registrado');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Gestión de inventarios y activos: depreciación de maquinaria, hornos y concesión
        Schema::create('accountant_assets', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['maquinaria', 'horno_calero', 'concesion_minera', 'vehiculo', 'instalacion', 'otro'])->default('otro');
            $table->decimal('acquisition_value', 14, 2)->default(0);
            $table->date('acquisition_date');
            $table->decimal('useful_life_years', 8, 2)->nullable();
            $table->decimal('salvage_value', 14, 2)->nullable();
            $table->decimal('accumulated_depreciation', 14, 2)->default(0);
            $table->text('notes')->nullable();
            $table->enum('status', ['activo', 'depreciado', 'retirado'])->default('activo');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Análisis de rentabilidad: presupuestos CAPEX/OPEX
        Schema::create('accountant_budgets', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('budget_type', ['capex', 'opex'])->default('opex');
            $table->enum('category', ['proceso', 'personal', 'combustible', 'energia', 'mantenimiento', 'proyecto', 'otro'])->default('otro');
            $table->decimal('planned_amount', 14, 2)->default(0);
            $table->decimal('actual_amount', 14, 2)->default(0);
            $table->string('period')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['borrador', 'aprobado', 'ejecutado', 'cerrado'])->default('borrador');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Cumplimiento tributario y ambiental: impuestos del sector extractivo y provisiones de cierre
        Schema::create('accountant_compliance', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['impuesto_extractivo', 'impuesto_general', 'provision_cierre_mina', 'mitigacion_ambiental', 'tasa', 'otro'])->default('impuesto_general');
            $table->string('title');
            $table->decimal('amount', 14, 2)->default(0);
            $table->date('due_date')->nullable();
            $table->date('paid_date')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pendiente', 'provisionado', 'pagado', 'vencido'])->default('pendiente');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('accountant_costs');
        Schema::dropIfExists('accountant_assets');
        Schema::dropIfExists('accountant_budgets');
        Schema::dropIfExists('accountant_compliance');
    }
};
