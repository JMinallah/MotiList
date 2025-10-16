import AuthForm from './AuthForm';
import useAuth from '../context/useAuth';

const Login = ({ darkMode }) => {
  const { loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  return (
    <div className={`min-h-screen flex flex-col items-center justify-center ${darkMode ? 'bg-midnight-background' : 'bg-pastel-background'}`}>
      <div className="mb-8 text-center">
        <h1 className={`text-4xl font-bold ${darkMode ? 'text-midnight-textPrimary' : 'text-pastel-textPrimary'}`}>
          MotiList
        </h1>
        <p className={`mt-2 ${darkMode ? 'text-midnight-textSecondary' : 'text-pastel-textSecondary'}`}>
          Your ultimate motivation and productivity companion
        </p>
      </div>
      
      <AuthForm darkMode={darkMode} />
    </div>
  );
};

export default Login;