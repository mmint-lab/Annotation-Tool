import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast, ToastContainer } from "../hooks/useToast";
import { downloadBlob } from "../utils/download";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Textarea } from "./ui/textarea";
import { Progress } from "./ui/progress";
import { Checkbox } from "./ui/checkbox";
import { Separator } from "./ui/separator";
import { CheckCircle, Plus, Minus, X, SkipForward, Trash2, Download, Search, ChevronLeft, ChevronRight, Eye, Keyboard } from "lucide-react";

// Structured Annotation Interface
const AnnotationInterface = ({ sentences, currentIndex, onIndexChange, tagStructure, onAnnotate, onDeleteAnnotation, onBulkDeleteAnnotations, currentDocName, documentId, confirmAction, onClearAllAnnotations }) => {
  const { user } = useAuth();
  const [selectedTags, setSelectedTags] = useState([]);
  const [notes, setNotes] = useState("");
  const [selectedAnnIds, setSelectedAnnIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const { toast, showToast, setToast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [showContext, setShowContext] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const searchSentences = (query) => {
    if (!query.trim()) { setSearchResults(null); return; }
    const q = query.toLowerCase();
    const results = sentences.map((s, i) => ({ index: i, text: s.text })).filter(s => s.text.toLowerCase().includes(q));
    setSearchResults(results);
  };

  const contextSentences = React.useMemo(() => {
    if (!showContext || !sentences[currentIndex]) return [];
    const start = Math.max(0, currentIndex - 2);
    const end = Math.min(sentences.length - 1, currentIndex + 2);
    const ctx = [];
    for (let i = start; i <= end; i++) {
      if (i !== currentIndex) ctx.push({ index: i, text: sentences[i].text });
    }
    return ctx;
  }, [showContext, currentIndex, sentences]);

  // Activity tracking helper
  const logActivity = async (actionType, metadata = {}) => {
    try {
      const currentSentence = sentences[currentIndex];
      await axios.post(`${API}/activities`, {
        document_id: documentId,
        sentence_id: currentSentence?.id || null,
        action_type: actionType,
        metadata: metadata
      });
    } catch (e) {
      // Silent fail - don't interrupt user flow
      console.error('Failed to log activity:', e);
    }
  };

  // Log page navigation when document is first opened
  useEffect(() => {
    if (documentId) {
      logActivity('page_navigation', { document_name: currentDocName });
    }
  }, [documentId]);

  // Log sentence transitions
  useEffect(() => {
    if (currentIndex >= 0 && sentences[currentIndex]) {
      logActivity('sentence_transition', { 
        sentence_index: currentIndex,
        sentence_id: sentences[currentIndex].id
      });
    }
  }, [currentIndex]);

  // Quick shortcuts: flatten first 9 tags for 1-9 keyboard mapping
  const quickTags = React.useMemo(() => {
    const arr = [];
    Object.entries(tagStructure || {}).forEach(([domain, cats]) => {
      Object.entries(cats || {}).forEach(([category, tags]) => {
        (tags || []).forEach((tag) => arr.push({ domain, category, tag }));
      });
    });
    return arr.slice(0, 9);
  }, [tagStructure]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      const ae = document.activeElement;
      const isTyping = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.getAttribute('contenteditable') === 'true');
      if (isTyping) return;
      if (e.key === 'Enter') {
        if (selectedTags.length > 0) handleSaveAnnotation();
      } else if (e.key.toLowerCase() === 's') {
        handleSkip();
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) { setSelectedTags([]); setNotes(""); onIndexChange(currentIndex - 1); }
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < sentences.length - 1) { setSelectedTags([]); setNotes(""); onIndexChange(currentIndex + 1); }
      } else if (e.key.toLowerCase() === 'c') {
        setSelectedTags([]);
      } else if (e.key.toLowerCase() === 'p') {
        if (selectedTags.length) {
          setSelectedTags(prev => prev.map((t, i) => i === prev.length - 1 ? { ...t, valence: 'positive' } : t));
        }
      } else if (e.key.toLowerCase() === 'n') {
        if (selectedTags.length) {
          setSelectedTags(prev => prev.map((t, i) => i === prev.length - 1 ? { ...t, valence: 'negative' } : t));
        }
      } else if (/^[1-9]$/.test(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        const qt = quickTags[idx];
        if (qt) toggleTag(qt.domain, qt.category, qt.tag);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedTags, currentIndex, sentences.length, quickTags]);

  const currentSentence = sentences[currentIndex];
  const currentSubject = currentSentence?.subject_id || null;

  useEffect(() => {
    setSelectedTags([]); setNotes(""); setSelectedAnnIds([]); setSelectAll(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentIndex]);

  if (!currentSentence) return null;

  const toggleTag = (domain, category, tag) => {
    const exists = selectedTags.some(t => t.domain === domain && t.category === category && t.tag === tag);
    if (exists) {
      setSelectedTags(prev => prev.filter(t => !(t.domain === domain && t.category === category && t.tag === tag)));
    } else {
      const newTag = { domain, category, tag, valence: "positive" };
      setSelectedTags(prev => [...prev, newTag]);
    }
  };

  const removeTag = (index) => { const n = [...selectedTags]; n.splice(index, 1); setSelectedTags(n); };

  const updateTagConfidence = (index, newConfidence) => {
    setSelectedTags(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], confidence: newConfidence };
      return updated;
    });
  };
  const updateTagValence = (index, valence) => { const n = [...selectedTags]; n[index].valence = valence; setSelectedTags(n); };
  const selectTagWithValence = (domain, category, tag, valence) => {
    // Log tag click activity
    logActivity('tag_click', { 
      domain, 
      category, 
      tag, 
      valence,
      action: 'add'  // Will be 'remove' if clicking same valence again
    });
    
    setSelectedTags(prev => {
      const idx = prev.findIndex(t => t.domain === domain && t.category === category && t.tag === tag);
      if (idx >= 0) {
        // if same valence clicked again, remove; otherwise update valence
        if (prev[idx].valence === valence) {
          const cp = [...prev]; cp.splice(idx, 1); return cp;
        } else {
          const cp = [...prev]; cp[idx] = { ...cp[idx], valence }; return cp;
        }
      } else {
        return [...prev, { domain, category, tag, valence, confidence: 3 }];
      }
    });
  };

  const handleSaveAnnotation = async () => {
    if (selectedTags.length === 0) return;
    await onAnnotate(currentSentence.id, selectedTags, notes, false);
    setSelectedTags([]); setNotes("");
    showToast('Annotation saved', 'success');
  };

  const saveAndMove = async (dir) => {
    if (selectedTags.length === 0) return;
    await onAnnotate(currentSentence.id, selectedTags, notes, false);
    setSelectedTags([]); setNotes("");
    if (dir === 'prev' && currentIndex > 0) onIndexChange(currentIndex - 1);
    if (dir === 'next' && currentIndex < sentences.length - 1) onIndexChange(currentIndex + 1);
  };

  const handleSkip = async () => {
    await onAnnotate(currentSentence.id, [], notes, true);
    setSelectedTags([]); setNotes("");
    showToast('Marked as skipped', 'info');
    if (currentIndex < sentences.length - 1) onIndexChange(currentIndex + 1);
    else showToast('Annotation complete for this document.', 'info');
  };

  const toggleSelectAllAnns = () => {
    if (selectAll) { setSelectedAnnIds([]); setSelectAll(false); }
    else { setSelectedAnnIds((currentSentence.annotations || []).map(a => a.id)); setSelectAll(true); }
  };

  const toggleAnn = (id) => { setSelectedAnnIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]); };
  const deleteSelectedAnns = () => { if (selectedAnnIds.length) onBulkDeleteAnnotations(selectedAnnIds, currentSentence.id); };

  const isSelectedTag = (domain, category, tag) => selectedTags.some(t => t.domain === domain && t.category === category && t.tag === tag);
  const getTagValence = (domain, category, tag) => {
    const found = selectedTags.find(t => t.domain === domain && t.category === category && t.tag === tag);
    return found ? found.valence : null;
  };

  // Calculate progress based on sentences annotated by current user
  const annotatedSentences = sentences.filter(s => 
    s.annotations && s.annotations.some(a => a.user_id === user?.id)
  ).length;
  const totalSentences = sentences.length;
  const annotationProgress = totalSentences > 0 ? (annotatedSentences / totalSentences) * 100 : 0;
  const isDocumentComplete = annotatedSentences === totalSentences && totalSentences > 0;
  const progress = ((currentIndex + 1) / sentences.length) * 100;

  return (
    <div className="space-y-6">
      <ToastContainer toast={toast} onClose={() => setToast(null)} />
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Annotating: {currentDocName || ""}</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{currentIndex + 1} of {sentences.length}</Badge>
              <Button 
                size="sm" 
                variant="outline"
                onClick={async () => {
                  try {
                    const url = `${API}/download/my-annotations-csv/${documentId}`;
                    const token = localStorage.getItem('token');
                    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
                    const blob = await res.blob();
                    const a = document.createElement('a');
                    const u = window.URL.createObjectURL(blob);
                    a.href = u;
                    a.setAttribute('download', `my_annotations_${currentDocName || 'export'}.csv`);
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(u);
                    showToast('My annotations CSV downloaded', 'success');
                  } catch (e) {
                    showToast('Error downloading CSV: ' + (e.message || 'Please try again.'), 'error');
                  }
                }}
              >
                <Download className="h-4 w-4 mr-1" /> My CSV
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={async () => {
                  try {
                    const url = `${API}/download/my-annotated-paragraphs/${documentId}`;
                    const token = localStorage.getItem('token');
                    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) throw new Error(await res.text() || `HTTP ${res.status}`);
                    const blob = await res.blob();
                    const a = document.createElement('a');
                    const u = window.URL.createObjectURL(blob);
                    a.href = u;
                    a.setAttribute('download', `my_paragraphs_${currentDocName || 'export'}.csv`);
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    window.URL.revokeObjectURL(u);
                    showToast('My paragraphs CSV downloaded', 'success');
                  } catch (e) {
                    showToast('Error downloading paragraphs: ' + (e.message || 'Please try again.'), 'error');
                  }
                }}
              >
                <Download className="h-4 w-4 mr-1" /> My Paragraphs
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Subject: {currentSubject || "N/A"}</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                if (!currentSubject) return;
                for (let i = currentIndex - 1; i >= 0; i--) {
                  if (sentences[i]?.subject_id && sentences[i].subject_id !== currentSubject) { onIndexChange(i); return; }
                }
              }} disabled={!currentSubject}>Prev Subject</Button>
              <Button size="sm" variant="outline" onClick={() => {
                if (!currentSubject) return;
                for (let i = currentIndex + 1; i < sentences.length; i++) {
                  if (sentences[i]?.subject_id && sentences[i].subject_id !== currentSubject) { onIndexChange(i); return; }
                }
              }} disabled={!currentSubject}>Next Subject</Button>
          </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 space-y-1">
              <Progress value={annotationProgress} className="w-full" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Annotated: {annotatedSentences}/{totalSentences}</span>
                <span>Viewing: {currentIndex + 1}/{totalSentences}</span>
              </div>
            </div>
            {isDocumentComplete && (
              <Badge className="bg-green-600 text-white whitespace-nowrap">
                <CheckCircle className="h-3 w-3 mr-1" /> Complete
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search & Tools Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search sentences..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); searchSentences(e.target.value); }}
                className="pl-9"
                aria-label="Search sentences"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowContext(!showContext)} title="Show surrounding sentences">
              <Eye className="h-4 w-4 mr-1" /> Context
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowShortcuts(!showShortcuts)} title="Keyboard shortcuts">
              <Keyboard className="h-4 w-4 mr-1" /> Shortcuts
            </Button>
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="max-h-40 overflow-auto border rounded-md p-2 space-y-1 bg-card">
              <div className="text-xs text-muted-foreground mb-1">{searchResults.length} matches</div>
              {searchResults.slice(0, 20).map((r) => (
                <button key={r.index} className="w-full text-left text-sm p-1.5 rounded hover:bg-muted truncate" onClick={() => { onIndexChange(r.index); setSearchQuery(""); setSearchResults(null); }}>
                  <span className="text-muted-foreground mr-1">#{r.index + 1}</span> {r.text}
                </button>
              ))}
              {searchResults.length > 20 && <div className="text-xs text-muted-foreground">...and {searchResults.length - 20} more</div>}
            </div>
          )}

          {/* Keyboard Shortcuts Panel */}
          {showShortcuts && (
            <div className="p-3 bg-muted/50 rounded-lg border text-sm space-y-1">
              <div className="font-medium mb-2">Keyboard Shortcuts</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                <div><kbd className="px-1.5 py-0.5 bg-card rounded text-xs font-mono border">Enter</kbd> Save annotation</div>
                <div><kbd className="px-1.5 py-0.5 bg-card rounded text-xs font-mono border">S</kbd> Skip sentence</div>
                <div><kbd className="px-1.5 py-0.5 bg-card rounded text-xs font-mono border">C</kbd> Clear all tags</div>
                <div><kbd className="px-1.5 py-0.5 bg-card rounded text-xs font-mono border">&larr;</kbd> Previous sentence</div>
                <div><kbd className="px-1.5 py-0.5 bg-card rounded text-xs font-mono border">&rarr;</kbd> Next sentence</div>
                <div><kbd className="px-1.5 py-0.5 bg-card rounded text-xs font-mono border">P</kbd> Set last tag positive</div>
                <div><kbd className="px-1.5 py-0.5 bg-card rounded text-xs font-mono border">N</kbd> Set last tag negative</div>
                <div><kbd className="px-1.5 py-0.5 bg-card rounded text-xs font-mono border">1-9</kbd> Quick-add tags</div>
              </div>
            </div>
          )}

          {/* Context Preview */}
          {showContext && contextSentences.length > 0 && (
            <div className="space-y-1">
              {contextSentences.filter(c => c.index < currentIndex).map((c) => (
                <div key={c.index} className="p-2 text-sm text-muted-foreground bg-muted/30 rounded cursor-pointer hover:bg-muted/50" onClick={() => onIndexChange(c.index)}>
                  <span className="text-xs opacity-50 mr-1">#{c.index + 1}</span> {c.text}
                </div>
              ))}
            </div>
          )}

          {/* Current Sentence */}
          <div className="sticky top-4 z-10 p-5 rounded-xl bg-card border shadow-lg dark:shadow-black/20 backdrop-blur-sm ring-1 ring-border/50">
            <div className="flex items-start gap-3">
              <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 shrink-0 animate-pulse" />
              <p className="text-lg leading-relaxed">{currentSentence.text}</p>
            </div>
          </div>

          {/* Context Preview (after) */}
          {showContext && contextSentences.length > 0 && (
            <div className="space-y-1">
              {contextSentences.filter(c => c.index > currentIndex).map((c) => (
                <div key={c.index} className="p-2 text-sm text-muted-foreground bg-muted/30 rounded cursor-pointer hover:bg-muted/50" onClick={() => onIndexChange(c.index)}>
                  <span className="text-xs opacity-50 mr-1">#{c.index + 1}</span> {c.text}
                </div>
              ))}
            </div>
          )}

          {currentSentence.annotations && currentSentence.annotations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">Existing Annotations</h4>
                <div className="flex items-center gap-2">
                  <Checkbox id="selectAllSentenceAnns" checked={selectAll} onCheckedChange={toggleSelectAllAnns} />
                  <Label htmlFor="selectAllSentenceAnns">Select all</Label>
                  <Button variant="destructive" size="sm" disabled={selectedAnnIds.length === 0} onClick={deleteSelectedAnns}>Delete selected</Button>
                </div>
              </div>
              <div className="space-y-2">
                {currentSentence.annotations.map((annotation) => {
                  const canDelete = user?.role === 'admin' || annotation.user_id === user?.id;
                  const deleteOneTag = async (annId, t) => {
                    try {
                      const res = await axios.post(`${API}/annotations/${annId}/remove-tag`, { domain: t.domain, category: t.category, tag: t.tag });
                      if (res?.data?.id) await refreshSentenceAnnotations(annotation.sentence_id);
                      else await refreshSentenceAnnotations(annotation.sentence_id);
                    } catch (e) { showToast('Error removing tag: ' + (e.response?.data?.detail || 'Please try again.'), 'error'); }
                  };
                  return (
                    <div key={annotation.id} className="p-3 bg-muted/50 border rounded-md">
                      {annotation.skipped ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Checkbox checked={selectedAnnIds.includes(annotation.id)} onCheckedChange={() => toggleAnn(annotation.id)} />
                            <SkipForward className="h-4 w-4 text-orange-500" />
                            <span className="text-sm text-muted-foreground">Skipped by {annotation.user_name || 'Unknown'}</span>
                          </div>
                          {canDelete && (
                            <button type="button" onClick={() => onDeleteAnnotation(annotation.id, currentSentence.id)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <Checkbox checked={selectedAnnIds.includes(annotation.id)} onCheckedChange={() => toggleAnn(annotation.id)} />
                              <span className="text-sm text-muted-foreground">by {annotation.user_name || 'Unknown'}</span>
                            </div>
                            {canDelete && (
                              <button type="button" onClick={() => onDeleteAnnotation(annotation.id, currentSentence.id)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {(annotation.tags || []).map((tag, tagIdx) => (
                              <span key={tagIdx} className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border ${tag.valence === 'positive' ? 'bg-green-600/20 text-green-600 dark:text-green-400 border-green-600/30' : 'bg-red-600/20 text-red-600 dark:text-red-400 border-red-600/30'}`}>
                                {tag.domain}: {tag.tag} ({tag.valence === 'positive' ? '+' : '-'})
                                {tag.confidence && <span className="ml-1 opacity-75">conf: {tag.confidence}/5</span>}
                                {canDelete && (
                                  <button type="button" className="ml-1 opacity-70 hover:opacity-100" onClick={() => deleteOneTag(annotation.id, tag)} title="Remove this tag">×</button>
                                )}
                              </span>
                            ))}
                          </div>
                          {annotation.notes && (<p className="text-sm text-muted-foreground">Notes: {annotation.notes}</p>)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedTags.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">Selected Tags</h4>
                <Button size="sm" variant="outline" onClick={() => setSelectedTags([])}>Clear all (C)</Button>
              </div>
              <div className="space-y-2">
                {selectedTags.map((tag, index) => (
                  <div key={index} className={`p-3 rounded-lg border transition-colors ${tag.valence === 'positive' ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-1 rounded font-medium ${tag.valence === 'positive' ? 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300'}`}>
                          {tag.valence === 'positive' ? '+' : '-'}
                        </span>
                        <span className="text-sm font-medium text-foreground">{tag.domain}: {tag.category} - {tag.tag}</span>
                      </div>
                      <Button size="sm" variant="ghost" onClick={() => removeTag(index)} className="h-8 w-8 p-0 hover:bg-muted" title="Remove tag">
                        <X className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                    <div className="space-y-1 pl-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground min-w-[80px]">Confidence:</span>
                        <div className="flex-1 relative">
                          {/* Background track */}
                          <div className="h-1 bg-muted rounded-full absolute top-1/2 left-0 right-0 -translate-y-1/2" />
                          {/* Filled track up to current value */}
                          <div 
                            className="h-1 bg-blue-500 rounded-full absolute top-1/2 left-0 -translate-y-1/2"
                            style={{ width: `${((tag.confidence || 3) - 1) / 4 * 100}%` }}
                          />
                          {/* Clickable circles at each position */}
                          <div className="flex justify-between items-center relative h-6">
                            {[1, 2, 3, 4, 5].map((level) => (
                              <button
                                key={level}
                                type="button"
                                onClick={() => updateTagConfidence(index, level)}
                                className={`w-4 h-4 rounded-full border-2 transition-all hover:scale-125 ${
                                  (tag.confidence || 3) === level 
                                    ? 'bg-blue-600 border-blue-600' 
                                    : 'bg-card border-border hover:border-primary'
                                }`}
                                title={`Set confidence to ${level}`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm font-bold text-blue-600 min-w-[20px]">{tag.confidence || 3}</span>
                      </div>
                      <div className="flex items-center gap-2 pl-[80px]">
                        <span className="text-xs text-muted-foreground flex-1">Least confident</span>
                        <span className="text-xs text-muted-foreground flex-1 text-right">Most confident</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-foreground">Add Tags:</h4>
              <div className="text-xs text-muted-foreground">
                Shortcuts: Enter save • S skip • [/] prev/next • C clear all
              </div>
            </div>
            {Object.entries(tagStructure).map(([domain, categories]) => (
              <div key={domain} className="space-y-2">
                <h5 className="text-sm font-medium text-blue-600 dark:text-blue-400">{domain}</h5>
                <div className="grid gap-2">
                  {Object.entries(categories).map(([category, tags]) => (
                    <div key={category} className="space-y-1">
                      <h6 className="text-xs font-medium text-muted-foreground">{category}</h6>
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => {
                          const valence = getTagValence(domain, category, tag);
                          const isPositive = valence === 'positive';
                          const isNegative = valence === 'negative';
                          const baseClasses = isPositive ? 'bg-green-600 text-white hover:bg-green-700 border-green-600' : 
                                             isNegative ? 'bg-red-600 text-white hover:bg-red-700 border-red-600' : 
                                             'bg-card text-foreground hover:bg-muted border-border';
                          return (
                            <div key={tag} className={`inline-flex rounded border ${baseClasses}`}>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => selectTagWithValence(domain, category, tag, 'positive')} 
                                className={`text-xs h-6 px-2 rounded-r-none hover:bg-transparent ${isPositive ? 'text-white' : isNegative ? 'text-white' : 'text-foreground'}`}
                              >
                                <Plus className="h-3 w-3 mr-1" /> {tag}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => selectTagWithValence(domain, category, tag, 'negative')} 
                                className={`text-xs h-6 px-2 rounded-l-none hover:bg-transparent border-l-0 ${isPositive ? 'text-white' : isNegative ? 'text-white' : 'text-foreground'}`}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <Separator />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional context or observations..." rows={3} />
          </div>

          <div className="flex flex-wrap gap-2 items-center" role="toolbar" aria-label="Annotation actions">
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <Button onClick={handleSaveAnnotation} disabled={selectedTags.length === 0} className="bg-green-600 hover:bg-green-700 rounded-r-none" aria-label="Save annotation">
                <CheckCircle className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Save</span>
              </Button>
              <Button onClick={() => saveAndMove('prev')} disabled={selectedTags.length === 0 || currentIndex === 0} className="rounded-none border-l-0 hidden sm:inline-flex">Save + Prev</Button>
              <Button onClick={() => saveAndMove('next')} disabled={selectedTags.length === 0 || currentIndex === sentences.length - 1} className="rounded-l-none border-l-0">
                <span className="hidden sm:inline">Save + Next</span><span className="sm:hidden">Save &rarr;</span>
              </Button>
            </div>
            <Button onClick={handleSkip} variant="outline" className="border-orange-300 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950" aria-label="Skip sentence">
              <SkipForward className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Skip - No SDOH Content</span><span className="sm:hidden">Skip</span>
            </Button>
            <Button variant="outline" onClick={() => { setSelectedTags([]); setNotes(""); onIndexChange(Math.max(0, currentIndex - 1)); }} disabled={currentIndex === 0} aria-label="Previous sentence">
              <ChevronLeft className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Previous</span>
            </Button>
            <Button variant="outline" onClick={() => { setSelectedTags([]); setNotes(""); onIndexChange(Math.min(sentences.length - 1, currentIndex + 1)); }} disabled={currentIndex === sentences.length - 1} aria-label="Next sentence">
              <span className="hidden sm:inline">Next</span><ChevronRight className="h-4 w-4 sm:ml-1" />
            </Button>
          </div>
          
          {/* Navigation and Clear Actions */}
          <div className="flex flex-wrap gap-2 items-center pt-3 mt-3 border-t border-border">
            <span className="text-sm text-muted-foreground mr-2">Jump to:</span>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => { setSelectedTags([]); setNotes(""); onIndexChange(0); }}
              disabled={currentIndex === 0}
            >
              First Sentence
            </Button>
            {currentSubject && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const firstOfSubject = sentences.findIndex(s => s.subject_id === currentSubject);
                  if (firstOfSubject >= 0) {
                    setSelectedTags([]); 
                    setNotes(""); 
                    onIndexChange(firstOfSubject);
                  }
                }}
                disabled={sentences.findIndex(s => s.subject_id === currentSubject) === currentIndex}
              >
                First of Subject
              </Button>
            )}
            <div className="ml-auto">
              <Button 
                variant="destructive" 
                size="sm"
                onClick={async () => {
                  const totalAnnotations = sentences.reduce((acc, s) => acc + (s.annotations?.length || 0), 0);
                  if (totalAnnotations === 0) {
                    return;
                  }
                  if (confirmAction) {
                    const ok = await confirmAction(`Are you sure you want to delete ALL ${totalAnnotations} annotations for this document? This action cannot be undone.`);
                    if (ok && onClearAllAnnotations) {
                      await onClearAllAnnotations(documentId);
                    }
                  } else if (window.confirm(`Are you sure you want to delete ALL ${totalAnnotations} annotations for this document? This action cannot be undone.`)) {
                    if (onClearAllAnnotations) {
                      await onClearAllAnnotations(documentId);
                    }
                  }
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" /> Clear All Annotations
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnotationInterface;
