from django.db import models

from accounts.models import User
from reports.models import Report


class ModerationLog(models.Model):
    class Decision(models.TextChoices):
        APPROVED = "approved", "Approved"
        FLAGGED = "flagged", "Flagged"

    report = models.ForeignKey(
        Report, on_delete=models.CASCADE, related_name="moderation_logs"
    )
    decision = models.CharField(max_length=20, choices=Decision.choices)
    reasons = models.JSONField(default=list, blank=True)
    moderation_time = models.FloatField(help_text="Time taken in seconds")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Moderation {self.decision} for Report {self.report_id}"