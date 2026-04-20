from dagster import asset, AssetExecutionContext
from ..resources import DatabaseResource
from sqlalchemy import text


@asset
def plant_status_snapshot(context: AssetExecutionContext, database: DatabaseResource):
    """Daily snapshot of every active plant's status into plant_status_history.
    Skips plants already snapshotted today."""
    with database.get_session() as session:
        result = session.execute(text("""
            INSERT INTO plant_status_history (plant_id, status, notes, recorded_at)
            SELECT
                id,
                status,
                status_notes,
                now()
            FROM plants
            WHERE is_active = true
              AND NOT EXISTS (
                  SELECT 1 FROM plant_status_history psh
                  WHERE psh.plant_id = plants.id
                    AND psh.recorded_at::date = current_date
              )
        """))
        session.commit()
        count = result.rowcount

    context.log.info(f"Snapshotted {count} plants")
    return {"snapshotted": count}
