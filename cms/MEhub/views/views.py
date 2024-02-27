from django.shortcuts import render
from django.views.generic import  View
from django.contrib.auth.mixins import LoginRequiredMixin

# The views of MEhub
from .dashboard import AdminDashboardView, TeacherDashboardView, StudentDashboardView
from .student import StudentCreateView, StudentDeleteView, StudentDetailView, StudentListView, StudentUpdateView
from .subject import SubjectAddView, SubjectDeleteView, SubjectListView, SubjectEditView
from .invoice import InvoiceAddView, InvoiceDeleteView, InvoiceEditView, InvoiceListView
from .teacher import TeacherAddView, TeacherDeleteView, TeacherEditView, TeacherDetailView, TeacherListView


class HomeView(View, LoginRequiredMixin):
    def get(self, request):
        if request.user.is_superuser:
            return render(request, 'admin_dashboard.html',{'user':self.request.user})
            
        context={"request":request, "user":self.request.user}
        return render(request,'student_dashboard.html', context)
    

 








