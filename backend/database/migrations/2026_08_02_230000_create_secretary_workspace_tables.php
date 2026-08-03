<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Agenda: citas y reuniones (presenciales o virtuales)
        Schema::create('secretary_agenda', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->enum('event_type', ['cita', 'reunion'])->default('cita');
            $table->enum('mode', ['presencial', 'virtual'])->default('presencial');
            $table->dateTime('starts_at');
            $table->dateTime('ends_at');
            $table->string('participants')->nullable();
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['pendiente', 'confirmada', 'realizada', 'cancelada'])->default('pendiente');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Recepción: visitantes, llamadas y consultas
        Schema::create('secretary_reception', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['visita', 'llamada', 'consulta'])->default('visita');
            $table->string('person_name');
            $table->string('company')->nullable();
            $table->string('phone')->nullable();
            $table->string('subject')->nullable();
            $table->text('notes')->nullable();
            $table->enum('status', ['recibido', 'canalizado', 'atendido'])->default('recibido');
            $table->dateTime('attended_at');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Archivo: documentación física y digital
        Schema::create('secretary_documents', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category');
            $table->enum('format', ['fisico', 'digital'])->default('digital');
            $table->string('location')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Soporte logístico: salas, suministros, viajes y reservas
        Schema::create('secretary_logistics', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['sala', 'suministro', 'viaje', 'reserva'])->default('suministro');
            $table->string('title');
            $table->text('details')->nullable();
            $table->dateTime('date')->nullable();
            $table->enum('status', ['pendiente', 'en_proceso', 'completado', 'cancelado'])->default('pendiente');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('secretary_agenda');
        Schema::dropIfExists('secretary_reception');
        Schema::dropIfExists('secretary_documents');
        Schema::dropIfExists('secretary_logistics');
    }
};
