from collections import defaultdict
from typing import Any, Optional
from utils.fuzzy_match import multi_field_score, is_fuzzy_match


COMPARE_SKIP_FIELDS = {
    "admission_no", "admission_no_raw", "source_sheet",
    "extra_fields", "difference_type", "ai_insight",
}


def _compare_fields(s: dict, p: dict, fields: list[str], threshold: float = 0.85) -> list[dict]:
    diffs = []
    for field in fields:
        if field in COMPARE_SKIP_FIELDS:
            continue
        sv = str(s.get(field, "")).strip()
        pv = str(p.get(field, "")).strip()
        if sv.lower() == pv.lower():
            continue
        if is_fuzzy_match(sv, pv, threshold):
            continue
        diffs.append({
            "field_name": field,
            "old_value": sv,
            "new_value": pv,
        })
    return diffs


def _get_compare_fields(school_records: list[dict], portal_records: list[dict]) -> list[str]:
    all_fields = set()
    for r in school_records:
        all_fields.update(r.keys())
    for r in portal_records:
        all_fields.update(r.keys())
    return sorted(all_fields - COMPARE_SKIP_FIELDS)


def compare(
    school_records: list[dict[str, Any]],
    portal_records: list[dict[str, Any]],
    threshold: float = 0.75,
    ai_service: Optional[Any] = None,
    stream_callback: Optional[callable] = None,
) -> dict[str, Any]:
    school_by_id = {r["admission_no"]: r for r in school_records}
    portal_by_id = {r["admission_no"]: r for r in portal_records}

    school_ids = set(school_by_id.keys())
    portal_ids = set(portal_by_id.keys())

    exact_matched_ids = school_ids & portal_ids
    new_ids = set(portal_ids - school_ids)
    missing_ids = set(school_ids - portal_ids)

    total_steps = len(exact_matched_ids) + len(new_ids) + len(missing_ids)
    step = 0

    fuzzy_matched_pairs: list[tuple[str, str, float]] = []

    def _progress(msg: str):
        if stream_callback:
            step_ = min(step, total_steps) if total_steps > 0 else 1
            stream_callback("progress", {
                "message": msg,
                "current": step_,
                "total": total_steps,
            })

    _progress("Running fuzzy matching for unmatched records...")

    if missing_ids and new_ids:
        missing_list = [(sid, school_by_id[sid]) for sid in sorted(missing_ids)]
        new_list = [(pid, portal_by_id[pid]) for pid in sorted(new_ids)]

        used_portal: set[str] = set()
        used_school: set[str] = set()

        scored_pairs = []
        for pid, precord in new_list:
            for sid, srecord in missing_list:
                if sid in used_school or pid in used_portal:
                    continue
                score = multi_field_score(precord, srecord)
                if score >= threshold:
                    scored_pairs.append((score, sid, pid))

        scored_pairs.sort(key=lambda x: -x[0])

        for score, sid, pid in scored_pairs:
            if sid in used_school or pid in used_portal:
                continue
            used_school.add(sid)
            used_portal.add(pid)
            fuzzy_matched_pairs.append((sid, pid, score))
            if stream_callback:
                stream_callback("fuzzy_match", {
                    "school_id": sid,
                    "portal_id": pid,
                    "school_name": school_by_id[sid]["student_name"],
                    "portal_name": portal_by_id[pid]["student_name"],
                    "score": round(score, 2),
                })

    new_ids -= set(pid for _, pid, _ in fuzzy_matched_pairs)
    missing_ids -= set(sid for sid, _, _ in fuzzy_matched_pairs)

    if ai_service and (new_ids or missing_ids):
        _progress("AI matching remaining unmatched records...")
        unmatched_portal = [portal_by_id[pid] for pid in sorted(new_ids)[:20]]
        unmatched_school = [school_by_id[sid] for sid in sorted(missing_ids)[:20]]

        for pu in unmatched_portal[:5]:
            suggestions = ai_service.suggest_best_match(pu, unmatched_school)
            if suggestions:
                best = suggestions[0]
                if isinstance(best, dict) and best.get("score", 0) >= 0.7:
                    sidx = best.get("candidate_index", -1)
                    if 0 <= sidx < len(unmatched_school):
                        matched_sid = unmatched_school[sidx]["admission_no"]
                        if matched_sid in missing_ids and pu["admission_no"] in new_ids:
                            fuzzy_matched_pairs.append((matched_sid, pu["admission_no"], best["score"]))
                            new_ids.discard(pu["admission_no"])
                            missing_ids.discard(matched_sid)
                            if stream_callback:
                                stream_callback("ai_match", {
                                    "school_id": matched_sid,
                                    "portal_id": pu["admission_no"],
                                    "school_name": unmatched_school[sidx]["student_name"],
                                    "portal_name": pu["student_name"],
                                    "reason": best.get("reason", ""),
                                    "score": best.get("score", 0),
                                })

    compare_fields = _get_compare_fields(school_records, portal_records)

    modifications = []
    modified_admissions: set[str] = set()

    _progress("Comparing matched records...")

    for sid in sorted(exact_matched_ids):
        s = school_by_id[sid]
        p = portal_by_id[sid]
        step += 1

        field_diffs = _compare_fields(s, p, compare_fields, threshold)

        for diff in field_diffs:
            record = {
                "admission_no": sid,
                "field_name": diff["field_name"],
                "old_value": diff["old_value"],
                "new_value": diff["new_value"],
                "student_name": p.get("student_name", ""),
                "difference_type": "modified",
            }
            if ai_service:
                _progress(f"AI analyzing diff: {p.get('student_name', '')} - {diff['field_name']}")
                ai_insight = ai_service.explain_difference(
                    s, p, diff["field_name"], diff["old_value"], diff["new_value"]
                )
                record["ai_insight"] = ai_insight
                if stream_callback:
                    stream_callback("diff_analyzed", {**record, "ai_insight": ai_insight})
            modifications.append(record)
            modified_admissions.add(sid)

        if stream_callback and field_diffs:
            _progress(f"Progress: {step}/{total_steps}")

    for school_id, portal_id, score in fuzzy_matched_pairs:
        s = school_by_id[school_id]
        p = portal_by_id[portal_id]
        step += 1

        field_diffs = _compare_fields(s, p, compare_fields, threshold)

        for diff in field_diffs:
            record = {
                "admission_no": f"{school_id}->{portal_id}",
                "field_name": diff["field_name"],
                "old_value": diff["old_value"],
                "new_value": diff["new_value"],
                "student_name": p.get("student_name", ""),
                "difference_type": "modified",
                "fuzzy_score": round(score, 2),
                "school_id": school_id,
                "portal_id": portal_id,
            }
            if ai_service:
                ai_insight = ai_service.explain_difference(
                    s, p, diff["field_name"], diff["old_value"], diff["new_value"]
                )
                record["ai_insight"] = ai_insight
            modifications.append(record)
            modified_admissions.add(school_id)

        if stream_callback and field_diffs:
            _progress(f"Progress: {step}/{total_steps}")

    new_records = []
    for pid in sorted(new_ids):
        r = dict(portal_by_id[pid])
        r["difference_type"] = "new"
        new_records.append(r)
        if stream_callback:
            stream_callback("new_record", r)

    missing_records = []
    for sid in sorted(missing_ids):
        r = dict(school_by_id[sid])
        r["difference_type"] = "missing"
        missing_records.append(r)
        if stream_callback:
            stream_callback("missing_record", r)

    _progress("Comparison complete!")

    return {
        "matched": len(exact_matched_ids) + len(fuzzy_matched_pairs),
        "missing": len(missing_ids),
        "modified": len(modified_admissions),
        "new": len(new_ids),
        "matched_admissions": list(exact_matched_ids),
        "fuzzy_matched": [
            {"school_id": sid, "portal_id": pid, "score": round(sc, 2)}
            for sid, pid, sc in fuzzy_matched_pairs
        ],
        "modifications": modifications,
        "new_records": new_records,
        "missing_records": missing_records,
    }
