import { useState, useEffect } from "react";
import { 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  AlertCircle, 
  CheckCircle2,
  ArrowRight,
  UserPlus
} from "lucide-react";

function Login() {
  const [showRegister, setShowRegister] = useState(false);
  const [name, setName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Estados de validación
  const [nameError, setNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Validación en tiempo real para el nombre
  useEffect(() => {
    if (name) {
      if (name.length < 3) {
        setNameError("El nombre debe tener al menos 3 caracteres");
      } else if (name.length > 30) {
        setNameError("El nombre no debe exceder 30 caracteres");
      } else {
        setNameError("");
      }
    } else {
      setNameError("");
    }
  }, [name]);

  // Validación en tiempo real para el apellido
  useEffect(() => {
    if (lastName) {
      if (lastName.length < 3) {
        setLastNameError("El apellido debe tener al menos 3 caracteres");
      } else if (lastName.length > 30) {
        setLastNameError("El apellido no debe exceder 30 caracteres");
      } else {
        setLastNameError("");
      }
    } else {
      setLastNameError("");
    }
  }, [lastName]);

  // Validación en tiempo real para el email
  useEffect(() => {
    if (email) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
      if (!emailRegex.test(email)) {
        setEmailError("Correo inválido. Debe incluir @ y terminar en .com");
      } else {
        setEmailError("");
      }
    } else {
      setEmailError("");
    }
  }, [email]);

  // Validación en tiempo real para la contraseña
  useEffect(() => {
    if (password) {
      // Validación de longitud
      if (password.length < 8) {
        setPasswordError("La contraseña debe tener al menos 8 caracteres");
        return;
      } else if (password.length > 12) {
        setPasswordError("La contraseña no debe exceder 12 caracteres");
        return;
      }

      // Validación de caracteres permitidos
      if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(password)) {
        setPasswordError("La contraseña contiene caracteres no permitidos");
        return;
      }

      // Validación de requisitos adicionales
      let errorMessages = [];
      
      if (!/[A-Z]/.test(password)) {
        errorMessages.push("al menos una letra mayúscula");
      }
      
      if (!/[0-9]/.test(password)) {
        errorMessages.push("al menos un número");
      }
      
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        errorMessages.push("al menos un carácter especial");
      }

      if (errorMessages.length > 0) {
        setPasswordError(`La contraseña debe contener ${errorMessages.join(", ")}`);
      } else {
        setPasswordError("");
      }
    } else {
      setPasswordError("");
    }
  }, [password]);

  // Validación en tiempo real para confirmar contraseña
  useEffect(() => {
    if (confirmPassword && password) {
      if (confirmPassword !== password) {
        setConfirmPasswordError("Las contraseñas no coinciden");
      } else {
        setConfirmPasswordError("");
      }
    } else {
      setConfirmPasswordError("");
    }
  }, [confirmPassword, password]);

  // Validación en tiempo real para el teléfono
  useEffect(() => {
    if (phone) {
      if (phone.length < 7) {
        setPhoneError("El teléfono debe tener al menos 7 dígitos");
      } else if (phone.length > 10) {
        setPhoneError("El teléfono no debe exceder 10 dígitos");
      } else {
        setPhoneError("");
      }
    } else {
      setPhoneError("");
    }
  }, [phone]);

  const handleRegister = () => {
    setShowRegister(true);
  };

  const handleSubmit = async () => {
    try {
      if (showRegister) {
        // Validaciones de registro
        if (
          nameError ||
          lastNameError ||
          emailError ||
          passwordError ||
          confirmPasswordError ||
          phoneError
        ) {
          alert("Por favor corrige los errores en el formulario");
          return;
        }

        if (password !== confirmPassword) {
          alert("Las contraseñas no coinciden");
          return;
        }

        // Simular creación de usuario
        const newUser = {
          cliente: {
            nombre: name,
            apellido: lastName,
            telefono: phone,
          },
          usuario: email,
          contraseña: password,
        };

        console.log("Registrando usuario:", newUser);
        alert("Cuenta creada con éxito. Ahora puedes iniciar sesión.");

        // Limpiar campos y cambiar a vista de login
        setName("");
        setLastName("");
        setPhone("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setShowRegister(false);
      } else {
        // Lógica de login
        const credentials = {
          usuario: email,
          contraseña: password
        };

        console.log("Iniciando sesión:", credentials);
        alert(`¡Bienvenido ${email}!`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Ha ocurrido un error. Por favor intenta de nuevo.");
    }
  };

  // Componente para mensajes de validación
  const ValidationMessage = ({ message, isValid }) => {
    if (!message) return null;

    return (
      <div className={`text-xs mt-2 flex items-center transition-all duration-200 ${
        isValid ? "text-green-600" : "text-red-500"
      }`}>
        {isValid ? (
          <CheckCircle2 className="w-3 h-3 mr-1.5 flex-shrink-0" />
        ) : (
          <AlertCircle className="w-3 h-3 mr-1.5 flex-shrink-0" />
        )}
        <span className="leading-tight">{message}</span>
      </div>
    );
  };

  // Función para determinar el estilo del borde según la validación
  const getInputBorderClass = (value, error) => {
    if (!value) return "border-gray-200 focus:border-red-500";
    return error
      ? "border-red-400 focus:border-red-500 bg-red-50"
      : "border-green-400 focus:border-green-500 bg-green-50";
  };

  return (
    <div className="min-h-screen bg-white from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header con animación */}
        <div className="text-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-300">
              {showRegister ? (
                <UserPlus className="w-10 h-10 text-white" />
              ) : (
                <User className="w-10 h-10 text-white" />
              )}
            </div>
            {/* Círculos decorativos */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-4 w-32 h-32 bg-red-500/10 rounded-full blur-xl"></div>
          </div>
          
          <h1 className="text-3xl font-bold text-black mb-3">
            {showRegister ? "Crear Nueva Cuenta" : "Bienvenido de Vuelta"}
          </h1>
          <p className="text-gray-500 text-sm">
            {showRegister 
              ? "Únete a nuestra plataforma completando el registro" 
              : "Ingresa tus credenciales para acceder a tu cuenta"
            }
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200/50">
          {/* Toggle Buttons */}
          <div className="flex mb-8 bg-gray-100 rounded-2xl p-1.5 relative overflow-hidden">
            <div 
              className={`absolute top-1.5 bottom-1.5 bg-gradient-to-r from-red-500 to-red-600 rounded-xl transition-all duration-300 shadow-lg ${
                showRegister ? 'left-1/2 right-1.5' : 'left-1.5 right-1/2'
              }`}
            ></div>
            
            <button
              className={`flex-1 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 relative z-10 ${
                !showRegister
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={() => setShowRegister(false)}
            >
              Iniciar Sesión
            </button>
            <button
              className={`flex-1 py-3.5 px-4 rounded-xl font-semibold text-sm transition-all duration-300 relative z-10 ${
                showRegister
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-800"
              }`}
              onClick={handleRegister}
            >
              Registrarse
            </button>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            {showRegister && (
              <>
                {/* Nombre y Apellido */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-semibold">
                      Nombre
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                      <input
                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 text-black placeholder-gray-400 ${getInputBorderClass(name, nameError)}`}
                        type="text"
                        placeholder="Escribe tu nombre"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        minLength={3}
                        maxLength={30}
                      />
                    </div>
                    <ValidationMessage message={nameError} isValid={false} />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-gray-700 text-sm font-semibold">
                      Apellido
                    </label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                      <input
                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 text-black placeholder-gray-400 ${getInputBorderClass(lastName, lastNameError)}`}
                        type="text"
                        placeholder="Escribe tu apellido"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        minLength={3}
                        maxLength={30}
                      />
                    </div>
                    <ValidationMessage message={lastNameError} isValid={false} />
                  </div>
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                  <label className="block text-gray-700 text-sm font-semibold">
                    Número de Teléfono
                  </label>
                  <div className="relative group">
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                    <input
                      className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 text-black placeholder-gray-400 ${getInputBorderClass(phone, phoneError)}`}
                      type="tel"
                      placeholder="1234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                      minLength={7}
                      maxLength={10}
                    />
                  </div>
                  <ValidationMessage message={phoneError} isValid={false} />
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-semibold">
                Correo Electrónico
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  className={`w-full pl-12 pr-4 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 text-black placeholder-gray-400 ${getInputBorderClass(email, emailError)}`}
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={100}
                />
              </div>
              <ValidationMessage message={emailError} isValid={false} />
            </div>

            {/* Contraseña */}
            <div className="space-y-2">
              <label className="block text-gray-700 text-sm font-semibold">
                Contraseña
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                <input
                  className={`w-full pl-12 pr-14 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 text-black placeholder-gray-400 ${getInputBorderClass(password, passwordError)}`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Crea una contraseña segura"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={12}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <ValidationMessage message={passwordError} isValid={false} />
            </div>

            {/* Confirmar Contraseña */}
            {showRegister && (
              <div className="space-y-2">
                <label className="block text-gray-700 text-sm font-semibold">
                  Confirmar Contraseña
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors" />
                  <input
                    className={`w-full pl-12 pr-14 py-4 border-2 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 text-black placeholder-gray-400 ${getInputBorderClass(confirmPassword, confirmPasswordError)}`}
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                    maxLength={12}
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <ValidationMessage message={confirmPasswordError} isValid={false} />
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                onClick={handleSubmit}
                className="group w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-4 px-6 rounded-2xl focus:outline-none focus:ring-4 focus:ring-red-500/30 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl flex items-center justify-center space-x-3"
              >
                <span className="text-lg">
                  {showRegister ? "Crear Mi Cuenta" : "Iniciar Sesión"}
                </span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </button>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center">
            {!showRegister ? (
              <p className="text-gray-600 text-sm">
                ¿No tienes cuenta?{" "}
                <button
                  onClick={handleRegister}
                  className="text-red-600 hover:text-red-700 font-semibold focus:outline-none transition-colors duration-200 underline decoration-2 underline-offset-2"
                >
                  Regístrate
                </button>
              </p>
            ) : (
              <p className="text-gray-600 text-sm">
                ¿Ya tienes cuenta?{" "}
                <button
                  onClick={() => setShowRegister(false)}
                  className="text-red-600 hover:text-red-700 font-semibold focus:outline-none transition-colors duration-200 underline decoration-2 underline-offset-2"
                >
                  Inicia sesión
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Bottom Text */}
        <div className="text-center mt-6">
          <p className="text-gray-400 text-xs">
            Al continuar, aceptas nuestros{" "}
            <span className="text-red-400 hover:text-red-300 cursor-pointer transition-colors">
              Términos de Servicio
            </span>{" "}
            y{" "}
            <span className="text-red-400 hover:text-red-300 cursor-pointer transition-colors">
              Política de Privacidad
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;