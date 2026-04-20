from dagster import asset, AssetExecutionContext
from ..resources import DatabaseResource
from sqlalchemy import text


@asset(deps=["plant_status_snapshot"])
def generate_tasks(context: AssetExecutionContext, database: DatabaseResource):
    """Generate tasks from plant status rules. Idempotent — skips plants
    that already have a pending task with the same source rule."""
    created = 0

    with database.get_session() as session:

        # Rule 1: WARNING plant with no pending auto-generated task
        warning_plants = session.execute(text("""
            SELECT p.id, p.common_name
            FROM plants p
            WHERE p.is_active = true
              AND p.status = 'WARNING'
              AND NOT EXISTS (
                  SELECT 1 FROM tasks t
                  WHERE t.plant_id = p.id
                    AND t.status = 'pending'
                    AND t.source = 'auto'
              )
        """)).fetchall()

        for plant_id, name in warning_plants:
            session.execute(text("""
                INSERT INTO tasks (plant_id, title, priority, status, source)
                VALUES (:plant_id, :title, 'urgent', 'pending', 'auto')
            """), {"plant_id": plant_id, "title": f"Investigate: {name}"})
            created += 1

        # Rule 2: No journal action for the plant in the last 14 days
        neglected_plants = session.execute(text("""
            SELECT p.id, p.common_name
            FROM plants p
            WHERE p.is_active = true
              AND NOT EXISTS (
                  SELECT 1 FROM journal_entries je
                  WHERE je.plant_id = p.id
                    AND je.entry_type = 'action'
                    AND je.entry_date >= current_date - interval '14 days'
              )
              AND NOT EXISTS (
                  SELECT 1 FROM tasks t
                  WHERE t.plant_id = p.id
                    AND t.status = 'pending'
                    AND t.source = 'auto'
                    AND t.title LIKE 'Check on:%'
              )
        """)).fetchall()

        for plant_id, name in neglected_plants:
            session.execute(text("""
                INSERT INTO tasks (plant_id, title, priority, status, source)
                VALUES (:plant_id, :title, 'soon', 'pending', 'auto')
            """), {"plant_id": plant_id, "title": f"Check on: {name}"})
            created += 1

        session.commit()

    context.log.info(f"Created {created} tasks")
    return {"created": created}
