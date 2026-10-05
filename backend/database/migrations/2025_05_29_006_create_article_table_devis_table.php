<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateArticleTableDevisTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
Schema::create('article_table_devis', function (Blueprint $table) {
    $table->id();
    $table->string('designation');
    $table->text('description');
    $table->integer('quantite');
    $table->decimal('prixUnitaire', 10, 2);
    $table->decimal('prixTotal', 10, 2);
    $table->foreignId('devis_id')->constrained();
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
        Schema::dropIfExists('article_table_devis');
    }
}
