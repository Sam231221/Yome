from django.db import models
from MEhub.models.models import Student, Teacher
from django.utils import timezone

class StudentAttendance(models.Model):
    DATE_CHOICES = (
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
    )
    date = models.DateField(default=timezone.now)
    student = models.ForeignKey(Student, related_name='attendance', on_delete=models.CASCADE)
    attendance_status = models.CharField(max_length=10, choices=DATE_CHOICES)
    
    def get_attendance_status_display(self):
        present_days = StudentAttendance.objects.filter(attendance_status='Present').count()
        total_days = StudentAttendance.objects.filter().count()
        attendance_percentage = (present_days / total_days) * 100 if total_days > 0 else 0
        return {'attendance': attendance_percentage, "total_days": total_days}

    def __str__(self):
        return f"{self.date} - {self.student} - {self.get_attendance_status_display()['attendance']}"


class TeacherAttendance(models.Model):
    DATE_CHOICES = (
        ('Present', 'Present'),
        ('Absent', 'Absent'),
        ('Late', 'Late'),
    )
    date = models.DateField(default=timezone.now)
    teacher = models.ForeignKey(Teacher, related_name='attendance', on_delete=models.CASCADE)
    attendance_status = models.CharField(max_length=10, choices=DATE_CHOICES)



    def get_attendance_status_display(self):
        present_days = TeacherAttendance.objects.filter(attendance_status='Present').count()
        total_days = TeacherAttendance.objects.filter().count()
        attendance_percentage = (present_days / total_days) * 100 if total_days > 0 else 0
        return {'attendance': attendance_percentage, "total_days": total_days}

    def __str__(self):
        return f"{self.date} - {self.teacher} - {self.get_attendance_status_display()['attendance']}"

    def __per__(self):
        return f"{self.get_attendance_status_display()['attendance']}"