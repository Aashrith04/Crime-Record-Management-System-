from typing import List, Tuple
from sqlalchemy import or_, desc, asc
from sqlalchemy.orm import Session, joinedload
from app.models.crime import Crime
from app.models.user import User
from app.repositories.base import BaseRepository
from app.schemas.crime import CrimeFilter

class CrimeRepository(BaseRepository[Crime]):
    def __init__(self, db: Session):
        super().__init__(Crime, db)

    def filter_crimes(self, filter_params: CrimeFilter) -> Tuple[List[Crime], int]:
        query = self.db.query(Crime).options(
            joinedload(Crime.assigned_officer)
        )

        if filter_params.is_deleted is not None:
            query = query.filter(Crime.is_deleted == filter_params.is_deleted)

        # Full-text search on title, description, crime_number, location_name
        if filter_params.search:
            search_pattern = f"%{filter_params.search}%"
            query = query.filter(
                or_(
                    Crime.title.ilike(search_pattern),
                    Crime.description.ilike(search_pattern),
                    Crime.crime_number.ilike(search_pattern),
                    Crime.location_name.ilike(search_pattern),
                )
            )

        if filter_params.crime_type:
            query = query.filter(Crime.crime_type == filter_params.crime_type)

        if filter_params.status:
            query = query.filter(Crime.status == filter_params.status)

        if filter_params.priority:
            query = query.filter(Crime.priority == filter_params.priority)

        if filter_params.severity:
            query = query.filter(Crime.severity == filter_params.severity)

        if filter_params.station_name:
            query = query.join(User, Crime.assigned_officer_id == User.id, isouter=True).filter(
                User.station_name == filter_params.station_name
            )

        if filter_params.start_date:
            query = query.filter(Crime.crime_date >= filter_params.start_date)

        if filter_params.end_date:
            query = query.filter(Crime.crime_date <= filter_params.end_date)

        total = query.count()

        # Sorting
        sort_column = getattr(Crime, filter_params.sort_by, Crime.created_at)
        if filter_params.sort_order.lower() == "desc":
            query = query.order_by(desc(sort_column))
        else:
            query = query.order_by(asc(sort_column))

        # Pagination
        skip = (filter_params.page - 1) * filter_params.page_size
        items = query.offset(skip).limit(filter_params.page_size).all()

        return items, total
