from django.shortcuts import render
from django.views.generic import View
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from ..models.models import Student, Teacher
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from ..forms.forms import TeacherForm
from django.http import HttpResponseRedirect


class SubjectListView(View):
    def get(self, request):
        context = {}
        return render(request, '1.main/subject/subjects.html', context)


class SubjectEditView(View):
    def get(self, request):
        context = {}
        return render(request, '1.main/subject/edit-subject.html', context)


class SubjectAddView(View):
    def get(self, request):
        context = {}
        return render(request, '1.main/subject/add-subject.html', context)


class SubjectDeleteView(View):
    def post(self, request):

        product_id = int(request.POST.get('productid'))
        product_qty = int(request.POST.get('productqty'))

        return product_id
