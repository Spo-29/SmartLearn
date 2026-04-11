<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserGeneratedQuiz extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'course_id',
        'lesson_id',
        'lesson_analysis_id',
        'title',
        'instructions',
        'status',
        'model_name',
        'generated_at',
    ];

    protected $casts = [
        'generated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function lessonAnalysis()
    {
        return $this->belongsTo(LessonAnalysis::class);
    }

    public function questions()
    {
        return $this->hasMany(UserGeneratedQuizQuestion::class, 'quiz_id')->orderBy('sort_order')->orderBy('id');
    }

    public function attempts()
    {
        return $this->hasMany(UserQuizAttempt::class, 'quiz_id');
    }
}
