<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Lesson extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'chapter_id',
        'is_free_preview',
        'duration',
        'video',
        'description',
        'sort_order',
        'status',
    ];

    public function chapter()
    {
        return $this->belongsTo(Chapter::class);
    }

    public function analysis()
    {
        return $this->hasOne(LessonAnalysis::class);
    }

    public function generatedQuizzes()
    {
        return $this->hasMany(UserGeneratedQuiz::class);
    }

    public function quizAttempts()
    {
        return $this->hasMany(UserQuizAttempt::class);
    }
}
