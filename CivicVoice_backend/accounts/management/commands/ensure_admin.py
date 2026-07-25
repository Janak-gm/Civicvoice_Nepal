import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create a superuser from environment variables if none exists"

    def handle(self, *args, **options):
        User = get_user_model()
        email = os.getenv("DJANGO_SUPERUSER_EMAIL")
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")
        username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin")

        if not email or not password:
            self.stdout.write("DJANGO_SUPERUSER_EMAIL or DJANGO_SUPERUSER_PASSWORD not set, skipping")
            return

        if User.objects.filter(email=email).exists():
            self.stdout.write(f"Superuser {email} already exists")
            return

        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
        )
        self.stdout.write(self.style.SUCCESS(f"Superuser {email} created"))
