<?php
// app/Models/TraceOperation.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TraceOperation extends Model
{
    use HasFactory;

    protected $table = 'trace_operations';

    protected $fillable = [
        'timestamp',
        'operation_type',
        'entity_type',
        'entity_id',
        'user_id',
        'user_name',
        'details',
        'previous_state',
        'new_state'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
        'previous_state' => 'array',
        'new_state' => 'array'
    ];

    const OPERATION_TYPES = [
        'CREATE' => 'CREATE',
        'UPDATE' => 'UPDATE',
        'DELETE' => 'DELETE',
        'READ' => 'READ',
        'STATUS_CHANGE' => 'STATUS_CHANGE',
        'EMAIL_SENT' => 'EMAIL_SENT',
        'PDF_GENERATED' => 'PDF_GENERATED'
    ];

    const ENTITY_TYPES = [
        'DEVIS' => 'DEVIS',
        'CLIENT' => 'CLIENT',
        'ARTICLE' => 'ARTICLE',
        'FACTURE' => 'FACTURE',
        'BON_LIVRAISON' => 'BON_LIVRAISON',
        'USER' => 'USER'
    ];
}