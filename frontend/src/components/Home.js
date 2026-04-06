import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { FileText, Tag, Settings } from "lucide-react";

// Home
const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${API}/analytics/overview`);
        setStats(res.data);
      } catch {}
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome back, {user?.full_name || 'Annotator'}</CardTitle>
          <p className="text-muted-foreground text-sm">Social Determinants of Health Annotation Tool</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-2xl font-bold">{stats.total_documents || 0}</div>
                <div className="text-sm text-muted-foreground">Documents</div>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-2xl font-bold">{stats.total_sentences || 0}</div>
                <div className="text-sm text-muted-foreground">Sentences</div>
              </div>
              <div className="p-4 rounded-lg border bg-card">
                <div className="text-2xl font-bold">{stats.total_annotations || 0}</div>
                <div className="text-sm text-muted-foreground">Annotations</div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => navigate('/dashboard#documents')}>
              <FileText className="h-5 w-5" />
              <span>Documents</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => navigate('/dashboard#annotate')}>
              <Tag className="h-5 w-5" />
              <span>Annotate</span>
            </Button>
            <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => navigate('/dashboard#resources')}>
              <FileText className="h-5 w-5" />
              <span>Resources</span>
            </Button>
            {user?.role === 'admin' && (
              <Button variant="outline" className="h-20 flex flex-col gap-1" onClick={() => navigate('/dashboard#admin')}>
                <Settings className="h-5 w-5" />
                <span>Admin</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Quick Start</CardTitle></CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Go to <strong className="text-foreground">Documents</strong> tab and select a document to annotate</li>
            <li>Read each sentence and tag relevant SDOH domains using <strong className="text-foreground">+</strong> (present) or <strong className="text-foreground">-</strong> (absent)</li>
            <li>Set your confidence level (1-5) for each tag, then <strong className="text-foreground">Save</strong></li>
            <li>Use keyboard shortcuts: <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> save, <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">S</kbd> skip, <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Arrow keys</kbd> navigate</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
};

export default Home;
