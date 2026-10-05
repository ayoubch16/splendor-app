<?php

// app/Models/Bl.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Bl extends Model
{
    protected $fillable = [
        'numBl', 'client_id', 'statut', 'date', 'devis_id','numBC'
    ];
    
    public function client()
    {
        return $this->belongsTo(Client::class);
    }
    
    public function articles()
    {
        return $this->hasMany(ArticleTableBl::class);
    }
    
    public function devis()
    {
        return $this->belongsTo(Devis::class);
    }
}