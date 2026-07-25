from django.contrib import admin

from ai.models import ModerationLog


@admin.register(ModerationLog)
class ModerationLogAdmin(admin.ModelAdmin):
    list_display = ["report", "decision", "moderation_time", "created_at"]
    list_filter = ["decision"]
    search_fields = ["report__title", "reasons"]