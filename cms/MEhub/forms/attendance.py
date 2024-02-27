from django import forms
from ..models.models import StudentAttendance, Student
from ..models.models import TeacherAttendance, Teacher
from django.utils.safestring import mark_safe


class StudentAttendanceForm(forms.ModelForm):
    class Meta:
        model = StudentAttendance
        fields = ['date', 'student', 'attendance_status']

    def __init__(self, *args, **kwargs):
        super(StudentAttendanceForm, self).__init__(*args, **kwargs)
        self.fields['student'].queryset = Student.objects.all()
        
        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'
            if field.required:
                field.label = mark_safe(
                    field.label + '\t <span class="login-danger">*</span>')
                
        self.fields['attendance_status'].widget.attrs['class'] += ' select'
        self.fields['student'].widget.attrs['class'] += ' select'

    def clean(self):
        cleaned_data = super().clean()
        date = cleaned_data.get('date')
        student = cleaned_data.get('student')

        if StudentAttendance.objects.filter(date=date, student=student).exists():
            self.add_error(
                'date', 'Attendance for this student on this date already exists.')

        return cleaned_data


class TeacherAttendanceForm(forms.ModelForm):
    class Meta:
        model = TeacherAttendance
        fields = ['date', 'teacher', 'attendance_status']

    def __init__(self, *args, **kwargs):
        super(TeacherAttendanceForm, self).__init__(*args, **kwargs)
        self.fields['teacher'].queryset = Teacher.objects.all()

        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'
            if field.required:
                field.label = mark_safe(
                    field.label + '\t <span class="login-danger">*</span>')

        self.fields['attendance_status'].widget.attrs['class'] += ' select'
        self.fields['date'].widget.attrs['class'] = 'form-control datetimepicker'
        self.fields['teacher'].widget.attrs['class'] += ' select'
        

    def clean(self):
        cleaned_data = super().clean()
        date = cleaned_data.get('date')
        teacher = cleaned_data.get('teacher')

        if TeacherAttendance.objects.filter(date=date, teacher=teacher).exists():
            self.add_error(
                'date', 'Attendance for this teacher on this date already exists.')

        return cleaned_data


class TeacherAttendanceEditForm(forms.ModelForm):
    class Meta:
        model = TeacherAttendance
        fields = ['date', 'teacher', 'attendance_status']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['teacher'].queryset = Teacher.objects.all()

        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'
            if field.required:
                field.label = mark_safe(
                    field.label + '\t <span class="login-danger">*</span>')

        self.fields['attendance_status'].widget.attrs['class'] += ' select'
        self.fields['date'].widget.attrs['class'] = 'form-control datetimepicker'
        self.fields['teacher'].widget.attrs['class'] += ' select'
        

    def clean(self):
        cleaned_data = super().clean()
        return cleaned_data


class StudentAttendanceEditForm(forms.ModelForm):
    class Meta:
        model = StudentAttendance
        fields = ['date', 'student', 'attendance_status']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['student'].queryset = Student.objects.all()

        for field_name, field in self.fields.items():
            field.widget.attrs['class'] = 'form-control'
            if field.required:
                field.label = mark_safe(
                    field.label + '\t <span class="login-danger">*</span>')

        self.fields['attendance_status'].widget.attrs['class'] += ' select'
        self.fields['date'].widget.attrs['class'] = 'form-control datetimepicker'
        self.fields['student'].widget.attrs['class'] += ' select'
        

    def clean(self):
        cleaned_data = super().clean()
        return cleaned_data