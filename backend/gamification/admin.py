from django.contrib import admin

from .models import Badge, StudentBadge, StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ["user", "xp", "quizzes_completed", "xp_updated_at"]
    search_fields = ["user__username", "user__first_name"]
    # Totals are owned by the submission service; editing them by hand would
    # put them out of step with the attempt history.
    readonly_fields = ["xp", "quizzes_completed", "xp_updated_at"]


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ["icon", "name", "rule", "threshold", "order"]
    list_editable = ["order"]


@admin.register(StudentBadge)
class StudentBadgeAdmin(admin.ModelAdmin):
    list_display = ["user", "badge", "awarded_at"]
    list_filter = ["badge"]
