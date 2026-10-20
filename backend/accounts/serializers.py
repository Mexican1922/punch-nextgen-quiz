from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from gamification.models import StudentProfile

User = get_user_model()


class RegisterSerializer(serializers.Serializer):
    username = serializers.RegexField(
        r"^[a-zA-Z0-9_.]{3,30}$",
        error_messages={
            "invalid": "Use 3-30 letters, numbers, underscores or dots.",
        },
    )
    display_name = serializers.CharField(min_length=2, max_length=40, trim_whitespace=True)
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("That username is already taken.")
        return value

    def validate(self, attrs):
        # Run Django's password rules (length, common passwords, too similar to username...).
        candidate = User(username=attrs["username"], first_name=attrs["display_name"])
        validate_password(attrs["password"], user=candidate)
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            first_name=validated_data["display_name"],
        )
        StudentProfile.objects.create(user=user)
        return user


class UserSerializer(serializers.ModelSerializer):
    display_name = serializers.CharField(source="first_name")

    class Meta:
        model = User
        fields = ["id", "username", "display_name"]
