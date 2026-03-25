import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const { error: authError } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);

    if (authError) {
      setError(authError.message);
    }
    setSubmitting(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logoWrap}>
          <svg width="40" height="40" viewBox="0 0 1786 916" fill="none">
            <path d="M937.165 76.3397C958.961 38.5884 994.463 13.6844 1033.76 4.28447C1109.34 -14.0536 1187.86 27.8503 1213.69 102.866L1315.16 397.564L1315.2 397.498L1349.55 497.353L1327.19 376.74L1500.62 76.3397C1542.73 3.41634 1635.97 -21.5689 1708.9 20.5334C1781.82 62.6357 1806.8 155.882 1764.7 228.806L1412.54 838.773C1405.47 851.008 1396.97 861.893 1387.36 871.339C1371.54 887.102 1351.99 899.617 1329.46 907.377C1249.84 934.791 1163.07 892.472 1135.66 812.856L999.853 418.448L1022.19 538.929L849.08 838.773C806.977 911.696 713.731 936.682 640.807 894.579C567.884 852.477 542.898 759.23 585.001 686.307L937.165 76.3397Z" fill="white"/>
            <path d="M581.591 20.5334C508.668 -21.5689 415.421 3.41633 373.319 76.3397L21.1539 686.307C-20.9484 759.23 4.03702 852.477 76.9604 894.579C149.884 936.682 243.13 911.696 285.233 838.773L637.397 228.806C679.5 155.882 654.514 62.6357 581.591 20.5334Z" fill="white"/>
          </svg>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" disabled={submitting} style={styles.button}>
            {submitting
              ? '...'
              : isSignUp
                ? 'Créer un compte'
                : 'Se connecter'}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
          style={styles.toggle}
        >
          {isSignUp
            ? 'Déjà un compte ? Se connecter'
            : 'Pas de compte ? Créer un compte'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#000',
  },
  card: {
    width: '100%',
    maxWidth: 360,
    padding: '48px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 32,
  },
  logoWrap: {
    marginBottom: 8,
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: '#111',
    border: '1px solid #333',
    borderRadius: 4,
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  },
  error: {
    color: '#ef4444',
    fontSize: 13,
    margin: 0,
  },
  button: {
    width: '100%',
    padding: '10px 0',
    backgroundColor: '#fff',
    color: '#000',
    border: 'none',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: 4,
  },
  toggle: {
    background: 'none',
    border: 'none',
    color: '#666',
    fontSize: 13,
    cursor: 'pointer',
    padding: 0,
  },
};
