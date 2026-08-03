<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            // Pesaje digital en báscula
            $table->float('gross_weight')->nullable()->after('weight');
            $table->float('tare_weight')->nullable()->after('gross_weight');
            $table->float('net_weight')->nullable()->after('tare_weight');
            $table->timestamp('weighed_at')->nullable()->after('net_weight');

            // Control de calidad del producto
            $table->string('batch_code')->nullable()->after('weighed_at');
            $table->enum('quality_status', ['pending', 'approved', 'rejected'])->default('pending')->after('batch_code');
            $table->text('quality_notes')->nullable()->after('quality_status');
            $table->string('quality_inspector')->nullable()->after('quality_notes');
            $table->timestamp('quality_checked_at')->nullable()->after('quality_inspector');
        });
    }

    public function down(): void
    {
        Schema::table('trips', function (Blueprint $table) {
            $table->dropColumn([
                'gross_weight',
                'tare_weight',
                'net_weight',
                'weighed_at',
                'batch_code',
                'quality_status',
                'quality_notes',
                'quality_inspector',
                'quality_checked_at',
            ]);
        });
    }
};