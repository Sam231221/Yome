from django.contrib.auth.models import BaseUserManager, Group, Permission, AbstractUser
from django.core.validators import FileExtensionValidator, RegexValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db import models

class TeacherManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault('role', 'TEACHER')

        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.role = "TEACHER"
        user.save(using=self._db)

        return super().create_user(email, password=password, **extra_fields)
        # return user


class Teacher(AbstractUser):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Others')
    ]
    PROFILE_PIC_DIR = 'teacher_photos/'

    phone_regex = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed."
    )

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    mobile = models.CharField(
        validators=[phone_regex], max_length=17, blank=True)
    joining_date = models.DateField()
    qualification = models.CharField(max_length=100)
    experience = models.CharField(max_length=100)
    address = models.CharField(max_length=100)
    city = models.CharField(max_length=50)
    state = models.CharField(max_length=50)
    zip_code = models.CharField(max_length=20, null=True, blank=True)
    major_subject = models.CharField(max_length=30, null=True, blank=True)
    country = models.CharField(max_length=50, default="Nepal")
    photo = models.ImageField(upload_to=PROFILE_PIC_DIR, blank=True, null=True, validators=[
                              FileExtensionValidator(allowed_extensions=['jpg', 'jpeg', 'png', 'webp'])])
    bio = models.TextField(max_length=800, blank=True, null=True)

    email = models.EmailField(unique=True)

    objects = TeacherManager()

    class Meta:
        ordering = ('first_name', 'last_name')

    groups = models.ManyToManyField(
        Group, related_name="teacher_set",  blank=True)
    user_permissions = models.ManyToManyField(
        Permission, related_name="teacher_set", blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'date_of_birth', 'gender', 'mobile', 'joining_date',
                       'qualification', 'experience', 'address', 'city', 'state', 'zip_code', 'country']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    def clean(self):
        if self.date_of_birth and self.date_of_birth > timezone.now().date():
            raise ValidationError("Date of birth cannot be in the future.")

    @property
    def full_name(self):
        return f"{(self.first_name).capitalize()} {self.last_name.capitalize()}"
