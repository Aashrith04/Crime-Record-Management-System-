from typing import Generic, List, Optional, TypeVar
from pydantic import BaseModel

DataT = TypeVar("DataT")

class StandardResponse(BaseModel, Generic[DataT]):
    success: bool = True
    message: str = "Success"
    data: Optional[DataT] = None

class PaginatedData(BaseModel, Generic[DataT]):
    items: List[DataT]
    page: int
    page_size: int
    total: int
    total_pages: int

class PaginatedResponse(StandardResponse[PaginatedData[DataT]], Generic[DataT]):
    pass

class ErrorDetail(BaseModel):
    loc: Optional[List[str]] = None
    msg: str
    type: Optional[str] = None

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    error_code: str
    errors: Optional[List[ErrorDetail]] = None
