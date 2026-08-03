<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('load_proforma_locations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('load_proforma_id')->constrained()->cascadeOnDelete();
            $table->float('latitude');
            $table->float('longitude');
            $table->float('speed')->nullable();
            $table->float('accuracy')->nullable();
            $table->timestamp('recorded_at')->useCurrent();
            $table->timestamps();

            $table->index(['load_proforma_id', 'recorded_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('load_proforma_locations');
    }
};
