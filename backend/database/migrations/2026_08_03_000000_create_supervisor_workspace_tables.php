<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Planificación: actividades diarias del personal según planes de extracción y procesamiento
        Schema::create('supervisor_planning', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('activity_type', ['extraccion', 'procesamiento', 'chancado', 'mezclado', 'mantenimiento', 'otro'])->default('otro');
            $table->date('planned_date');
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->string('area')->nullable();
            $table->string('assigned_person')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['planificado', 'en_proceso', 'completado', 'cancelado'])->default('planificado');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Recepción y trituración: recepción de caliza y chancado primario/secundario
        Schema::create('supervisor_reception', function (Blueprint $table) {
            $table->id();
            $table->enum('stage', ['recepcion', 'chancado_primario', 'chancado_secundario'])->default('recepcion');
            $table->string('material');
            $table->decimal('tonnage', 12, 2)->default(0);
            $table->date('processed_date');
            $table->string('origin')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['recibido', 'en_proceso', 'completado', 'cancelado'])->default('recibido');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Mezclado (blending): supervisión de la mezcla de materias primas
        Schema::create('supervisor_blending', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('materials')->nullable();
            $table->decimal('target_spec', 8, 2)->nullable();
            $table->date('blend_date');
            $table->text('notes')->nullable();
            $table->enum('status', ['planificado', 'en_proceso', 'completado', 'cancelado'])->default('planificado');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Gestión de calidad: monitoreo de pureza y granulometría
        Schema::create('supervisor_quality', function (Blueprint $table) {
            $table->id();
            $table->string('material');
            $table->decimal('purity', 8, 2)->nullable();
            $table->string('granulometry')->nullable();
            $table->string('industry')->nullable();
            $table->date('checked_date');
            $table->text('notes')->nullable();
            $table->enum('status', ['cumple', 'no_cumple', 'pendiente'])->default('pendiente');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Seguridad y medio ambiente: protocolos EPP / IPERC y control de riesgos
        Schema::create('supervisor_safety', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['protocolo_epp', 'iperc', 'ventilacion', 'polucion', 'control_riesgo'])->default('protocolo_epp');
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('risk_level', ['bajo', 'medio', 'alto', 'critico'])->default('medio');
            $table->enum('status', ['verificado', 'en_atencion', 'pendiente', 'incumplido'])->default('pendiente');
            $table->date('checked_date');
            $table->text('action_plan')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Liderazgo de equipo: asignación de tareas al personal técnico y operativo
        Schema::create('supervisor_tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('assignee')->nullable();
            $table->enum('priority', ['alta', 'media', 'baja'])->default('media');
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pendiente', 'en_proceso', 'completada', 'cancelada'])->default('pendiente');
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supervisor_planning');
        Schema::dropIfExists('supervisor_reception');
        Schema::dropIfExists('supervisor_blending');
        Schema::dropIfExists('supervisor_quality');
        Schema::dropIfExists('supervisor_safety');
        Schema::dropIfExists('supervisor_tasks');
    }
};
