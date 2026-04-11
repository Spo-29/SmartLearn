<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class LessonAnalysis extends Model
{
    use HasFactory;

    protected $fillable = [
        'lesson_id',
        'course_id',
        'status',
        'model_name',
        'source_type',
        'version',
        'summary',
        'key_concepts',
        'raw_payload',
        'error_message',
        'generated_at',
    ];

    protected $casts = [
        'key_concepts' => 'array',
        'generated_at' => 'datetime',
    ];

    public function lesson()
    {
        return $this->belongsTo(Lesson::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function generatedQuizzes()
    {
        return $this->hasMany(UserGeneratedQuiz::class);
    }
}
