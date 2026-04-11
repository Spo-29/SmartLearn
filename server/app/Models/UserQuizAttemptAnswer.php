<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserQuizAttemptAnswer extends Model
{
    use HasFactory;

    protected $fillable = [
        'attempt_id',
        'quiz_question_id',
        'selected_option_id',
        'is_correct',
    ];

    public function attempt()
    {
        return $this->belongsTo(UserQuizAttempt::class, 'attempt_id');
    }

    public function quizQuestion()
    {
        return $this->belongsTo(UserGeneratedQuizQuestion::class, 'quiz_question_id');
    }

    public function selectedOption()
    {
        return $this->belongsTo(UserGeneratedQuizOption::class, 'selected_option_id');
    }
}
