"""
python manage.py seed                  # quizzes and badges (safe to run on every deploy)
python manage.py seed --demo-students  # also create fictitious students for the leaderboard
"""

import random
import uuid

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import transaction

from gamification.models import Badge, StudentProfile
from quizzes.content import BADGES, QUIZZES, SHOWN_ORDER
from quizzes.models import Choice, Question, Quiz
from quizzes.services import submit_attempt

User = get_user_model()

# Fictitious accounts only. No real student data is used anywhere.
DEMO_PASSWORD = "NextGen-Demo-2026"
DEMO_STUDENTS = [
    # username, display name, how likely they are to pick the right answer
    ("demo_student", "Demo Student", None),
    ("ada_codes", "Ada Okafor", 0.95),
    ("tunde_builds", "Tunde Bello", 0.8),
    ("zainab_q", "Zainab Musa", 0.7),
    ("chidi_dev", "Chidi Eze", 0.6),
    ("amaka_learns", "Amaka Obi", 0.5),
]


class Command(BaseCommand):
    help = "Create the starter quizzes and badges, and optionally demo students."

    def add_arguments(self, parser):
        parser.add_argument(
            "--demo-students",
            action="store_true",
            help="Also create fictitious students with quiz history.",
        )

    def handle(self, *args, **options):
        self.verbose = options["verbosity"] > 0
        self.seed_badges()
        self.seed_quizzes()
        if options["demo_students"]:
            self.seed_students()

    def seed_badges(self):
        for order, data in enumerate(BADGES):
            Badge.objects.update_or_create(
                code=data["code"], defaults={**data, "order": order}
            )
        if self.verbose:
            self.stdout.write(f"Badges: {Badge.objects.count()}")

    @transaction.atomic
    def seed_quizzes(self):
        for order, data in enumerate(QUIZZES):
            quiz, _ = Quiz.objects.update_or_create(
                slug=data["slug"],
                defaults={
                    "title": data["title"],
                    "topic": data["topic"],
                    "description": data["description"],
                    "order": order,
                },
            )
            if quiz.questions.exists():
                # Never rebuild questions that may already have answers recorded.
                continue
            for q_order, (text, options, explanation) in enumerate(data["questions"]):
                question = Question.objects.create(
                    quiz=quiz, text=text, explanation=explanation, order=q_order
                )
                for index in SHOWN_ORDER[q_order % len(SHOWN_ORDER)]:
                    Choice.objects.create(
                        question=question, text=options[index], is_correct=index == 0
                    )
        if self.verbose:
            self.stdout.write(f"Quizzes: {Quiz.objects.count()}")

    def seed_students(self):
        rng = random.Random(2026)
        quizzes = list(Quiz.objects.prefetch_related("questions__choices"))
        for username, name, accuracy in DEMO_STUDENTS:
            user, created = User.objects.get_or_create(
                username=username, defaults={"first_name": name}
            )
            if created:
                user.set_password(DEMO_PASSWORD)
                user.save()
            StudentProfile.objects.get_or_create(user=user)
            if accuracy is None or user.quiz_attempts.exists():
                continue  # demo_student starts fresh so reviewers can try it themselves
            # Use the real submission service, so demo XP follows the real rules.
            for quiz in quizzes[: rng.randint(1, len(quizzes))]:
                answers = []
                for question in quiz.questions.all():
                    choices = list(question.choices.all())
                    correct = next(c for c in choices if c.is_correct)
                    pick = correct if rng.random() < accuracy else rng.choice(choices)
                    answers.append({"question": question.id, "choice": pick.id})
                submit_attempt(
                    user=user, quiz=quiz, answers=answers, idempotency_key=uuid.uuid4()
                )
        if self.verbose:
            self.stdout.write(f"Demo students ready (password: {DEMO_PASSWORD})")
