#!/bin/bash
set -e
python manage.py ensure_admin
daphne -b 0.0.0.0 -p $PORT config.asgi:application
