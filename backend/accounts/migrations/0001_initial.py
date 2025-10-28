from django.conf import settings
from django.db import migrations, models
import django.contrib.auth.validators
import django.utils.timezone


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("auth", "0012_alter_user_first_name_max_length"),
    ]

    operations = [
        migrations.CreateModel(
            name="Permission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("code", models.CharField(max_length=100, unique=True)),
                ("name", models.CharField(max_length=150)),
                ("description", models.TextField(blank=True)),
            ],
            options={
                "ordering": ("code",),
            },
        ),
        migrations.CreateModel(
            name="Role",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=150, unique=True)),
                ("slug", models.SlugField(max_length=150, unique=True)),
                ("description", models.TextField(blank=True)),
                ("is_default", models.BooleanField(default=False, help_text="Marks roles that should be created as part of the default seed set. Only one default client role and one default sub-admin role should be flagged at a time.")),
            ],
            options={
                "ordering": ("name",),
            },
        ),
        migrations.CreateModel(
            name="User",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("password", models.CharField(max_length=128, verbose_name="password")),
                ("last_login", models.DateTimeField(blank=True, null=True, verbose_name="last login")),
                ("is_superuser", models.BooleanField(default=False, help_text="Designates that this user has all permissions without explicitly assigning them.", verbose_name="superuser status")),
                ("username", models.CharField(error_messages={"unique": "A user with that username already exists."}, help_text="Required. 150 characters or fewer. Letters, digits and @/./+/-/_ only.", max_length=150, unique=True, validators=[django.contrib.auth.validators.UnicodeUsernameValidator()], verbose_name="username")),
                ("first_name", models.CharField(blank=True, max_length=150, verbose_name="first name")),
                ("last_name", models.CharField(blank=True, max_length=150, verbose_name="last name")),
                ("email", models.EmailField(blank=True, max_length=254, verbose_name="email address")),
                ("is_staff", models.BooleanField(default=False, help_text="Designates whether the user can log into this admin site.", verbose_name="staff status")),
                ("is_active", models.BooleanField(default=True, help_text="Designates whether this user should be treated as active. Unselect this instead of deleting accounts.", verbose_name="active")),
                ("date_joined", models.DateTimeField(default=django.utils.timezone.now, verbose_name="date joined")),
                ("account_type", models.CharField(choices=[("superadmin", "Superadmin"), ("subadmin", "Sub-admin"), ("client", "Client")], default="client", help_text="Determines the primary category used for UI/segmentation.", max_length=20)),
            ],
            options={
                "verbose_name": "user",
                "verbose_name_plural": "users",
                "abstract": False,
            },
        ),
        migrations.AddField(
            model_name="role",
            name="assignable_roles",
            field=models.ManyToManyField(blank=True, help_text="Defines which roles can be assigned by members of this role. Superadmins should reference both client and sub-admin roles here.", related_name="managed_by_roles", symmetrical=False, to="accounts.role"),
        ),
        migrations.AddField(
            model_name="role",
            name="permissions",
            field=models.ManyToManyField(blank=True, help_text="Permissions that users of this role inherit.", related_name="roles", to="accounts.permission"),
        ),
        migrations.AddField(
            model_name="user",
            name="groups",
            field=models.ManyToManyField(blank=True, help_text="The groups this user belongs to. A user will get all permissions granted to each of their groups.", related_name="user_set", related_query_name="user", to="auth.group", verbose_name="groups"),
        ),
        migrations.AddField(
            model_name="user",
            name="managed_clients",
            field=models.ManyToManyField(blank=True, help_text="Allows sub-admins to manage specific client users.", related_name="managers", symmetrical=False, to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name="user",
            name="roles",
            field=models.ManyToManyField(blank=True, help_text="Roles granted to the user. Permissions from these roles determine the actions the user can perform.", related_name="users", to="accounts.role"),
        ),
        migrations.AddField(
            model_name="user",
            name="user_permissions",
            field=models.ManyToManyField(blank=True, help_text="Specific permissions for this user.", related_name="user_set", related_query_name="user", to="auth.permission", verbose_name="user permissions"),
        ),
    ]
