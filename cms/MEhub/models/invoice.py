from django.db import models
from .models import Student
from .models import Teacher


class Invoice(models.Model):
    student = models.ForeignKey(Student, related_name='invoices', on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, related_name='invoices', on_delete=models.CASCADE)
    invoice_number = models.CharField(max_length=20, unique=True)
    issue_date = models.DateField()
    due_date = models.DateField()
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    is_paid = models.BooleanField(default=False)

    def __str__(self):
        return f"Invoice #{self.invoice_number} - Student: {self.student.name}, Teacher: {self.teacher.name}"

    def mark_as_paid(self):
        self.is_paid = True
        self.save()


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(
        Invoice, related_name='items', on_delete=models.CASCADE)
    description = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def line_total(self):
        return self.quantity * self.unit_price

    def __str__(self):
        return self.description
