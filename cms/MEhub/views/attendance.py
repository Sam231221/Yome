from django.contrib import messages
from django.views.generic import ListView, CreateView, DetailView, UpdateView, DeleteView
from ..models.models import StudentAttendance, TeacherAttendance
from django.urls import reverse_lazy
from ..forms.forms import *


class TeacherAttendanceListView(ListView):
    model = TeacherAttendance
    template_name = '1.main/attendance/teacher_attendance_list.html'
    context_object_name = 'attendances'

class TeacherAttendanceDetailView(DetailView):
    model = TeacherAttendance
    template_name = '1.main/attendance/teacher_attendance_detail.html'

class TeacherAttendanceCreateView(CreateView):
    model = TeacherAttendance
    form_class = TeacherAttendanceForm
    template_name = '1.main/attendance/add_teacher_attendance.html'
    # fields = ['date', 'teacher', 'attendance_status']
    
    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)

    def get_success_url(self):
        messages.success(self.request, 'Teacher Attendance Added Successfully')
        return reverse_lazy('MEhub:home-view')


class TeacherAttendanceUpdateView(UpdateView):
    model = TeacherAttendance
    template_name = '1.main/attendance/edit_teacher_attendance.html'
    form_class = TeacherAttendanceEditForm

    def form_valid(self, form):
        form.instance.updated_by = self.request.user
        return super().form_valid(form)

    def get_success_url(self):
        messages.success(
            self.request, 'Teacher Attendance Updated Successfully')
        return reverse_lazy('MEhub:teacher-attendance-list-view')


class TeacherAttendanceDeleteView(DeleteView):
    model = TeacherAttendance
    template_name = '1.main/attendance/confirm_delete.html'

    def get_success_url(self):
        messages.success(
            self.request, 'Teacher Attendance Deleted Successfully')
        return reverse_lazy('MEhub:teacher-attendance-list-view')


class StudentAttendanceListView(ListView):
    model = StudentAttendance
    template_name = 'attendance/student_attendance_list.html'


class StudentAttendanceCreateView(CreateView):
    model = StudentAttendance
    fields = ['date', 'student', 'attendance_status']
    template_name = 'attendance/student_attendance_create.html'

    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)

    def get_success_url(self):
        messages.success(self.request, 'Student Attendance Added Successfully')
        return reverse_lazy('student_attendance_list')


class StudentAttendanceUpdateView(UpdateView):
    model = StudentAttendance
    fields = ['date', 'student', 'attendance_status']
    template_name = 'attendance/student_attendance_update.html'

    def form_valid(self, form):
        form.instance.updated_by = self.request.user
        return super().form_valid(form)

    def get_success_url(self):
        messages.success(
            self.request, 'Student Attendance Updated Successfully')
        return reverse_lazy('student_attendance_list')


class StudentAttendanceDeleteView(DeleteView):
    model = StudentAttendance
    template_name = 'attendance/student_attendance_delete.html'

    def get_success_url(self):
        messages.success(
            self.request, 'Student Attendance Deleted Successfully')
        return reverse_lazy('student_attendance_list')
