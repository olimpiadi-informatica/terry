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
        <h1>Giochi di Fibonacci - Seconda Fase</h1>
        <p>Benvenuto alla Seconda Fase dei Giochi di Fibonacci 2022/23!</p>
        <p>
          Accedi con il codice che ti indica il tuo insegnante. Quel codice è
          tuo ed è segreto, <strong>non condividerlo con nessuno</strong>!
        </p>
        <p>
          Da quando entri nel sito avrai <strong>2 ore</strong> per finire; più
          15 minuti che il tuo insegnante può decidere di usare come intervallo.
        </p>

        <h2 className={styles.title}>Effettua l&apos;accesso</h2>
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
