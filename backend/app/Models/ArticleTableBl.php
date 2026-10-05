<?php
// app/Models/ArticleTableBl.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ArticleTableBl extends Model
{
    protected $fillable = [
        'designation', 'description', 'quantite',
        'prixUnitaire', 'prixTotal', 'bl_id'
    ];
    
    public function bl()
    {
        return $this->belongsTo(Bl::class);
    }
}