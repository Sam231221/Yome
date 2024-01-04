from django.contrib import admin
from .models import School, Department, Teacher, TeacherAssignment, Course, Student, Class, Attendance, Exam, Result


class SchoolAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'school_type', 'founding_date',
                    'principal_name', 'telephone_number')
    list_filter = ('school_type',)
    search_fields = ('name', 'principal_name')


class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code', 'school')
    search_fields = ('name', 'code', 'school__name')


class TeacherAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email',
                    'school', 'dob', 'gender', 'phone')
    list_filter = ('gender',)
    search_fields = ('username', 'email', 'school__name')


class TeacherAssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'teacher', 'department', 'course',
                    'school', 'active', 'date_of_joining', 'date_of_leave')
    list_filter = ('active', 'department__school',)
    search_fields = ('teacher__username', 'department__name', 'course__name')


class CourseAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'code', 'department')
    search_fields = ('name', 'code', 'department__name')


class StudentAdmin(admin.ModelAdmin):
    list_display = ('id', 'username', 'email', 'school', 'dob',
                    'gender', 'phone', 'date_of_joining', 'date_of_leave', 'active')
    list_filter = ('gender', 'active', 'school',)
    search_fields = ('username', 'email', 'school__name')


class ClassAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'description', 'start_date', 'end_date')
    search_fields = ('name', 'description')


class AttendanceAdmin(admin.ModelAdmin):
    list_display = ('id', 'date', 'student', 'is_present',
                    'class_attended', 'school', 'comments')
    list_filter = ('is_present', 'class_attended__name', 'school',)
    search_fields = ('student__username', 'class_attended__name')


class ExamAdmin(admin.ModelAdmin):
    list_display = ('id', 'date', 'start_time', 'end_time',
                    'course', 'class_examined', 'school', 'max_score')
    list_filter = ('course__name', 'class_examined__name', 'school',)
    search_fields = ('course__name', 'class_examined__name')


class ResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'date', 'student', 'exam',
                    'score', 'school', 'grade')
    list_filter = ('grade', 'school',)
    search_fields = ('student__username', 'exam__course__name')


# Register your admin classes
admin.site.register(School, SchoolAdmin)
admin.site.register(Department, DepartmentAdmin)
admin.site.register(Teacher, TeacherAdmin)
admin.site.register(TeacherAssignment, TeacherAssignmentAdmin)
admin.site.register(Course, CourseAdmin)
admin.site.register(Student, StudentAdmin)
admin.site.register(Class, ClassAdmin)
admin.site.register(Attendance, AttendanceAdmin)
admin.site.register(Exam, ExamAdmin)
admin.site.register(Result, ResultAdmin)
