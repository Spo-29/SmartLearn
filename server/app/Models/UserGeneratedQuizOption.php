<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserGeneratedQuizOption extends Model
{
    use HasFactory;

    protected $fillable = [
        'question_id',
        'option_text',
        'is_correct',
        'sort_order',
    ];

    public function question()
    {
        return $this->belongsTo(UserGeneratedQuizQuestion::class, 'question_id');
    }

    public function attemptAnswers()
    {
        return $this->hasMany(UserQuizAttemptAnswer::class, 'selected_option_id');
    }
}
