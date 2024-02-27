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
        return reverse_lazy('MEhub:teacher-attendance-list-view')


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
    template_name = '1.main/attendance/student_attendance_list.html'
    context_object_name = 'attendances'

class StudentAttendanceDetailView(DetailView):
    model = StudentAttendance
    template_name = '1.main/attendance/student_attendance_detail.html'

class StudentAttendanceCreateView(CreateView):
    model = StudentAttendance
    form_class = StudentAttendanceForm
    template_name = '1.main/attendance/add_student_attendance.html'
    
    def form_valid(self, form):
        form.instance.created_by = self.request.user
        return super().form_valid(form)

    def get_success_url(self):
        messages.success(self.request, 'Student Attendance Added Successfully')
        return reverse_lazy('MEhub:student-attendance-list-view')


class StudentAttendanceUpdateView(UpdateView):
    model = StudentAttendance
    template_name = '1.main/attendance/edit_student_attendance.html'
    form_class = StudentAttendanceEditForm

    def form_valid(self, form):
        form.instance.updated_by = self.request.user
        return super().form_valid(form)

    def get_success_url(self):
        messages.success(
            self.request, 'Student Attendance Updated Successfully')
        return reverse_lazy('MEhub:student-attendance-list-view')


class StudentAttendanceDeleteView(DeleteView):
    model = StudentAttendance
    template_name = '1.main/attendance/confirm_delete.html'

    def get_success_url(self):
        messages.success(
            self.request, 'Student Attendance Deleted Successfully')
        return reverse_lazy('MEhub:student-attendance-list-view')

