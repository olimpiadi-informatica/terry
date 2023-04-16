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
        <h1>Selezioni Territoriali OII 2023</h1>
        <p>Benvenuto alle Selezioni Territoriali delle OII 2023!</p>
        <p>
          Puoi accedere usando le credenziali che hai ricevuto nell'ultima mail.
          Ricorda che quel codice d'accesso è tuo e personale, <strong>non condividerlo con nessuno</strong>!
        </p>
        <p>
          La mail con le credenziali ha come oggetto <code>Credenziali Selezione Territoriale delle Olimpiadi Italiane di Informatica 2023</code>,
          se non dovessi trovarla contatta immediatamente il tuo referente o scrivi a <a href="mailto:info@olimpiadi-informatica.it">info@olimpiadi-informatica.it</a>!
          Puoi fare il login già da subito, e verrai reindirizzato alla piattaforma di gara, dove <strong>dovrai inserire nuovamente il token</strong>.
        </p>
        <p>
          La gara ha una durata di <strong>3 ore</strong>, a partire dalle 14.
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
