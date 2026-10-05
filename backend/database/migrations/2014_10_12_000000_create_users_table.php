<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateUsersTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
Schema::create('users', function (Blueprint $table) {
    $table->id();
    $table->string('username')->unique();
    $table->string('email')->unique();
    $table->string('password');
    $table->string('first_name');
    $table->string('last_name');
    $table->boolean('is_active')->default(true);
    $table->enum('role', [
        'ROLE_USER', 
        'ROLE_ADMIN', 
        'ROLE_SUPER_ADMIN', 
        'ROLE_CLIENT', 
        'ROLE_VENDEUR', 
        'ROLE_COMPTABLE', 
        'ROLE_COMMERCIAL'
    ])->default('ROLE_USER');
    $table->rememberToken();
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
        Schema::dropIfExists('users');
    }
}
