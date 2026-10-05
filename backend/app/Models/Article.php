<?php

// app/Models/Article.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Article extends Model
{
    protected $fillable = [
        'unite', 'categoryId', 'nameArticle',
        'descriptionArticle', 'priceArticle','remise'
    ];
    
}