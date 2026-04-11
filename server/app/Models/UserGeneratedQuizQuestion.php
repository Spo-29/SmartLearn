<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserGeneratedQuizQuestion extends Model
{
    use HasFactory;

    protected $fillable = [
        'quiz_id',
        'question_text',
        'explanation',
        'difficulty',
        'sort_order',
    ];

    public function quiz()
    {
        return $this->belongsTo(UserGeneratedQuiz::class, 'quiz_id');
    }

    public function options()
    {
        return $this->hasMany(UserGeneratedQuizOption::class, 'question_id')->orderBy('sort_order')->orderBy('id');
    }

    public function attemptAnswers()
    {
        return $this->hasMany(UserQuizAttemptAnswer::class, 'quiz_question_id');
    }
}
