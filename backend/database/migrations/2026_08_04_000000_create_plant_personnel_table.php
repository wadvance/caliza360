<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plant_personnel', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('cedula')->nullable();
            $table->integer('edad')->nullable();
            $table->string('direccion')->nullable();
            $table->string('celular')->nullable();
            $table->string('tipo_sangre')->nullable();
            $table->enum('tipo', ['administrativo', 'planta'])->default('planta');
            $table->string('position')->nullable();
            $table->enum('status', ['activo', 'inactivo'])->default('activo');
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plant_personnel');
    }
};
