<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateFacturesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
Schema::create('factures', function (Blueprint $table) {
    $table->id();
    $table->string('numFacture');
    $table->foreignId('client_id')->constrained();
    $table->decimal('montant', 10, 2);
    $table->enum('statut', ['NON_PAYEE', 'PARTIELLEMENT_PAYEE', 'PAYEE']);
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
        Schema::dropIfExists('factures');
    }
}
