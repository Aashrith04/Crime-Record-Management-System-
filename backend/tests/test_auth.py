import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.redis import revoke_token, is_token_revoked

client = TestClient(app)

def test_login_and_token_revocation():
    # Login
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@police.gov.in", "password": "Admin@123456"}
    )
    assert response.status_code == 200
    data = response.json()
    token = data["data"]["access_token"]
    assert token is not None

    # Revoke token
    revoke_token(token)
    assert is_token_revoked(token) is True

    # Attempt request with revoked token
    headers = {"Authorization": f"Bearer {token}"}
    res = client.get("/api/v1/auth/me", headers=headers)
    assert res.status_code == 401
    res_data = res.json()
    msg = res_data.get("message") or res_data.get("detail", "")
    assert "revoked" in msg.lower()
