# models.py
from django.utils import timezone
from datetime import datetime
from django.contrib.auth.models import BaseUserManager, AbstractUser, Group, Permission
from django.db import models


class SchoolManager(BaseUserManager):
    def create_school(self, username, email, password=None, **extra_fields):
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, is_school=True, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class School(AbstractUser):
    objects = SchoolManager()
    is_school = models.BooleanField(default=True)
    groups = models.ManyToManyField(Group, related_name='school_groups')
    user_permissions = models.ManyToManyField(Permission, related_name='school_user_permissions')
    SCHOOL_TYPES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]
    
    name = models.CharField(max_length=255)
    address = models.TextField()
    school_type = models.CharField(max_length=10, choices=SCHOOL_TYPES)
    founding_date = models.DateField()
    principal_name = models.CharField(max_length=100)
    principal_email = models.EmailField()
    principal_phone_number = models.CharField(max_length=15)
    telephone_number = models.CharField(max_length=15, null=True, blank=True)
    profile_picture = models.ImageField(upload_to='school_profiles/', null=True, blank=True)
    website = models.URLField(blank=True, null=True)

    def __str__(self):
        return f"{self.pk}"


class Department(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10)
    description = models.TextField()
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    head_of_department = models.ForeignKey('Teacher', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name


class TeacherAssignment(models.Model):
    teacher = models.ForeignKey('Teacher', on_delete=models.CASCADE, related_name='assignments')
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    course = models.ForeignKey('Course', on_delete=models.CASCADE)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    active = models.BooleanField(default= True)
    
    date_of_joining = models.DateField(default = timezone.now)
    date_of_leave = models.DateField(null=True, blank=True)
    end_date_of_assignment = models.DateField(null=True, blank=True)


    def __str__(self):
        return f'{self.teacher} - {self.course}'
    
    def deactivate(self, dol=timezone.now()):
        if self.active == True:
            self.active = False
            self.date_of_leave = dol
            self.save()
            return True
        return False


class TeacherManager(BaseUserManager):
    def create_teacher(self, username, email, password=None, school=None, **extra_fields):
        if school is None:
            raise ValueError("A teacher must be associated with a school.")
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, is_teacher=True, school=school, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class Teacher(AbstractUser):
    objects = TeacherManager()
    is_teacher = models.BooleanField(default=True)
    groups = models.ManyToManyField(Group, related_name='teacher_groups')
    user_permissions = models.ManyToManyField(Permission, related_name='teacher_user_permissions')
    
    gender_options = [('male', 'Male'), ('female', 'Female'), ('others', 'Others')]
    school = models.ForeignKey(School, on_delete=models.SET_NULL, null=True)
    dob = models.DateField(default=datetime(1980, 1, 1).date())
    gender = models.CharField(max_length = 10, choices = gender_options, default = gender_options[0][0])
    profile_picture = models.ImageField(upload_to='teacher_profiles/', null=True, blank=True)
    phone = models.CharField(max_length=20, null=True, blank=True)
    qualification = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.username


class Course(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10)
    description = models.TextField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    syllabus = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.name


class StudentManager(BaseUserManager):
    def create_student(self, username, email, password=None, school=None, **extra_fields):
        if school is None:
            raise ValueError("A student must be associated with a school.")
        
        email = self.normalize_email(email)
        user = self.model(username=username, email=email,is_student=True, school=school, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class Student(AbstractUser):
    objects = StudentManager()
    groups = models.ManyToManyField(Group, related_name='student_groups')
    user_permissions = models.ManyToManyField(Permission, related_name='student_user_permissions')
    is_student = models.BooleanField(default=True)
    
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    profile_picture = models.ImageField(upload_to='student_profiles/', null=True, blank=True)
    active = models.BooleanField(default=True)
    gender_options = [('male', 'Male'), ('female', 'Female'), ('others', 'Others')]
    gender = models.CharField(max_length=10, choices=gender_options, default=gender_options[0][0])
    dob = models.DateField(default=datetime(1980, 1, 1).date())
    phone = models.CharField(max_length=20, null=True, blank=True)
    date_of_joining = models.DateField(default=timezone.now)
    date_of_leave = models.DateField(null=True, blank=True)
    guardian_name = models.CharField(max_length=100, blank=True, null=True)
    guardian_email = models.EmailField(blank=True, null=True)
    guardian_relationship = models.CharField(max_length=20, blank=True, null=True)
    guardian_phone = models.CharField(max_length=20, null=True, blank=True)

    def __str__(self):
        return self.username


class Class(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    courses = models.ManyToManyField(Course)
    students = models.ManyToManyField(Student)
    start_date = models.DateField(blank=True, null=True)
    end_date = models.DateField(blank=True, null=True)

    def __str__(self):
        return self.name


class Attendance(models.Model):
    date = models.DateField()
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    is_present = models.BooleanField(default=True)
    class_attended = models.ForeignKey(Class, on_delete=models.CASCADE)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    comments = models.TextField(blank=True, null=True)

    def __str__(self):
        return f'{self.student} - {self.date}'


class Exam(models.Model):
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    venue = models.CharField(max_length=255)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    class_examined = models.ForeignKey(Class, on_delete=models.CASCADE)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    max_score = models.FloatField(default=100.0)

    def __str__(self):
        return f'{self.course} - {self.date}'


class Result(models.Model):
    date = models.DateField()
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    score = models.FloatField()
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    grade = models.CharField(max_length=2, blank=True, null=True)

    def __str__(self):
        return f'{self.student} - {self.exam}'
