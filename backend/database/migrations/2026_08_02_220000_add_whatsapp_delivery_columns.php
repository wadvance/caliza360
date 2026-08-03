<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whatsapp_messages', function (Blueprint $table) {
            $table->string('wa_message_id')->nullable()->after('sent_by');
            $table->string('delivery_status')->default('pending')->after('wa_message_id');
            $table->text('error')->nullable()->after('delivery_status');
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_messages', function (Blueprint $table) {
            $table->dropColumn(['wa_message_id', 'delivery_status', 'error']);
        });
    }
};
