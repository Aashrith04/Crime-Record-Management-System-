from enum import Enum

class PermissionEnum(str, Enum):
    # User & Role Permissions
    USER_CREATE = "user:create"
    USER_READ = "user:read"
    USER_UPDATE = "user:update"
    USER_DELETE = "user:delete"
    ROLE_MANAGE = "role:manage"

    # Crime Permissions
    CRIME_CREATE = "crime:create"
    CRIME_READ = "crime:read"
    CRIME_UPDATE = "crime:update"
    CRIME_DELETE = "crime:delete"
    CRIME_ASSIGN = "crime:assign"

    # FIR Permissions
    FIR_CREATE = "fir:create"
    FIR_READ = "fir:read"
    FIR_UPDATE = "fir:update"
    FIR_DELETE = "fir:delete"
    FIR_APPROVE = "fir:approve"

    # Criminal Permissions
    CRIMINAL_CREATE = "criminal:create"
    CRIMINAL_READ = "criminal:read"
    CRIMINAL_UPDATE = "criminal:update"
    CRIMINAL_DELETE = "criminal:delete"

    # Victim & Witness Permissions
    VICTIM_MANAGE = "victim:manage"
    WITNESS_MANAGE = "witness:manage"

    # Evidence Permissions
    EVIDENCE_UPLOAD = "evidence:upload"
    EVIDENCE_READ = "evidence:read"
    EVIDENCE_DELETE = "evidence:delete"

    # Investigation & Case Diary
    INVESTIGATION_READ = "investigation:read"
    INVESTIGATION_UPDATE = "investigation:update"
    CASE_DIARY_ADD = "case_diary:add"

    # Analytics, Reports, AI & Logs
    ANALYTICS_VIEW = "analytics:view"
    REPORT_GENERATE = "report:generate"
    AI_ASSISTANT_USE = "ai:use"
    AUDIT_LOG_VIEW = "audit_log:view"
    SYSTEM_SETTINGS = "system:settings"
