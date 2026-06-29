import UniversalHead from "@components/misc/UniversalHead.jsx";
import NavBar from "@/src/components/layout/Navbar/NavBar.jsx";
import Footer from "@/src/components/layout/Footer/Footer.jsx";
import StripedList from "@/src/components/ui/StripedList/StripedList.jsx";
import { useEffect, useState } from "react";
import styles from "@/src/styles/services.module.scss";
import { mainDivClass } from "@styles/global.bootstrap.js";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });

  const readErrorMessage = async (res, fallback) => {
    const data = await res.json().catch(() => ({}));
    return data.message || data.error || fallback;
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/users", { credentials: "include" });

      if (!res.ok) {
        const msg = await readErrorMessage(res, "Błąd pobierania użytkowników");
        setError(msg);
        setUsers([]);
        return;
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
      setMessage("");
    } catch (err) {
      console.error("Failed to fetch users", err);
      setError("Błąd pobierania użytkowników");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      if (res.ok) {
        setMessage("Użytkownik utworzony!");
        setNewUser({ username: "", password: "" });
        fetchUsers();
      } else {
        setError(await readErrorMessage(res, "Nie udało się utworzyć użytkownika"));
      }
    } catch {
      setError("Błąd połączenia");
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!confirm(`Czy na pewno chcesz usunąć użytkownika ${username}?`)) return;

    setMessage("");
    setError("");

    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        setMessage(`Użytkownik ${username} został usunięty.`);
        fetchUsers();
      } else {
        setError(await readErrorMessage(res, "Nie udało się usunąć użytkownika"));
      }
    } catch {
      setError("Błąd połączenia");
    }
  };

  const openPasswordEditor = (userId) => {
    setEditingUserId(userId);
    setPasswordForm({ currentPassword: "", password: "", confirmPassword: "" });
    setMessage("");
    setError("");
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!editingUserId) {
      setError("Nie wybrano użytkownika");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUserId,
          currentPassword: passwordForm.currentPassword,
          password: passwordForm.password,
          confirmPassword: passwordForm.confirmPassword,
        }),
      });

      if (res.ok) {
        setMessage("Hasło zostało zmienione!");
        setEditingUserId(null);
        setPasswordForm({ currentPassword: "", password: "", confirmPassword: "" });
      } else {
        setError(await readErrorMessage(res, "Nie udało się zmienić hasła"));
      }
    } catch {
      setError("Błąd połączenia");
    }
  };

  return (
    <>
      <UniversalHead />
      <div className={`${styles.bgImgServices} ${mainDivClass}`}>
        <NavBar />
        <div className="container mt-5" style={{ maxWidth: "800px", color: "white" }}>
          <h2>Zarządzanie użytkownikami</h2>

          {(message || error) && (
            <div className={`alert ${error ? "alert-danger" : "alert-success"}`}>
              {error || message}
            </div>
          )}

          {editingUserId ? (
            <div className="card bg-dark text-white mb-4 p-3 border-secondary">
              <h4>Zmień hasło użytkownika</h4>
              <form onSubmit={handlePasswordChange}>
                <div className="mb-3">
                  <label className="form-label">Stare hasło</label>
                  <input
                    type="password"
                    className="form-control bg-secondary text-white border-0"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Nowe hasło</label>
                  <input
                    type="password"
                    className="form-control bg-secondary text-white border-0"
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Potwierdź nowe hasło</label>
                  <input
                    type="password"
                    className="form-control bg-secondary text-white border-0"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-warning">Zapisz hasło</button>
                  <button type="button" className="btn btn-outline-light" onClick={() => setEditingUserId(null)}>Anuluj</button>
                </div>
              </form>
            </div>
          ) : (
            <div className="card bg-dark text-white mb-4 p-3 border-secondary">
              <h4>Dodaj nowego użytkownika</h4>
              <form onSubmit={handleCreateUser}>
                <div className="mb-3">
                  <label className="form-label">Nazwa użytkownika (nick)</label>
                  <input
                    type="text"
                    className="form-control bg-secondary text-white border-0"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Hasło</label>
                  <input
                    type="password"
                    className="form-control bg-secondary text-white border-0"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary">Utwórz</button>
              </form>
            </div>
          )}

          <h4>Lista użytkowników</h4>
          {loading ? (
            <p>Ładowanie...</p>
          ) : (
            <StripedList>
              {users.map((user) => (
                <div key={user.id} className="w-100 d-flex justify-content-between align-items-center">
                  <div><strong>{user.username}</strong></div>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-sm btn-outline-warning"
                      onClick={() => openPasswordEditor(user.id)}
                    >
                      Zmień hasło
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                    >
                      Usuń
                    </button>
                  </div>
                </div>
              ))}
            </StripedList>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}