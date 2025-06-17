import React, { useState } from "react";
import {
  signOut,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth } from "./firebase";
import "./UserMenu.css";

export default function UserMenu({ user }) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const reauthenticate = async (oldPass) => {
    if (!user || !user.email) throw new Error("User not logged in");
    const cred = EmailAuthProvider.credential(user.email, oldPass);
    await reauthenticateWithCredential(user, cred);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      alert("Please fill both old and new password");
      return;
    }
    setChangingPassword(true);
    try {
      await reauthenticate(oldPassword);
      await updatePassword(user, newPassword);
      alert("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      setShowUserMenu(false);
    } catch (e) {
      alert("Error changing password: " + e.message);
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="user-info">
      <button
        className="user-btn"
        onClick={() => setShowUserMenu((prev) => !prev)}
        aria-haspopup="true"
        aria-expanded={showUserMenu}
        aria-label="User menu"
      >
        <span className="user-avatar">
          {user.email ? user.email.charAt(0).toUpperCase() : "U"}
        </span>
        {/* Email text hidden on button */}
        <span className="user-email-text">{user.email}</span>
      </button>

      {showUserMenu && (
        <div className="user-menu" role="menu">
          <div className="user-details">
            <strong>{user.email}</strong>
            <div className="email">Signed in as</div>
          </div>

          <div className="change-password-form">
            <h4>Change Password</h4>

            <div className="input-group">
              <input
                id="oldPassword"
                type="password"
                placeholder=" "
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={changingPassword}
                required
              />
              <label htmlFor="oldPassword">Current password</label>
            </div>

            <div className="input-group">
              <input
                id="newPassword"
                type="password"
                placeholder=" "
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={changingPassword}
                required
              />
              <label htmlFor="newPassword">New password</label>
            </div>

            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="change-password-btn"
            >
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>

          <hr />

          <button onClick={() => signOut(auth)} className="logout-btn">
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
