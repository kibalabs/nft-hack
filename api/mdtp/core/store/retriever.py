import dataclasses
import datetime
from enum import Enum
from typing import Optional
from typing import Sequence

from databases import Database
from sqlalchemy import Table
from sqlalchemy.sql.expression import FromClause
from sqlalchemy.sql.expression import func as sqlalchemyfunc

class Direction(Enum):
    ASCENDING = 'ascending'
    DESCENDING = 'descending'

@dataclasses.dataclass
class Order:
    fieldName: str
    direction: Direction = Direction.DESCENDING

@dataclasses.dataclass
class RandomOrder(Order):
    fieldName: str = '__KIBA_RANDOM'

@dataclasses.dataclass
class FieldFilter:
    fieldName: str
    isNull: Optional[bool] = None
    isNotNull: Optional[bool] = None

@dataclasses.dataclass
class StringFieldFilter(FieldFilter):
    eq: Optional[int] = None
    ne: Optional[int] = None
    containedIn: Optional[Sequence[int]] = None
    notContainedIn: Optional[Sequence[int]] = None

@dataclasses.dataclass
class DateFieldFilter(FieldFilter):
    eq: Optional[datetime.datetime] = None
    ne: Optional[datetime.datetime] = None
    lte: Optional[datetime.datetime] = None
    lt: Optional[datetime.datetime] = None
    gte: Optional[datetime.datetime] = None
    gt: Optional[datetime.datetime] = None
    containedIn: Optional[Sequence[datetime.datetime]] = None
    notContainedIn: Optional[Sequence[datetime.datetime]] = None

class Retriever:

    def __init__(self, database: Database):
        self.database = database

    def _apply_order(self, query: FromClause, table: Table, order: Order) -> FromClause:
        if isinstance(order, RandomOrder):
            query = query.order_by(sqlalchemyfunc.random())
        else:
            field = table.c[order.fieldName]
            query = query.order_by(field.asc() if order.direction == Direction.ASCENDING else field.desc())
        return query

    def _apply_string_field_filter(self, query: FromClause, table: Table, fieldFilter: StringFieldFilter) -> FromClause:
        field = table.c[fieldFilter.fieldName]
        if fieldFilter.eq is not None:
            query = query.where(field == fieldFilter.eq)
        if fieldFilter.ne is not None:
            query = query.where(field != fieldFilter.ne)
        if fieldFilter.containedIn is not None:
            query = query.where(field.in_(fieldFilter.containedIn))
        if fieldFilter.notContainedIn is not None:
            query = query.where(field.notin_(fieldFilter.notContainedIn))
        return query

    def _apply_date_field_filter(self, query: FromClause, table: Table, fieldFilter: DateFieldFilter) -> FromClause:
        field = table.c[fieldFilter.fieldName]
        if fieldFilter.eq is not None:
            query = query.where(field == fieldFilter.eq)
        if fieldFilter.ne is not None:
            query = query.where(field != fieldFilter.ne)
        if fieldFilter.lte is not None:
            query = query.where(field <= fieldFilter.lte)
        if fieldFilter.lt is not None:
            query = query.where(field < fieldFilter.lt)
        if fieldFilter.gte is not None:
            query = query.where(field >= fieldFilter.gte)
        if fieldFilter.gt is not None:
            query = query.where(field > fieldFilter.gt)
        if fieldFilter.containedIn is not None:
            query = query.where(field.in_(fieldFilter.containedIn))
        if fieldFilter.notContainedIn is not None:
            query = query.where(field.notin_(fieldFilter.notContainedIn))
        return query

    def _apply_field_filter(self, query: FromClause, table: Table, fieldFilter: FieldFilter) -> FromClause:
        field = table.c[fieldFilter.fieldName]
        if fieldFilter.isNull:
            query = query.where(field == None)
        if fieldFilter.isNotNull:
            query = query.where(field != None)
        if isinstance(fieldFilter, DateFieldFilter):
            query = self._apply_date_field_filter(query=query, table=table, fieldFilter=fieldFilter)
        if isinstance(fieldFilter, StringFieldFilter):
            query = self._apply_string_field_filter(query=query, table=table, fieldFilter=fieldFilter)
        return query

    def _apply_field_filters(self, query: FromClause, table: Table, fieldFilters: Sequence[FieldFilter]) -> FromClause:
        for fieldFilter in fieldFilters:
            query = self._apply_field_filter(query=query, table=table, fieldFilter=fieldFilter)
        return query
