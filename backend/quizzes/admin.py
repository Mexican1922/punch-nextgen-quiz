from django.contrib import admin
from django.core.exceptions import ValidationError
from django.forms.models import BaseInlineFormSet

from .models import AttemptAnswer, Choice, Question, Quiz, QuizAttempt


class ChoiceInlineFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()
        correct = sum(
            1
            for form in self.forms
            if form.cleaned_data
            and not form.cleaned_data.get("DELETE")
            and form.cleaned_data.get("is_correct")
        )
        if correct != 1:
            raise ValidationError("Each question needs exactly one correct option.")


class ChoiceInline(admin.TabularInline):
    model = Choice
    formset = ChoiceInlineFormSet
    extra = 4


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ["text", "quiz", "order"]
    list_filter = ["quiz"]
    inlines = [ChoiceInline]


class QuestionInline(admin.TabularInline):
    model = Question
    fields = ["order", "text"]
    extra = 0
    show_change_link = True


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ["title", "topic", "is_published", "order"]
    prepopulated_fields = {"slug": ["title"]}
    inlines = [QuestionInline]


class AttemptAnswerInline(admin.TabularInline):
    model = AttemptAnswer
    readonly_fields = ["question", "choice", "is_correct"]
    extra = 0
    can_delete = False


@admin.register(QuizAttempt)
class QuizAttemptAdmin(admin.ModelAdmin):
    list_display = ["user", "quiz", "score", "total", "is_rewarded", "xp_awarded", "created_at"]
    list_filter = ["quiz", "is_rewarded"]
    # Attempts are an audit trail; staff can read them but not alter them.
    readonly_fields = [f.name for f in QuizAttempt._meta.fields]
    inlines = [AttemptAnswerInline]

    def has_add_permission(self, request):
        return False
