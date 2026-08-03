<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            if (!Schema::hasColumn('trips', 'photos')) {
                $table->json('photos')->nullable()->after('notes');
            }
            if (!Schema::hasColumn('trips', 'customer_signature')) {
                $table->text('customer_signature')->nullable()->after('photos');
            }
            if (!Schema::hasColumn('trips', 'delivery_proof')) {
                $table->text('delivery_proof')->nullable()->after('customer_signature');
            }
            if (!Schema::hasColumn('trips', 'ai_optimized_route')) {
                $table->boolean('ai_optimized_route')->default(false)->after('delivery_proof');
            }
        });
    }

    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            foreach (['photos', 'customer_signature', 'delivery_proof', 'ai_optimized_route'] as $col) {
                if (Schema::hasColumn('trips', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};