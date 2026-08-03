<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('load_proformas', function (Blueprint $table) {
            $table->string('origin_name')->nullable();
            $table->string('origin_address')->nullable();
            $table->float('origin_lat')->nullable();
            $table->float('origin_lng')->nullable();
            $table->float('destination_lat')->nullable();
            $table->float('destination_lng')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('load_proformas', function (Blueprint $table) {
            $table->dropColumn([
                'origin_name',
                'origin_address',
                'origin_lat',
                'origin_lng',
                'destination_lat',
                'destination_lng',
            ]);
        });
    }
};
