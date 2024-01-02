# models.py
from django.contrib.auth.models import BaseUserManager,AbstractBaseUser, AbstractUser, Group, Permission, BaseUserManager
from django.db import models
from django.db.models.fields.related import ForeignKey, OneToOneField

from django.contrib.gis.db import models as gismodels
from django.contrib.gis.geos import Point
import uuid
# Create your models here.
class UserManager(BaseUserManager):
    def create_user(self, first_name, last_name, username, email, password=None):
        if not email:
            raise ValueError('User must have an email address')

        if not username:
            raise ValueError('User must have an username')

        user = self.model(
            email = self.normalize_email(email),
            username = username,
            first_name = first_name,
            last_name = last_name,
        )
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, first_name, last_name, username, email, password=None):
        user = self.create_user(
            email = self.normalize_email(email),
            username = username,
            password = password,
            first_name = first_name,
            last_name = last_name,
        )
        
        user.is_admin = True
        user.is_active = True
        user.is_staff = True
        user.is_superadmin = True
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    STAFF = 1
    ADMINISTRATOR = 2
    ROLE_CHOICE = (
        (STAFF, 'staff'),
        (ADMINISTRATOR, 'ADMINISTRATOR'),
    )
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    username = models.CharField(max_length=50, unique=True)
    email = models.EmailField(max_length=100, unique=True)
    phone_number = models.CharField(max_length=12, blank=True)
    role = models.PositiveSmallIntegerField(choices=ROLE_CHOICE, blank=True, null=True)

    # required fields
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now_add=True)
    created_date = models.DateTimeField(auto_now_add=True)
    modified_date = models.DateTimeField(auto_now=True)
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=False)
    is_superadmin = models.BooleanField(default=False)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    objects = UserManager()

    def __str__(self):
        return self.email

    def has_perm(self, perm, obj=None):
        return self.is_admin

    def has_module_perms(self, app_label):
        return True

    def get_role(self):
        if self.role == 1:
            user_role = 'Vendor'
        elif self.role == 2:
            user_role = 'Customer'
        return user_role


class UserProfile(models.Model):
    user = OneToOneField(User, on_delete=models.CASCADE, blank=True, null=True)
    profile_picture = models.ImageField(upload_to='users/profile_pictures', blank=True, null=True)
    cover_photo = models.ImageField(upload_to='users/cover_photos', blank=True, null=True)
    address = models.CharField(max_length=250, blank=True, null=True)
    country = models.CharField(max_length=15, blank=True, null=True)
    state = models.CharField(max_length=15, blank=True, null=True)
    city = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now=True)

    # def full_address(self):
    #     return f'{self.address_line_1}, {self.address_line_2}'

    def __str__(self):
        return self.user.email


class SchoolManager(BaseUserManager):
    def create_school(self, username, email, password=None, **extra_fields):
        email = self.normalize_email(email)
        user = self.model(username=username, email=email,
                          is_school=True, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class School(AbstractUser):
    objects = SchoolManager()

    is_school = models.BooleanField(default=True)

    SCHOOL_TYPES = [
        ('public', 'Public'),
        ('private', 'Private'),
    ]
    name = models.CharField(max_length=255)
    address = models.TextField()
    school_type = models.CharField(max_length=10, choices=SCHOOL_TYPES)
    accreditation_status = models.CharField(max_length=50)
    founding_date = models.DateField()
    principal_name = models.CharField(max_length=100)
    principal_email = models.EmailField()
    principal_phone_number = models.CharField(max_length=15)

    # Adding related_name attributes to resolve clash
    groups = models.ManyToManyField(Group, related_name='school_groups')
    user_permissions = models.ManyToManyField(
        Permission, related_name='school_user_permissions'
    )

    profile_picture = models.ImageField(
        upload_to='school_profiles/', null=True, blank=True)

    def __str__(self):
        return self.username


class Department(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10)
    description = models.TextField()
    school = models.ForeignKey(School, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class TeacherAssignment(models.Model):
    teacher = models.ForeignKey('Teacher', on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.CASCADE)
    course = models.ForeignKey('Course', on_delete=models.CASCADE)
    school = models.ForeignKey(School, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.teacher} - {self.course}'


class TeacherManager(BaseUserManager):
    def create_teacher(self, username, email, password=None, school=None, **extra_fields):
        if school is None:
            raise ValueError("A teacher must be associated with a school.")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email,
                          is_teacher=True, school=school, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class Teacher(models.Model):
    objects = TeacherManager()
    is_teacher = models.BooleanField(default=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    teacherId = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    password= models.CharField(max_length=100, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # Adding related_name attributes to resolve clash
    groups = models.ManyToManyField(Group, related_name='teacher_groups')
    user_permissions = models.ManyToManyField(
        Permission, related_name='teacher_user_permissions'
    )

    profile_picture = models.ImageField(
        upload_to='teacher_profiles/', null=True, blank=True)

    def __str__(self):
        return self.username


class Course(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=10)
    description = models.TextField()
    department = models.ForeignKey(Department, on_delete=models.CASCADE)

    def __str__(self):
        return self.name


class StudentManager(BaseUserManager):
    def create_student(self, username, email, password=None, school=None, **extra_fields):
        if school is None:
            raise ValueError("A student must be associated with a school.")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email,
                          is_student=True, school=school, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user


class Student(models.Model):
    objects = StudentManager()
    is_student = models.BooleanField(default=True)
    school = models.ForeignKey(School, on_delete=models.CASCADE)
    studentId = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    password= models.CharField(max_length=100, null=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    # Adding related_name attributes to resolve clash
    groups = models.ManyToManyField(Group, related_name='student_groups')
    user_permissions = models.ManyToManyField(
        Permission, related_name='student_user_permissions'
    )

    profile_picture = models.ImageField(
        upload_to='student_profiles/', null=True, blank=True)

    def __str__(self):
        return self.username


class Class(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    courses = models.ManyToManyField(Course)
    students = models.ManyToManyField(Student)

    def __str__(self):
        return self.name


class Attendance(models.Model):
    date = models.DateField()
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    is_present = models.BooleanField()
    class_attended = models.ForeignKey(Class, on_delete=models.CASCADE)
    school = models.ForeignKey(School, on_delete=models.CASCADE)

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

    def __str__(self):
        return f'{self.course} - {self.date}'


class Result(models.Model):
    date = models.DateField()
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    exam = models.ForeignKey(Exam, on_delete=models.CASCADE)
    score = models.FloatField()
    school = models.ForeignKey(School, on_delete=models.CASCADE)

    def __str__(self):
        return f'{self.student} - {self.exam}'
