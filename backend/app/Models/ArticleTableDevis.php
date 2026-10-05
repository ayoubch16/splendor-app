<?php

// app/Models/ArticleTableDevis.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArticleTableDevis extends Model
{
    protected $fillable = [
        'designation', 'description', 'quantite',
        'prixUnitaire', 'prixTotal', 'remise', 'devis_id'
    ];
    
    public function devis()
    {
        return $this->belongsTo(Devis::class);
    }
}