<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trucks', function (Blueprint $table) {
            $table->id();
            $table->string('plate')->unique();
            $table->string('brand');
            $table->string('model');
            $table->integer('year');
            $table->string('color')->nullable();
            $table->string('vin_number')->nullable();
            $table->string('engine_type')->nullable();
            $table->float('capacity');
            $table->float('current_mileage')->default(0);
            $table->enum('status', ['active', 'maintenance', 'inactive'])->default('active');
            $table->string('insurance_provider')->nullable();
            $table->string('insurance_policy_number')->nullable();
            $table->date('insurance_start_date')->nullable();
            $table->date('insurance_end_date')->nullable();
            $table->decimal('insurance_cost', 10, 2)->nullable();
            $table->string('circulation_card_number')->nullable();
            $table->date('circulation_card_expiry')->nullable();
            $table->json('photos')->nullable();
            $table->timestamps();
        });

        Schema::create('drivers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('license_number')->nullable();
            $table->string('license_type')->nullable();
            $table->date('license_expiry_date')->nullable();
            $table->string('license_issued_by')->nullable();
            $table->string('curp')->nullable();
            $table->string('rfc')->nullable();
            $table->string('phone')->nullable();
            $table->string('emergency_contact_name')->nullable();
            $table->string('emergency_contact_phone')->nullable();
            $table->string('emergency_contact_relationship')->nullable();
            $table->text('address')->nullable();
            $table->date('hire_date')->nullable();
            $table->enum('status', ['active', 'inactive', 'on_trip'])->default('active');
            $table->foreignId('current_truck_id')->nullable()->constrained('trucks')->nullOnDelete();
            $table->integer('total_trips')->default(0);
            $table->float('total_hours_worked')->default(0);
            $table->float('rating')->nullable();
            $table->string('photo')->nullable();
            $table->json('documents')->nullable();
            $table->timestamps();
        });

        Schema::create('clients', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('rfc')->nullable();
            $table->decimal('balance', 12, 2)->default(0);
            $table->decimal('current_balance', 12, 2)->default(0);
            $table->decimal('total_purchases', 12, 2)->default(0);
            $table->decimal('credit_limit', 12, 2)->default(0);
            $table->decimal('total_tons_purchased', 12, 2)->default(0);
            $table->float('rating')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('company')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('address')->nullable();
            $table->string('rfc')->nullable();
            $table->string('material_type')->nullable();
            $table->decimal('total_purchases', 12, 2)->default(0);
            $table->decimal('outstanding_balance', 12, 2)->default(0);
            $table->float('rating')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('trips', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained()->restrictOnDelete();
            $table->foreignId('driver_id')->constrained()->restrictOnDelete();
            $table->foreignId('client_id')->constrained()->restrictOnDelete();
            $table->string('origin_name');
            $table->string('origin_address')->nullable();
            $table->float('origin_lat')->nullable();
            $table->float('origin_lng')->nullable();
            $table->string('origin_quarry')->nullable();
            $table->string('destination_name');
            $table->string('destination_address')->nullable();
            $table->float('destination_lat')->nullable();
            $table->float('destination_lng')->nullable();
            $table->string('destination_client')->nullable();
            $table->string('material_type');
            $table->float('weight');
            $table->decimal('price_per_ton', 10, 2);
            $table->decimal('total_amount', 12, 2);
            $table->date('scheduled_date');
            $table->time('scheduled_time')->nullable();
            $table->enum('status', ['scheduled', 'in_transit', 'delivered', 'returned', 'cancelled'])->default('scheduled');
            $table->timestamp('departure_time')->nullable();
            $table->timestamp('arrival_time')->nullable();
            $table->timestamp('return_time')->nullable();
            $table->float('start_mileage')->nullable();
            $table->float('end_mileage')->nullable();
            $table->float('distance')->nullable();
            $table->float('fuel_start')->nullable();
            $table->float('fuel_end')->nullable();
            $table->float('fuel_consumed')->nullable();
            $table->decimal('fuel_cost', 10, 2)->nullable();
            $table->decimal('tolls_cost', 10, 2)->nullable();
            $table->decimal('maintenance_cost', 10, 2)->nullable();
            $table->decimal('other_cost', 10, 2)->nullable();
            $table->float('estimated_duration')->nullable();
            $table->float('actual_duration')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('inventory', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('material_type');
            $table->float('current_stock')->default(0);
            $table->string('unit')->default('ton');
            $table->float('min_stock')->default(0);
            $table->float('max_stock')->nullable();
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->string('location')->nullable();
            $table->date('last_entry')->nullable();
            $table->date('last_exit')->nullable();
            $table->string('status')->default('normal');
            $table->timestamps();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('invoice_number')->unique();
            $table->enum('type', ['sale', 'purchase']);
            $table->foreignId('client_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('supplier_id')->nullable()->constrained()->nullOnDelete();
            $table->json('items')->nullable();
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('iva', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->date('issue_date');
            $table->date('due_date')->nullable();
            $table->date('payment_date')->nullable();
            $table->enum('status', ['draft', 'sent', 'paid', 'overdue', 'cancelled'])->default('draft');
            $table->string('payment_method')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->string('type');
            $table->string('severity')->default('low');
            $table->string('title');
            $table->text('message')->nullable();
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->string('entity_type')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamps();
        });

        Schema::create('daily_metrics', function (Blueprint $table) {
            $table->id();
            $table->date('date')->unique();
            $table->integer('total_trips')->default(0);
            $table->float('total_tons_transported')->default(0);
            $table->float('total_income')->default(0);
            $table->float('total_expenses')->default(0);
            $table->float('profit')->default(0);
            $table->float('fuel_consumed')->default(0);
            $table->integer('active_trucks')->default(0);
            $table->integer('active_drivers')->default(0);
            $table->timestamps();
        });

        Schema::create('maintenances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('truck_id')->constrained()->restrictOnDelete();
            $table->string('type');
            $table->text('description')->nullable();
            $table->date('service_date')->nullable();
            $table->float('mileage_at_service')->nullable();
            $table->decimal('cost', 10, 2)->nullable();
            $table->string('status')->default('completed');
            $table->date('next_maintenance_date')->nullable();
            $table->float('next_mileage')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenances');
        Schema::dropIfExists('daily_metrics');
        Schema::dropIfExists('alerts');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('inventory');
        Schema::dropIfExists('trips');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('clients');
        Schema::dropIfExists('drivers');
        Schema::dropIfExists('trucks');
    }
};
