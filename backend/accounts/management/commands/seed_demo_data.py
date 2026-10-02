import datetime
from django.core.management.base import BaseCommand
from accounts.models import CustomUser
from organizations.models import Organization, OrganizationRoster
from workers.models import WorkerProfile, Credential
from covers.models import AvailabilitySlot, CoverRequest


class Command(BaseCommand):
    help = "Seeds realistic demo data for Gymnastics Clubs, Coaches, Qualifications, Rosters, and Cover Requests"

    def handle(self, *args, **kwargs):
        self.stdout.write("Seeding demo data for coverMe (Gymnastics)...")

        # 1. Superuser / Admin
        admin_user, _ = CustomUser.objects.get_or_create(
            email="admin@coverme.com",
            defaults={
                "first_name": "System",
                "last_name": "Admin",
                "role": CustomUser.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        admin_user.set_password("AdminPass123!")
        admin_user.save()

        # 2. Clubs
        clubs_data = [
            {
                "email": "london@olympicgym.com",
                "name": "Olympic Gymnastics Academy",
                "city": "London",
                "address": "14 Crystal Palace Way",
                "postcode": "SE19 2BB",
                "head_coach": "Victoria Pendleton",
                "phone": "+44 20 7946 0192",
                "desc": "Premier Olympic disciplines club featuring high performance WAG, MAG, and recreational squads.",
            },
            {
                "email": "info@dynamogym.co.uk",
                "name": "Dynamo Gymnastics Centre",
                "city": "Birmingham",
                "address": "88 Bullring Avenue",
                "postcode": "B5 4BU",
                "head_coach": "David Whitlock",
                "phone": "+44 121 496 0381",
                "desc": "Community-focused facility offering Pre-School to Level 4 competitive artistic gymnastics & trampoline.",
            },
        ]

        created_clubs = {}
        for c in clubs_data:
            user, _ = CustomUser.objects.get_or_create(
                email=c["email"],
                defaults={
                    "first_name": c["name"].split()[0],
                    "last_name": "Club",
                    "role": CustomUser.Role.ORGANIZATION,
                    "phone": c["phone"],
                },
            )
            user.set_password("ClubPass123!")
            user.save()

            org, _ = Organization.objects.get_or_create(
                user=user,
                defaults={
                    "name": c["name"],
                    "city": c["city"],
                    "address": c["address"],
                    "postcode": c["postcode"],
                    "head_coach_name": c["head_coach"],
                    "phone": c["phone"],
                    "description": c["desc"],
                },
            )
            created_clubs[c["email"]] = org

        # 3. Coaches
        coaches_data = [
            {
                "email": "sarah.coach@gymcover.com",
                "first_name": "Sarah",
                "last_name": "Jenkins",
                "city": "London",
                "headline": "Level 3 Women's Artistic & Trampoline Senior Coach",
                "bio": "Over 9 years coaching competitive squads. Passionate about technique, beam confidence, and child development.",
                "hourly_rate": 35.00,
                "dbs": True,
                "safeguarding": True,
                "first_aid": True,
                "insurance": True,
                "quals": [
                    ("Women's Artistic", "Level 3", "British Gymnastics"),
                    ("Trampoline", "Level 2", "British Gymnastics"),
                    ("First Aid in Sport", "Certified", "St John Ambulance"),
                ],
                "availability": [
                    (0, "16:00", "20:30"),  # Monday
                    (2, "16:00", "20:30"),  # Wednesday
                    (5, "08:30", "14:00"),  # Saturday
                ],
            },
            {
                "email": "marcus.tumbler@gymcover.com",
                "first_name": "Marcus",
                "last_name": "Brown",
                "city": "London",
                "headline": "Level 2 Men's Artistic & Tumbling Coach",
                "bio": "Former national competitor specializing in floor acrobatics, vaulting mechanics, and strength & conditioning.",
                "hourly_rate": 30.00,
                "dbs": True,
                "safeguarding": True,
                "first_aid": True,
                "insurance": True,
                "quals": [
                    ("Men's Artistic", "Level 2", "British Gymnastics"),
                    ("Tumbling", "Level 2", "British Gymnastics"),
                ],
                "availability": [
                    (1, "17:00", "21:00"),  # Tuesday
                    (3, "17:00", "21:00"),  # Thursday
                    (6, "09:00", "15:00"),  # Sunday
                ],
            },
            {
                "email": "chloe.acro@gymcover.com",
                "first_name": "Chloe",
                "last_name": "Davies",
                "city": "Birmingham",
                "headline": "Level 3 Acrobatic Gymnastics & Pre-School Specialist",
                "bio": "Specialized in early-years movement foundation and national acro pairs and trios choreography.",
                "hourly_rate": 32.00,
                "dbs": True,
                "safeguarding": True,
                "first_aid": True,
                "insurance": True,
                "quals": [
                    ("Acrobatic Gymnastics", "Level 3", "British Gymnastics"),
                    ("Pre-School Gymnastics", "Level 2", "British Gymnastics"),
                ],
                "availability": [
                    (4, "15:00", "19:30"),  # Friday
                    (5, "09:00", "13:30"),  # Saturday
                ],
            },
        ]

        created_coaches = {}
        for c in coaches_data:
            user, _ = CustomUser.objects.get_or_create(
                email=c["email"],
                defaults={
                    "first_name": c["first_name"],
                    "last_name": c["last_name"],
                    "role": CustomUser.Role.WORKER,
                },
            )
            user.set_password("CoachPass123!")
            user.save()

            worker, _ = WorkerProfile.objects.get_or_create(
                user=user,
                defaults={
                    "headline": c["headline"],
                    "bio": c["bio"],
                    "hourly_rate": c["hourly_rate"],
                    "city": c["city"],
                    "dbs_checked": c["dbs"],
                    "safeguarding_certified": c["safeguarding"],
                    "first_aid_certified": c["first_aid"],
                    "insurance_valid": c["insurance"],
                },
            )

            # Credentials
            for disc, lvl, body in c["quals"]:
                Credential.objects.get_or_create(
                    worker=worker,
                    discipline=disc,
                    level=lvl,
                    issuing_body=body,
                    defaults={"is_verified": True},
                )

            # Availability
            for day, start, end in c["availability"]:
                AvailabilitySlot.objects.get_or_create(
                    worker=worker,
                    day_of_week=day,
                    start_time=start,
                    end_time=end,
                    defaults={"is_recurring": True},
                )

            created_coaches[c["email"]] = worker

        # 4. Roster links & Vetting
        olympic = created_clubs["london@olympicgym.com"]
        dynamo = created_clubs["info@dynamogym.co.uk"]

        sarah = created_coaches["sarah.coach@gymcover.com"]
        marcus = created_coaches["marcus.tumbler@gymcover.com"]
        chloe = created_coaches["chloe.acro@gymcover.com"]

        # Sarah is APPROVED at Olympic
        OrganizationRoster.objects.get_or_create(
            organization=olympic,
            worker=sarah,
            defaults={
                "status": OrganizationRoster.Status.APPROVED,
                "notes": "DBS enhanced check confirmed Jan 2026. Approved for competitive WAG squads.",
            },
        )

        # Marcus is PENDING at Olympic
        OrganizationRoster.objects.get_or_create(
            organization=olympic,
            worker=marcus,
            defaults={
                "status": OrganizationRoster.Status.PENDING,
                "notes": "Awaiting certificate upload for Level 2 MAG.",
            },
        )

        # Chloe is APPROVED at Dynamo
        OrganizationRoster.objects.get_or_create(
            organization=dynamo,
            worker=chloe,
            defaults={
                "status": OrganizationRoster.Status.APPROVED,
                "notes": "Regular guest coach, vetted and verified.",
            },
        )

        # 5. Cover Requests
        today = datetime.date.today()
        saturday = today + datetime.timedelta((5 - today.weekday()) % 7 or 7)
        sunday = today + datetime.timedelta((6 - today.weekday()) % 7 or 7)

        CoverRequest.objects.get_or_create(
            organization=olympic,
            created_by=olympic.user,
            title="Saturday Competitive WAG Squad Cover",
            date=saturday,
            start_time="09:00:00",
            end_time="13:30:00",
            defaults={
                "discipline_required": "Women's Artistic",
                "min_level_required": "Level 2",
                "hourly_rate": 35.00,
                "notes": "Lead coach off with flu. Squad of 8 gymnasts training bars and vault routines. Lesson plan is in the main office.",
                "status": CoverRequest.Status.OPEN,
            },
        )

        CoverRequest.objects.get_or_create(
            organization=dynamo,
            created_by=dynamo.user,
            title="Sunday Morning Pre-School & Acro Cover",
            date=sunday,
            start_time="09:30:00",
            end_time="12:30:00",
            defaults={
                "discipline_required": "Pre-School Gymnastics",
                "min_level_required": "Level 2",
                "hourly_rate": 32.00,
                "notes": "Fun recreational classes for ages 3-5. Warmups and circuit stations set up.",
                "status": CoverRequest.Status.OPEN,
            },
        )

        self.stdout.write(self.style.SUCCESS("Demo gymnastics data seeded successfully!"))
