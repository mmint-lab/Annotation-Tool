import React, { useState, useEffect } from "react";
import axios from "axios";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast, ToastContainer } from "../hooks/useToast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { Users, User, Plus, X, Shield, Trash2 } from "lucide-react";

// Admin Management Panel (users)
const AdminPanel = ({ notify = (msg) => window.alert(msg) }) => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [newUser, setNewUser] = useState({ email: "", password: "", full_name: "", role: "annotator" });
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [selectAllUsers, setSelectAllUsers] = useState(false);
  const { toast, showToast, setToast } = useToast();
  const [confirmState, setConfirmState] = useState({ open: false, message: '', resolve: null });
  
  
  const confirmAction = (message) => new Promise((resolve) => { 
    setConfirmState({ open: true, message, resolve }); 
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/admin/users`);
      setUsers([...res.data]); setSelectedUserIds([]); setSelectAllUsers(false); setRefreshKey(Date.now());
    } catch (e) {
      showToast('Error fetching users: ' + (e.response?.data?.detail || 'Please try again.'), 'error');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, []);

  const createUser = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/admin/users`, newUser);
      setNewUser({ email: "", password: "", full_name: "", role: "annotator" });
      setShowCreateUser(false); fetchUsers();
    } catch (e) { showToast('Error creating user: ' + (e.response?.data?.detail || e.message || 'Please try again.'), 'error'); }
    finally { setLoading(false); }
  };

  const toggleUserStatus = async (userId, isActive) => {
    try { await axios.put(`${API}/admin/users/${userId}`, { is_active: !isActive }); fetchUsers(); } catch {}
  };

  const deleteUser = async (userId, userName) => {
    if (userId === currentUser?.id) { showToast('You cannot delete your own account!', 'error'); return; }
    if (!window.confirm(`Delete user "${userName}"?`)) return;
    try {
      setUsers(users.filter(u => u.id !== userId)); setRefreshKey(Date.now()); setDeletingUserId(userId);
      await axios.delete(`${API}/admin/users/${userId}`);
    } catch (e) {
      showToast('User removed from list (API call failed but UI updated)', 'info');
    } finally { setDeletingUserId(null); }
  };

  const toggleSelectAllUsers = () => { if (selectAllUsers) { setSelectedUserIds([]); setSelectAllUsers(false); } else { setSelectedUserIds(users.map(u => u.id)); setSelectAllUsers(true); } };
  const toggleUserChecked = (uid) => { setSelectedUserIds(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]); };
  const bulkDeleteUsers = async () => {
    if (!selectedUserIds.length) return;
    const cleaned = selectedUserIds.filter(id => id !== currentUser?.id);
    const skipped = selectedUserIds.length - cleaned.length;
    const ok = await confirmAction(`Delete ${cleaned.length} users?${skipped > 0 ? ` (Skipped ${skipped} self)` : ''}`);
    if (!ok) return;
    try { await axios.post(`${API}/admin/users/bulk-delete`, { ids: cleaned }); setUsers(prev => prev.filter(u => !cleaned.includes(u.id))); setSelectedUserIds([]); setSelectAllUsers(false); }
    catch (e) { const msg = e.response?.data?.detail || e.message || JSON.stringify(e.response?.data || {}); showToast('Error bulk-deleting users: ' + msg, 'error'); }
  };



  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>User Management ({users.length} users)</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 mr-2">
                <Checkbox id="selectAllUsers" checked={selectAllUsers} onCheckedChange={toggleSelectAllUsers} />
                <Label htmlFor="selectAllUsers">Select all</Label>
                <Button variant="destructive" size="sm" onClick={bulkDeleteUsers} disabled={!selectedUserIds.length}>Delete selected</Button>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setRefreshKey(prev => prev + 1); fetchUsers(); }} disabled={loading}>{loading ? "…" : "Refresh"}</Button>
              <Button onClick={() => setShowCreateUser(true)}><Plus className="h-4 w-4 mr-2" /> Add User</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && users.length === 0 && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                  <div className="flex items-center space-x-3">
                    <div className="h-4 w-4 bg-muted rounded" />
                    <div><div className="h-4 w-24 bg-muted rounded mb-1" /><div className="h-3 w-32 bg-muted rounded" /></div>
                  </div>
                  <div className="h-8 w-20 bg-muted rounded" />
                </div>
              ))}
            </div>
          )}
          <div className="space-y-4" key={refreshKey}>
            {!loading && users.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-10 w-10 text-muted-foreground/60 mx-auto mb-3" />
                <p className="text-muted-foreground">No users yet. Click "Add User" to create one.</p>
              </div>
            )}
            {users.map((u, idx) => (
              <div key={`${u.id}-${refreshKey}-${idx}`} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox checked={selectedUserIds.includes(u.id)} onCheckedChange={() => toggleUserChecked(u.id)} />
                  <div className="flex items-center space-x-2">
                    {u.role === 'admin' && <Shield className="h-4 w-4 text-purple-600" />}
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">{u.full_name}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                      <Badge variant={u.is_active ? 'outline' : 'destructive'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => toggleUserStatus(u.id, u.is_active)} disabled={loading}>{u.is_active ? 'Deactivate' : 'Activate'}</Button>
                  <Button size="sm" variant="destructive" onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteUser(u.id, u.full_name); }} disabled={deletingUserId === u.id}>{deletingUserId === u.id ? "…" : <Trash2 className="h-4 w-4" />}</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <ToastContainer toast={toast} onClose={() => setToast(null)} />
      {/* Confirmation Dialog */}
      <Dialog open={confirmState.open} onOpenChange={(open) => { 
        if (!open && confirmState.resolve) { 
          confirmState.resolve(false); 
          setConfirmState({ open: false, message: '', resolve: null }); 
        } 
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Action</DialogTitle>
            <DialogDescription>{confirmState.message}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 justify-end pt-2">
            <Button variant="outline" onClick={() => { 
              if (confirmState.resolve) confirmState.resolve(false); 
              setConfirmState({ open: false, message: '', resolve: null }); 
            }}>Cancel</Button>
            <Button variant="destructive" onClick={() => { 
              if (confirmState.resolve) confirmState.resolve(true); 
              setConfirmState({ open: false, message: '', resolve: null }); 
            }}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Add User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                value={newUser.email} 
                onChange={(e) => setNewUser({...newUser, email: e.target.value})} 
                placeholder="user@example.com" 
              />
            </div>
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={newUser.full_name} 
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})} 
                placeholder="John Doe" 
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input 
                type="password" 
                value={newUser.password} 
                onChange={(e) => setNewUser({...newUser, password: e.target.value})} 
                placeholder="Enter password" 
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="annotator">Annotator</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowCreateUser(false)} disabled={loading}>Cancel</Button>
              <Button onClick={createUser} disabled={loading}>{loading ? 'Creating...' : 'Create User'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};


export default AdminPanel;
