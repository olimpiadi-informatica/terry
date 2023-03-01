import Head from "next/head";
import styles from "@/styles/Home.module.css";
import { useState } from "react";
import { LoginResult } from "./api/login";

export default function Home() {
  const [token, setToken] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const doLogin = async () => {
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const body = (await res.json()) as LoginResult;

      if (!body.success || !body.url) {
        setError(true);
      } else {
        const url = new URL(body.url);
        document.cookie = `userToken=${token}; path=/; domain=${url.hostname};`;
        window.location.href = body.url;
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>Effettua l&apos;accesso</h1>
        <form
          className={styles.row}
          onSubmit={(e) => {
            e.preventDefault();
            doLogin();
          }}
        >
          <input
            type="password"
            placeholder="Inserisci qui il tuo token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
          />
          <button type="submit">Accedi</button>
        </form>
        {loading && <strong>Login in corso...</strong>}
        {error && (
          <strong>
            Si è verificato un errore! Ricontrolla il token e la tua connessione
            ad Internet.
          </strong>
        )}
      </main>
    </>
  );
}
