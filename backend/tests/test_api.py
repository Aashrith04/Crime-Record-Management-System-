import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_login_success():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@police.gov.in", "password": "Admin@123456"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data["data"]

def test_login_invalid_credentials():
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@police.gov.in", "password": "WrongPassword"}
    )
    assert response.status_code in (400, 401)

def test_unauthorized_access_protected_endpoint():
    response = client.get("/api/v1/crimes")
    assert response.status_code == 401
