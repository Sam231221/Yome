from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from ..models.models import Student
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from ..forms import StudentForm
from django.http import HttpResponseRedirect





class StudentListView(ListView):
    model = Student
    template_name = '1.main/student/student_list.html'
    context_object_name = 'students'


class StudentDetailView(DetailView):
    model = Student
    template_name = '1.main/student/student_details.html'


class StudentCreateView(CreateView, LoginRequiredMixin):
    model = Student
    form_class = StudentForm
    template_name = '1.main/student/add_student.html'
    # success_url = reverse_lazy('MEhub:student-list-view')

    def form_valid(self, form):
        self.object = form.save()
        success_url = reverse_lazy(
            'MEhub:student-detail-view', args=[self.object.pk])
        return HttpResponseRedirect(success_url)


class StudentUpdateView(UpdateView, LoginRequiredMixin):
    model = Student
    form_class = StudentForm
    template_name = '1.main/student/edit_student.html'
    context_object_name = 'student'
    # success_url = reverse_lazy('MEhub:student-list-view')

    def form_valid(self, form):
        self.object = form.save()
        success_url = reverse_lazy(
            'MEhub:student-detail-view', args=[self.object.pk])
        return HttpResponseRedirect(success_url)

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Retrieve the available section options from wherever they are defined
        # For example, if you have them in a list or queryset, you can do:
        # print(self.model.objects)
        context['section_options'] = [('B', 'B'), ('A', 'A'), ('C', 'C')]
        return context


class StudentDeleteView(DeleteView, LoginRequiredMixin, UserPassesTestMixin):
    model = Student
    template_name = '1.main/student/student_confirm_delete.html'
    success_url = reverse_lazy('MEhub:student-list-view')

    def test_func(self):
        return self.request.user.is_authenticated and (self.request.user.is_superuser or self.request.user.role == "TEACHER")
