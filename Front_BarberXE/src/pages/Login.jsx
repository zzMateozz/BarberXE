import { useState } from 'react';
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaPhone } from 'react-icons/fa';

function Login() {
  const [showRegister, setShowRegister] = useState(false);
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = () => {
    setShowRegister(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Nombre:', name, 'Apellido:', lastName, 'Correo:', email, 'Contraseña:', password, 'Confirmar contraseña:', confirmPassword, 'Teléfono:', phone);
    // Aquí puedes agregar la lógica para enviar el formulario de registro
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
          {showRegister ? 'Crear cuenta' : 'Iniciar sesión'}
        </h2>
        
        {/* Pestañas de navegación */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            className={`py-3 px-6 font-medium text-sm flex-1 text-center transition-colors ${!showRegister ? 'text-white bg-blue-600 rounded-t-lg' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setShowRegister(false)}
          >
            Iniciar sesión
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm flex-1 text-center transition-colors ${showRegister ? 'text-white bg-blue-600 rounded-t-lg' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={handleRegister}
          >
            Registrarse
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          {showRegister && (
            <>
              <div className="mb-4 flex space-x-4">
                <div className="w-1/2">
                  <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="name">
                    Nombre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      className="pl-10 appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id="name"
                      type="text"
                      placeholder="Nombre"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="w-1/2">
                  <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="lastName">
                    Apellido
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      className="pl-10 appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      id="lastName"
                      type="text"
                      placeholder="Apellido"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="phone">
                  Teléfono
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="text-gray-400" />
                  </div>
                  <input
                    className="pl-10 appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    id="phone"
                    type="tel"
                    placeholder="Teléfono"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="email">
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                className="pl-10 appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="password">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                className="pl-10 appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash className="text-gray-400 hover:text-gray-600" /> : <FaEye className="text-gray-400 hover:text-gray-600" />}
              </button>
            </div>
          </div>
          
          {showRegister && (
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-semibold mb-2" htmlFor="confirmPassword">
                Confirmar contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  className="pl-10 appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash className="text-gray-400 hover:text-gray-600" /> : <FaEye className="text-gray-400 hover:text-gray-600" />}
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-8">
            <button 
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
              type="submit"
            >
              {showRegister ? 'Crear cuenta' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
        
        {!showRegister && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              ¿No tienes una cuenta?{' '}
              <button 
                className="text-blue-600 hover:text-blue-800 font-semibold focus:outline-none"
                onClick={handleRegister}
              >
                Regístrate
              </button>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;