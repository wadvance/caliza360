<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('office_notes', function (Blueprint $table) {
            $table->id();
            $table->string('note_number')->unique();
            $table->string('title');
            $table->longText('body');
            $table->enum('note_type', ['general', 'memorando', 'minuta', 'oficio', 'comunicado', 'otro'])->default('general');
            $table->date('note_date');
            $table->enum('status', ['draft', 'final'])->default('draft');
            $table->string('related_to')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('office_notes');
    }
};
