from django.urls import path
from .views import (
    SchoolListCreateView, SchoolDetailView,
    DepartmentListCreateView, DepartmentDetailView,
    TeacherListCreateView, TeacherDetailView,
    CourseListCreateView, CourseDetailView,
    StudentListCreateView, StudentDetailView,
    ClassListCreateView, ClassDetailView,
    AttendanceListCreateView, AttendanceDetailView,
    ExamListCreateView, ExamDetailView,
    ResultListCreateView, ResultDetailView,
)

urlpatterns = [
    path('schools/', SchoolListCreateView.as_view(), name='school-list-create'),
    
    path('school/<int:pk>/departments/', DepartmentListCreateView.as_view(),
         name='department-list-create'),
    
    path('school/<int:pk>/teachers/',
         TeacherListCreateView.as_view(), name='teacher-list-create'),
    
    path('schools/<int:pk>/', SchoolDetailView.as_view(), name='school-detail'),

    path('departments/<int:pk>/', DepartmentDetailView.as_view(),
         name='department-detail'),

    path('teachers/', TeacherListCreateView.as_view(), name='teacher-list-create'),
    path('teachers/<int:pk>/', TeacherDetailView.as_view(), name='teacher-detail'),

    path('courses/', CourseListCreateView.as_view(), name='course-list-create'),
    path('courses/<int:pk>/', CourseDetailView.as_view(), name='course-detail'),

    path('students/', StudentListCreateView.as_view(), name='student-list-create'),
    path('students/<int:pk>/', StudentDetailView.as_view(), name='student-detail'),

    path('classes/', ClassListCreateView.as_view(), name='class-list-create'),
    path('classes/<int:pk>/', ClassDetailView.as_view(), name='class-detail'),

    path('attendances/', AttendanceListCreateView.as_view(),
         name='attendance-list-create'),
    path('attendances/<int:pk>/', AttendanceDetailView.as_view(),
         name='attendance-detail'),

    path('exams/', ExamListCreateView.as_view(), name='exam-list-create'),
    path('exams/<int:pk>/', ExamDetailView.as_view(), name='exam-detail'),

    path('results/', ResultListCreateView.as_view(), name='result-list-create'),
    path('results/<int:pk>/', ResultDetailView.as_view(), name='result-detail'),
]
