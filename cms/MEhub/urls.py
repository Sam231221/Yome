
from django.contrib.auth.decorators import login_required
from django.urls import path

from .views import views

app_name = "MEhub"

urlpatterns = [
    path("", login_required(views.HomeView.as_view()), name="home-view"),  
    path("student-dashboard/", login_required(views.StudentDashboardView.as_view()), name="student-dashboard"),  
    path("admin-dashboard/", login_required(views.AdminDashboardView.as_view()), name="admin-dashboard"),  
    path("teacher-dashboard/", login_required(views.TeacherDashboardView.as_view()), name="teacher-dashboard"),  
    
    path("students/", views.StudentListView.as_view(), name="student-list-view"),
    path("student/add", login_required(views.StudentCreateView.as_view()), name="student-add-view"),
    path("student/<int:pk>/edit", login_required(views.StudentUpdateView.as_view()), name="student-edit-view"),
    path("student/<int:pk>/delete",login_required(views.StudentDeleteView.as_view()) , name="student-delete-view"),  
    path("student/<int:pk>", views.StudentDetailView.as_view(), name="student-detail-view"),

    path("teachers", views.TeacherListView.as_view(), name="teacher-list-view"),  
    path("teacher/add",login_required(views.TeacherAddView.as_view()) , name="teacher-add-view"),  
    path("teacher/<int:pk>", login_required(views.TeacherDetailView.as_view()), name="teacher-detail-view"),
    path("teacher/<int:pk>/edit", login_required(views.TeacherEditView.as_view()), name="teacher-edit-view"),  
    path("teacher/<int:pk>/delete",login_required(views.TeacherDeleteView.as_view()) , name="teacher-delete-view"),  
   
    path("teacher/attendances", views.TeacherAttendanceListView.as_view(), name="teacher-attendance-list-view"),  
    path("teacher/attendance/add",login_required(views.TeacherAttendanceCreateView.as_view()) , name="teacher-attendance-add-view"),  
    path("teacher/attendance/<int:pk>", login_required(views.TeacherAttendanceDetailView.as_view()), name="teacher-attendance-detail-view"),
    path("teacher/attendance/<int:pk>/edit", login_required(views.TeacherAttendanceUpdateView.as_view()), name="teacher-attendance-edit-view"),  
    path("teacher/attendance/<int:pk>/delete",login_required(views.TeacherAttendanceDeleteView.as_view()) , name="teacher-attendance-delete-view"),  

    path("student/attendances", views.StudentAttendanceListView.as_view(), name="student-attendance-list-view"),  
    path("student/attendance/add",login_required(views.StudentAttendanceCreateView.as_view()) , name="student-attendance-add-view"),  
    path("student/attendance/<int:pk>", login_required(views.StudentAttendanceDetailView.as_view()), name="student-attendance-detail-view"),
    path("student/attendance/<int:pk>/edit", login_required(views.StudentAttendanceUpdateView.as_view()), name="student-attendance-edit-view"),  
    path("student/attendance/<int:pk>/delete",login_required(views.StudentAttendanceDeleteView.as_view()) , name="student-attendance-delete-view"),  

    path("subjects", views.SubjectListView.as_view(), name="subject-list-view"),  
    path("subjects/1", views.SubjectEditView.as_view(), name="subject-edit-view"),  
    path("subjects/add",views.SubjectAddView.as_view() , name="subject-add-view"),  
    path("subjects/1",views.SubjectDeleteView.as_view() , name="subject-delete-view"),  
   
    path("invoices/", views.InvoiceListView.as_view(), name="invoice-list-view"),  
    path("invoices/2", views.InvoiceEditView.as_view(), name="invoice-edit-view"),  
    path("invoices/add",views.InvoiceAddView.as_view() , name="invoice-add-view"),  
    path("invoices/2",views.InvoiceDeleteView.as_view() , name="invoice-delete-view"),  
   

]
