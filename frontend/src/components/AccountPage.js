import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "../api";
import { useAuth } from "../context/AuthContext";
import { useToast, ToastContainer } from "../hooks/useToast";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Sun, Moon } from "lucide-react";

const AccountPage = () => {
  const { user, setUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast, showToast, setToast } = useToast(3000);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const navigate = useNavigate();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);
  }, [theme]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`${API}/auth/me/profile`, { full_name: fullName });
      if (res?.data) setUser(res.data);
      showToast("Profile updated", "success");
    } catch (e) {
      showToast(e.response?.data?.detail || "Error updating profile", "error");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) { showToast("New passwords do not match", "error"); return; }
    setSaving(true);
    try {
      await axios.post(`${API}/auth/change-password`, { current_password: currentPassword, new_password: newPassword });
      showToast("Password changed", "success");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e) {
      showToast(e.response?.data?.detail || "Error changing password", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <ToastContainer toast={toast} onClose={() => setToast(null)} />
      <Card>
        <CardHeader><CardTitle>My Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={saveProfile} disabled={saving}>Save Profile</Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>Back</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} /></div>
          <div className="space-y-2"><Label>New Password</Label><Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} /></div>
          <div className="space-y-2"><Label>Confirm New Password</Label><Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} /></div>
          <div><Button onClick={changePassword} disabled={saving}>Change Password</Button></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <p className="text-sm text-muted-foreground">Select your preferred color scheme</p>
          </div>
          <div className="flex gap-3">
            {[{ key: "light", Icon: Sun, label: "Light" }, { key: "dark", Icon: Moon, label: "Dark" }].map(({ key, Icon, label }) => (
              <button key={key} onClick={() => setTheme(key)} className={`flex-1 p-4 rounded-lg border-2 transition-all ${theme === key ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}>
                <div className="flex flex-col items-center gap-2"><Icon className="h-6 w-6" /><span className="font-medium">{label}</span></div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountPage;
