from app.core.database import SessionLocal
from app.models.property import PropertyStage
from app.models.stage_info import StageInfo
from app.models.user import UserRole

def backfill_stage_info():
    db = SessionLocal()
    try:
        stages = db.query(PropertyStage).all()
        count = 0
        for stage in stages:
            for role in UserRole:
                exists = db.query(StageInfo).filter_by(stage=stage.stage, role=role.value).first()
                if not exists:
                    db.add(StageInfo(stage=stage.stage, role=role.value, explanation=f"Explain the {stage.stage}"))
                    count += 1
        db.commit()
        print(f"Backfilled {count} stage_info entries.")
    finally:
        db.close()

if __name__ == "__main__":
    backfill_stage_info() 