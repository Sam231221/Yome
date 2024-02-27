from django.shortcuts import render
from django.views.generic import View
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin


class AdminDashboardView(View, LoginRequiredMixin, UserPassesTestMixin):
    def get(self, request):
        return render(request, 'admin_dashboard.html', {'user': self.request.user})

    def test_func(self):
        return self.request.user.is_authenticated and self.request.user.is_superuser


class TeacherDashboardView(View, LoginRequiredMixin, UserPassesTestMixin):
    def get(self, request):
        return render(request, 'teacher_dashboard.html', {'user': self.request.user})

    def test_func(self):
        cdn1 = self.request.user.is_authenticated
        cdn2 = str(self.request.user.role).upper == "TEACHER"
        cdn3 = self.request.user.is_superuser == True
        return cdn1 and (cdn2 or cdn3)


class StudentDashboardView(View, LoginRequiredMixin, UserPassesTestMixin):
    def get(self, request):
        return render(request, 'student_dashboard.html', {'user': self.request.user})

    def test_func(self):
        cdn1 = self.request.user.is_authenticated
        cdn2 = str(self.request.user.role).upper == "TEACHER" or "STUDENT"
        cdn3 = self.request.user.is_superuser == True
        return cdn1 and (cdn2 or cdn3)
