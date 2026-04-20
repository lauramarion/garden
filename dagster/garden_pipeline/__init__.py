from dagster import Definitions
from .assets import plant_status_snapshot, generate_tasks
from .schedules import daily_schedule, daily_job
from .resources import make_database_resource

defs = Definitions(
    assets=[plant_status_snapshot, generate_tasks],
    schedules=[daily_schedule],
    jobs=[daily_job],
    resources={"database": make_database_resource()},
)
