import os
from contextlib import contextmanager
from dagster import ConfigurableResource
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))


class DatabaseResource(ConfigurableResource):
    database_url: str

    @contextmanager
    def get_session(self):
        engine = create_engine(self.database_url)
        with Session(engine) as session:
            yield session


def make_database_resource() -> DatabaseResource:
    db_password = os.getenv('DB_PASSWORD', '')
    database_url = os.getenv(
        'DATABASE_URL',
        f'postgresql://garden_user:{db_password}@localhost:5432/garden'
    )
    return DatabaseResource(database_url=database_url)
