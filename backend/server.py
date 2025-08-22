@@
-from typing import List, Optional, Dict, Any
+from typing import List, Optional, Dict, Any, Tuple
@@
 class Resource(BaseModel):
@@
     return cleaned_sentences
@@
 @api_router.get("/admin/analytics/users")
 async def get_user_analytics(admin_user: User = Depends(get_admin_user)):
@@
     return user_annotations
@@
 @api_router.get("/admin/download/annotated-csv/{document_id}")
 async def download_annotated_csv(document_id: str, admin_user: User = Depends(get_admin_user)):
@@
     return StreamingResponse(iter([csv_bytes]), media_type="text/csv", headers=headers)
+
+# Bulk admin operations
+class BulkDeleteUsersRequest(BaseModel):
+    user_ids: List[str]
+
+class BulkDeleteDocumentsRequest(BaseModel):
+    document_ids: List[str]
+
+class BulkDeleteAnnotationsRequest(BaseModel):
+    annotation_ids: List[str]
+
+@api_router.post("/admin/users/bulk-delete")
+async def bulk_delete_users(payload: BulkDeleteUsersRequest, admin_user: User = Depends(get_admin_user)):
+    results: Dict[str, str] = {}
+    for uid in payload.user_ids:
+        if uid == admin_user.id:
+            results[uid] = "skipped_self"
+            continue
+        user = await db.users.find_one({"id": uid})
+        if not user:
+            results[uid] = "not_found"
+            continue
+        try:
+            await db.annotations.delete_many({"user_id": uid})
+            del_res = await db.users.delete_one({"id": uid})
+            if del_res.deleted_count:
+                results[uid] = "deleted"
+            else:
+                results[uid] = "not_deleted"
+        except Exception as e:
+            results[uid] = f"error:{str(e)}"
+    return {"results": results}
+
+@api_router.post("/admin/documents/bulk-delete")
+async def bulk_delete_documents(payload: BulkDeleteDocumentsRequest, admin_user: User = Depends(get_admin_user)):
+    results: Dict[str, str] = {}
+    for did in payload.document_ids:
+        doc = await db.documents.find_one({"id": did})
+        if not doc:
+            results[did] = "not_found"
+            continue
+        try:
+            sentence_ids = [s["id"] for s in await db.sentences.find({"document_id": did}, {"id": 1}).to_list(100000)]
+            if sentence_ids:
+                await db.annotations.delete_many({"sentence_id": {"$in": sentence_ids}})
+            await db.sentences.delete_many({"document_id": did})
+            del_res = await db.documents.delete_one({"id": did})
+            if del_res.deleted_count:
+                results[did] = "deleted"
+            else:
+                results[did] = "not_deleted"
+        except Exception as e:
+            results[did] = f"error:{str(e)}"
+    return {"results": results}
+
+@api_router.post("/annotations/bulk-delete")
+async def bulk_delete_annotations(payload: BulkDeleteAnnotationsRequest, current_user: User = Depends(get_current_user)):
+    results: Dict[str, str] = {}
+    # Fetch annotations for permissions check
+    anns = await db.annotations.find({"id": {"$in": payload.annotation_ids}}, {"_id": 0}).to_list(100000)
+    anns_by_id = {a["id"]: a for a in anns}
+    to_delete: List[str] = []
+    for aid in payload.annotation_ids:
+        a = anns_by_id.get(aid)
+        if not a:
+            results[aid] = "not_found"
+            continue
+        if current_user.role == UserRole.ADMIN or a.get("user_id") == current_user.id:
+            to_delete.append(aid)
+        else:
+            results[aid] = "forbidden"
+    if to_delete:
+        del_res = await db.annotations.delete_many({"id": {"$in": to_delete}})
+        # Mark those successfully deleted
+        for aid in to_delete:
+            results[aid] = "deleted"
+    return {"results": results}
+
+# List annotations by document (for document-level manager)
+@api_router.get("/documents/{document_id}/annotations")
+async def list_document_annotations(document_id: str, current_user: User = Depends(get_current_user)):
+    # Anyone logged in can view list for management UIs; deletion still RBAC-controlled
+    sentence_ids = [s["id"] for s in await db.sentences.find({"document_id": document_id}, {"id": 1}).to_list(100000)]
+    if not sentence_ids:
+        return []
+    anns = await db.annotations.find({"sentence_id": {"$in": sentence_ids}}, {"_id": 0}).to_list(100000)
+    return anns
@@
 @api_router.get("/")
 async def root():
     return {"message": "Social Determinants of Health Annotation API"}
@@
 logger = logging.getLogger(__name__)
@@
 async def shutdown_db_client():
     client.close()