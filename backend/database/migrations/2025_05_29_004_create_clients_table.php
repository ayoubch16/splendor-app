<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateClientsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
// database/migrations/xxxx_xx_xx_xxxxxx_create_clients_table.php
Schema::create('clients', function (Blueprint $table) {
    $table->id();
    $table->string('raisonSociale');
    $table->string('adresse');
    $table->foreignId('ville_id');
    $table->string('ice');
    $table->string('telephone');
    $table->string('email');
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('clients');
    }
}
