import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv

from services.product_service import get_workflow
from utils.db import get_db

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


async def main():
    db = get_db()
    workflow = await get_workflow()
    now = datetime.now(timezone.utc)

    await db.products.delete_many({"order_number": {"$regex": "^DUMMY-"}})
    await db.users.delete_many({"email": {"$regex": "^dummy\\."}})

    users = []
    for step in workflow:
        users.append(
            {
                "id": str(uuid.uuid4()),
                "email": f"dummy.{step.department_id}@enamels.com",
                "name": f"{step.department_id.title()} Operator",
                "role": "employee",
                "department_id": step.department_id,
                # placeholder hash string for seed visibility only
                "password_hash": "seeded-by-script",
                "created_at": now,
            }
        )
    if users:
        await db.users.insert_many(users)

    for i, current in enumerate(workflow, start=1):
        created_at = now - timedelta(days=i % 3, hours=i)
        steps = []
        history = [
            {
                "stage": workflow[0].name,
                "note": "Dummy order created",
                "changed_by": "admin@enamels.com",
                "changed_at": created_at,
            }
        ]

        for s_idx, step in enumerate(workflow):
            status = "pending"
            deadline_at = None
            completed_at = None
            completed_by = None

            if s_idx < i - 1:
                status = "completed"
                completed_at = created_at + timedelta(hours=2 * (s_idx + 1))
                completed_by = f"dummy.{step.department_id}@enamels.com"
            elif s_idx == i - 1:
                status = "current"
                deadline_at = created_at + timedelta(hours=step.deadline_hours)

            steps.append(
                {
                    "index": s_idx,
                    "stage": step.name,
                    "department_id": step.department_id,
                    "deadline_hours": step.deadline_hours,
                    "status": status,
                    "deadline_at": deadline_at,
                    "completed_at": completed_at,
                    "completed_by": completed_by,
                }
            )

        for done_idx in range(1, i):
            history.append(
                {
                    "stage": workflow[done_idx].name,
                    "note": "Completed previous step (dummy)",
                    "changed_by": f"dummy.{workflow[done_idx - 1].department_id}@enamels.com",
                    "changed_at": created_at + timedelta(hours=2 * done_idx),
                }
            )

        await db.products.insert_one(
            {
                "id": str(uuid.uuid4()),
                "name": f"Dummy Product {i}",
                "order_number": f"DUMMY-{i:03d}",
                "batch_number": f"DB-{100 + i}",
                "current_stage": current.name,
                "current_department_id": current.department_id,
                "workflow_steps": steps,
                "history": history,
                "created_by": "admin@enamels.com",
                "created_at": created_at,
                "updated_at": created_at + timedelta(hours=max(1, 2 * (i - 1))),
            }
        )

    print(f"Seeded {len(workflow)} dummy orders and {len(users)} dummy employees.")


if __name__ == "__main__":
    asyncio.run(main())
