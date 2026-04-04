<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{   

   protected $appends = ['course_small_image'];

    function getCourseSmallImageAttribute() {
        if ($this->image == "") {
            return "";
        }

        return asset('uploads/course/small/'.$this->image);
    } 
    public function chapters() {
    return $this->hasMany(Chapter::class);
}
    use HasFactory;

    protected $appends = ['course_small_image'];

    protected $fillable = [
        'title',
        'user_id',
        'category_id',
        'level_id',
        'language_id',
        'description',
        'price',
        'cross_price',
        'status',
        'is_featured',
        'image',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function level()
    {
        return $this->belongsTo(Level::class);
    }

    public function language()
    {
        return $this->belongsTo(Language::class);
    }

    public function chapters()
    {
        return $this->hasMany(Chapter::class)->orderBy('sort_order')->orderBy('id');
    }

    public function outcomes()
    {
        return $this->hasMany(Outcome::class)->orderBy('sort_order')->orderBy('id');
    }

    public function requirements()
    {
        return $this->hasMany(Requirement::class)->orderBy('sort_order')->orderBy('id');
    }

    public function enrollments()
    {
        return $this->hasMany(Enrollment::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class);
    }

    public function activities()
    {
        return $this->hasMany(Activity::class);
    }

    public function getCourseSmallImageAttribute()
    {
        if (!$this->image) {
            return null;
        }

        return url('upload/course/small/' . $this->image);
    }
}
