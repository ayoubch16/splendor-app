<?php

// app/Models/ArticleTableFacture.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArticleTableFacture extends Model
{
    protected $fillable = [
        'designation', 'description', 'quantite',
        'prixUnitaire', 'prixTotal', 'facture_id'
    ];
    
    public function facture()
    {
        return $this->belongsTo(Facture::class);
    }
}