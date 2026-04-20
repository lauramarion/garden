from dagster import ScheduleDefinition, define_asset_job

daily_job = define_asset_job("daily_pipeline", selection="*")

daily_schedule = ScheduleDefinition(
    name="daily_8am",
    job=daily_job,
    cron_schedule="0 8 * * *",
)
