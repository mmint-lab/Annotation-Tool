import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../api";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

const AssignedDocsPanel = ({ onOpenDoc }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    (async () => {
      try { setLoading(true); const res = await axios.get(`${API}/documents/assigned-to-me`); setItems(res.data || []); } catch {} finally { setLoading(false); }
    })();
  }, []);

  if (!items.length && !loading) return null;

  return (
    <Card>
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{isExpanded ? "▼" : "▶"}</span>
          <CardTitle>Documents Assigned to Me</CardTitle>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="p-3 border rounded-md animate-pulse">
                  <div className="flex items-center justify-between">
                    <div><div className="h-4 w-32 bg-muted rounded mb-1" /><div className="h-3 w-20 bg-muted rounded" /></div>
                    <div className="h-2 w-48 bg-muted rounded" />
                    <div className="h-8 w-20 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it) => (
                <div key={it.document_id} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{it.filename}</div>
                      <div className="text-xs text-muted-foreground">{it.annotated_count}/{it.total_sentences} sentences annotated</div>
                    </div>
                    <div className="w-48">
                      <div className="h-2 bg-muted rounded"><div className={`h-2 rounded ${it.progress >= 1 ? "bg-green-500" : "bg-blue-600"}`} style={{ width: `${Math.round(it.progress * 100)}%` }} /></div>
                      <div className="text-xs text-muted-foreground text-right mt-1">{Math.round(it.progress * 100)}%</div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => onOpenDoc(it.document_id)}>{it.progress >= 1 ? "Review" : "Annotate"}</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default AssignedDocsPanel;
