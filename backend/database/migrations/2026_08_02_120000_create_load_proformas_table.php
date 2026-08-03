<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('load_proformas', function (Blueprint $table) {
            $table->id();
            $table->string('proforma_number')->unique();
            $table->date('date');
            $table->foreignId('truck_id')->constrained()->restrictOnDelete();
            $table->foreignId('driver_id')->constrained()->restrictOnDelete();
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->string('origin_quarry')->nullable();
            $table->string('destination_name');
            $table->string('material_type')->default('Caliza');
            $table->float('weight_tons');
            $table->integer('sack_count')->default(0);
            $table->float('gross_weight')->nullable();
            $table->float('tare_weight')->nullable();
            $table->float('net_weight')->nullable();
            $table->decimal('unit_price', 10, 2)->nullable();
            $table->decimal('total_amount', 12, 2)->nullable();
            $table->string('status')->default('created');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('load_proformas');
    }
};
