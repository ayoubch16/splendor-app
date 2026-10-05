<?php

// app/Models/Devis.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Devis extends Model
{
    protected $fillable = [
        'numDevis', 'client_id', 'montant', 'remiseDevis',
        'statut', 'date', 'factureExistante', 'blExistante'
    ];
    
    public function client()
    {
        return $this->belongsTo(Client::class);
    }
    
    public function articles()
    {
        return $this->hasMany(ArticleTableDevis::class);
    }
    
    public function facture()
    {
        return $this->hasOne(Facture::class);
    }
    
    public function bl()
    {
        return $this->hasOne(Bl::class);
    }
}