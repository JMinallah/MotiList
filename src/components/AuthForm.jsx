import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../firebaseUtils';
import useAuth from '../context/useAuth';

const AuthForm = ({ darkMode }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Redirect if already logged in using useEffect
  useEffect(() => {
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      if (isLogin) {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignIn = async () => {
    setError('');
    setIsLoading(true);
    
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className={`max-w-md w-full p-6 rounded-xl ${darkMode ? 'bg-midnight-card' : 'bg-pastel-card'} shadow-lg`}>
      <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
        {isLogin ? 'Sign In to MotiList' : 'Create Account'}
      </h2>
      
      {error && (
        <div className={`p-3 mb-4 rounded-lg ${darkMode ? 'bg-midnight-error/10 text-midnight-error' : 'bg-pastel-error/10 text-pastel-error'}`}>
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
            Email
          </label>
          <input 
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={`w-full p-2.5 rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
          />
        </div>
        
        <div>
          <label className={`block mb-1 text-sm font-medium ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
            Password
          </label>
          <input 
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={`w-full p-2.5 rounded-lg border ${darkMode ? 'bg-midnight-background border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border-pastel-shadow text-pastel-textPrimary'}`}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2.5 rounded-lg font-medium ${darkMode ? 'bg-midnight-primary text-white' : 'bg-pastel-primary text-white'} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          {isLoading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
        </button>
      </form>
      
      <div className={`my-4 flex items-center ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
        <div className="flex-1 h-px bg-current opacity-20"></div>
        <span className="px-3 text-sm">or</span>
        <div className="flex-1 h-px bg-current opacity-20"></div>
      </div>
      
      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className={`w-full py-2.5 rounded-lg font-medium flex justify-center items-center gap-2 ${darkMode ? 'bg-midnight-background border border-midnight-shadow text-midnight-textPrimary' : 'bg-pastel-background border border-pastel-shadow text-pastel-textPrimary'} ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
          <path fill="currentColor" d="M12 22q-2.05 0-3.875-.788q-1.825-.787-3.187-2.15q-1.363-1.362-2.15-3.187Q2 14.05 2 12q0-2.075.788-3.887q.787-1.813 2.15-3.175Q6.3 3.575 8.125 2.787Q9.95 2 12 2q2.075 0 3.887.787q1.813.788 3.175 2.151q1.363 1.362 2.15 3.175Q22 9.925 22 12v1.45q0 1.475-1.012 2.513Q19.975 17 18.5 17q-.9 0-1.675-.4q-.775-.4-1.275-1.05q-.675.675-1.587 1.063Q13.05 17 12 17q-2.075 0-3.537-1.463Q7 14.075 7 12q0-2.075 1.463-3.537Q9.925 7 12 7q2.075 0 3.538 1.463Q17 9.925 17 12v1.45q0 .725.45 1.137q.45.413 1.05.413q.6 0 1.05-.413q.45-.412.45-1.137V12q0-3.35-2.325-5.675Q15.35 4 12 4Q8.65 4 6.325 6.325Q4 8.65 4 12q0 3.35 2.325 5.675Q8.65 20 12 20h5v2Zm0-7q1.25 0 2.125-.875T15 12q0-1.25-.875-2.125T12 9q-1.25 0-2.125.875T9 12q0 1.25.875 2.125T12 15Z"/>
        </svg>
        <span>Continue with Google</span>
      </button>
      
      <div className="mt-5 text-center">
        <button 
          onClick={() => setIsLogin(!isLogin)}
          className={`text-sm ${darkMode ? 'text-midnight-primary' : 'text-pastel-primary'} hover:underline`}
        >
          {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
};

export default AuthForm;