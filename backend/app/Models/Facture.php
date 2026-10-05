<?php

// app/Models/Facture.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Facture extends Model
{
    
    protected $table = 'factures'; 
    
    protected $fillable = [
        'numFacture', 'client_id', 'montant',
        'statut', 'date', 'devis_id','numBC'
    ];
    
    public function client()
    {
        return $this->belongsTo(Client::class);
    }
    
    public function articles()
    {
        return $this->hasMany(ArticleTableFacture::class);
    }
    
    public function devis()
    {
        return $this->belongsTo(Devis::class);
    }
}