import UniversalHead from "@components/misc/UniversalHead.jsx";
import NavBar from "@/src/components/layout/Navbar/NavBar.jsx";
import Footer from "@/src/components/layout/Footer/Footer.jsx";
import StripedList from "@/src/components/ui/StripedList/StripedList.jsx";
import { useEffect, useState } from "react";
import styles from "@/src/styles/services.module.scss";
import { mainDivClass } from "@styles/global.bootstrap.js";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      if (res.ok) {
        setMessage("Użytkownik utworzony!");
        setNewUser({ username: "", password: "" });
        fetchUsers();
      } else {
        const error = await res.json();
        setMessage("Błąd: " + (error.message || error.error));
      }
    } catch (err) {
      setMessage("Błąd połączenia");
    }
  };

  const handleDeleteUser = async (id, username) => {
    if (!confirm(`Czy na pewno chcesz usunąć użytkownika ${username}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMessage(`Użytkownik ${username} został usunięty.`);
        fetchUsers();
      } else {
        const error = await res.json();
        setMessage("Błąd: " + (error.message || error.error));
      }
    } catch (err) {
      setMessage("Błąd połączenia");
    }
  };

  return (
    <>
      <UniversalHead />
      <div className={`${styles.bgImgServices} ${mainDivClass}`}>
        <NavBar />
        <div
          className="container mt-5"
          style={{ maxWidth: "800px", color: "white" }}
        >
          <h2>Zarządzanie użytkownikami</h2>

          <div className="card bg-dark text-white mb-4 p-3 border-secondary">
            <h4>Dodaj nowego użytkownika</h4>
            <form onSubmit={handleCreateUser}>
              <div className="mb-3">
                <label className="form-label">Nazwa użytkownika (nick)</label>
                <input
                  type="text"
                  className="form-control bg-secondary text-white border-0"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser({ ...newUser, username: e.target.value })
                  }
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Hasło</label>
                <input
                  type="password"
                  className="form-control bg-secondary text-white border-0"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser({ ...newUser, password: e.target.value })
                  }
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">
                Utwórz
              </button>
            </form>
            {message && <p className="mt-2">{message}</p>}
          </div>

          <h4>Lista użytkowników</h4>
          <StripedList>
            {users.map((user) => (
              <div
                key={user.id}
                className="w-100 d-flex justify-content-between align-items-center"
              >
                <div>
                  <strong>{user.username}</strong>
                </div>
                <div className="d-flex align-items-center">
                  <div className="badge bg-success me-3">
                    {user.is_active ? "Aktywny" : "Nieaktywny"}
                  </div>
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
        </div>
      </div>
      <Footer />
    </>
  );
}
