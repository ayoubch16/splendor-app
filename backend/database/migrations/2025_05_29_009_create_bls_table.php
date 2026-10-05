<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateBlsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
Schema::create('bls', function (Blueprint $table) {
    $table->id();
    $table->string('numBl');
    $table->foreignId('client_id')->constrained();
    $table->enum('statut', ['LIVRE', 'NON_LIVRE']);
    $table->date('date');
    $table->foreignId('devis_id')->nullable()->constrained();
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
        Schema::dropIfExists('bls');
    }
}
