<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class MakeDescriptionNullableInArticleTables extends Migration
{
    public function up()
    {
        DB::statement('ALTER TABLE article_table_devis MODIFY description TEXT NULL');
        DB::statement('ALTER TABLE article_table_factures MODIFY description TEXT NULL');
        DB::statement('ALTER TABLE article_table_bls MODIFY description TEXT NULL');
    }

    public function down()
    {
        DB::statement('ALTER TABLE article_table_devis MODIFY description TEXT NOT NULL');
        DB::statement('ALTER TABLE article_table_factures MODIFY description TEXT NOT NULL');
        DB::statement('ALTER TABLE article_table_bls MODIFY description TEXT NOT NULL');
    }
}
