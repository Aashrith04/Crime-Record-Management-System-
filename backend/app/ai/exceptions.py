from app.core.exceptions import CustomAPIException

class AIModuleDisabledException(CustomAPIException):
    def __init__(self, feature_name: str):
        super().__init__(
            status_code=403,
            message=f"AI Feature '{feature_name}' is currently disabled in system configuration."
        )

class AIProviderUnavailableException(CustomAPIException):
    def __init__(self, provider: str, reason: str = "Service unresponsive"):
        super().__init__(
            status_code=503,
            message=f"AI Provider '{provider}' unavailable: {reason}."
        )

class AIParseException(CustomAPIException):
    def __init__(self, details: str):
        super().__init__(
            status_code=422,
            message=f"AI Response Parsing Error: {details}."
        )
