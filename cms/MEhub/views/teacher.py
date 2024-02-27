from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from ..models.models import Teacher
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from ..forms import TeacherForm
from django.http import HttpResponseRedirect



class TeacherListView(ListView):
    model = Teacher
    template_name = "1.main/teacher/teacher_list.html"
    context_object_name = 'teachers'


class TeacherEditView(UpdateView, LoginRequiredMixin):
    model = Teacher
    form_class = TeacherForm
    template_name = '1.main/teacher/edit_teacher.html'

    def form_valid(self, form):
        self.object = form.save()
        success_url = reverse_lazy(
            'MEhub:teacher-detail-view', args=[self.object.pk])
        return HttpResponseRedirect(success_url)


class TeacherAddView(CreateView, LoginRequiredMixin):
    model = Teacher
    form_class = TeacherForm
    template_name = '1.main/teacher/add_teacher.html'
    success_url = reverse_lazy('MEhub:teacher-list-view')

    def form_valid(self, form):
        self.object = form.save()
        success_url = reverse_lazy(
            'MEhub:teacher-detail-view', args=[self.object.pk])
        return HttpResponseRedirect(success_url)


class TeacherDetailView(DetailView):
    model = Teacher
    template_name = '1.main/teacher/teacher_details.html'
    context_object_name = 'teacher'


class TeacherDeleteView(DeleteView, LoginRequiredMixin, UserPassesTestMixin):
    model = Teacher
    template_name = '1.main/teacher/teacher_confirm_delete.html'
    success_url = reverse_lazy('MEhub:teacher-list-view')

    def test_func(self):
        return self.request.user.is_authenticated and (self.request.user.is_superuser or self.request.user.role == "TEACHER")
