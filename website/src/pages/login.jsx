import { useState } from "react";

import { z } from "zod";

import UniversalHead from "@components/misc/UniversalHead.jsx";

import Footer from "@/src/components/layout/Footer/Footer.jsx";

import styles from "@/src/styles/login.module.scss";

import { mainDivClass } from "@styles/global.bootstrap.js";

import NavBar from "@/src/components/layout/Navbar/NavBar.jsx";

const loginSchema = z.object({
  nick: z.string().min(1, "Nick jest wymagany"),
  password: z.string().min(6, "Hasło musi mieć co najmniej 6 znaków"),
});

export default function Login() {
  const [formData, setFormData] = useState({ nick: "", password: "" });

  const [errors, setErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      loginSchema.parse(formData);

      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        window.location.href = "/";
      } else {
        setErrors({ general: data.message || "Niepoprawne dane logowania" });
      }
    } catch (err) {
      if (err?.issues) {
        const fieldErrors = {};
        err.issues.forEach((issue) => {
          fieldErrors[issue.path[0]] = issue.message;
        });
        setErrors(fieldErrors);
      } else {
        setErrors({ general: "Błąd połączenia z serwerem" });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <UniversalHead />
      <div className={`${styles.bgImgLogin} ${mainDivClass}`}>
        <NavBar />
        <div className="container d-flex flex-grow-1 align-items-center justify-content-center">
          <div className={styles.loginContainer}>
            <h1 className={styles.loginTitle}>Logowanie</h1>

            <form onSubmit={handleSubmit} noValidate>
              {errors.general && (
                <div
                  className="alert alert-danger py-2 text-center"
                  role="alert"
                >
                  {errors.general}
                </div>
              )}

              <div className="mb-4">
                {/* <label htmlFor="nick" className="form-label text-white"></label> */}
                <input
                  type="text"
                  className={`form-control bg-dark text-white border-secondary ${errors.nick ? "is-invalid" : ""}`}
                  id="nick"
                  name="nick"
                  value={formData.nick}
                  onChange={handleChange}
                  placeholder="Nickname"
                />

                {errors.nick && (
                  <div className={styles.errorText}>{errors.nick}</div>
                )}
              </div>

              <div className="mb-4">
                {/* <label
                  htmlFor="password"
                  className="form-label text-white"
                ></label> */}
                <input
                  type="password"
                  className={`form-control bg-dark text-white border-secondary ${errors.password ? "is-invalid" : ""}`}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />

                {errors.password && (
                  <div className={styles.errorText}>{errors.password}</div>
                )}
              </div>

              <button
                type="submit"
                className={`btn w-100 mt-3 ${styles.submitButton}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Logowanie..." : "Zaloguj się"}
              </button>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
