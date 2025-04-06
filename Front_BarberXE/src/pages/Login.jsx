import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaEye,
  FaEyeSlash,
  FaUser,
  FaEnvelope,
  FaLock,
  FaPhone,
  FaExclamationCircle,
  FaCheckCircle,
} from "react-icons/fa";
import { loginUser, createUser } from "../services/ClientService";
import { toast } from "react-toastify";

function Login() {
  const navigate = useNavigate();
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
      if (password.length < 8) {
        setPasswordError("La contraseña debe tener al menos 8 caracteres");
      } else if (password.length > 12) {
        setPasswordError("La contraseña no debe exceder 12 caracteres");
      } else if (!/^[a-zA-Z0-9]{8,12}$/.test(password)) {
        setPasswordError("La contraseña solo debe contener letras y números");
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

  const handleSubmit = async (e) => {
    e.preventDefault();

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
          toast.error("Por favor corrige los errores en el formulario");
          return;
        }

        if (password !== confirmPassword) {
          toast.error("Las contraseñas no coinciden");
          return;
        }

        const newUser = {
          cliente: {
            nombre: name,
            apellido: lastName,
            telefono: phone,
          },
          usuario: email,
          contraseña: password,
        };

        const response = await createUser(newUser);
        console.log("Respuesta del registro:", response);

        if (response.error) {
          throw new Error(response.error);
        }

        toast.success("Cuenta creada con éxito. Ahora puedes iniciar sesión.");

        // Limpiar campos y cambiar a vista de login
        setName("");
        setLastName("");
        setPhone("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setShowRegister(false);
      } else {
        // Validaciones de login
        if (emailError || passwordError) {
          toast.error("Por favor corrige los errores en el formulario");
          return;
        }

        const credentials = {
          usuario: email,
          contraseña: password,
        };

        const response = await loginUser(credentials);
        console.log("Respuesta del login:", response);

        // Manejo de la respuesta del login
        if (response.error) {
          throw new Error(response.error);
        }
        // Dentro de tu función handleSubmit donde procesas la respuesta del login
        if (response.usuario) {
          // Normaliza el rol a minúsculas antes de guardarlo
          const role = (response.usuario.role || "cliente").toLowerCase();

          localStorage.setItem(
            "authData",
            JSON.stringify({
              isAuthenticated: true,
              user: response.usuario,
              role: role, // Guardamos el rol en minúsculas
            })
          );

          toast.success(`¡Bienvenido ${response.usuario.nombre || email}!`);

          // Redirige usando window.location para forzar recarga completa
          window.location.href = `/${role}`;
          return;
        }

        throw new Error("Respuesta inesperada del servidor");
      }
    } catch (error) {
      console.error("Error:", error);

      // Mensajes de error específicos
      let errorMessage = error.message;

      if (error.message.includes("500")) {
        errorMessage = "Error en el servidor. Por favor intenta más tarde.";
      } else if (error.message.toLowerCase().includes("network")) {
        errorMessage = "Problema de conexión. Verifica tu internet.";
      } else if (error.message.includes("401")) {
        errorMessage = "Credenciales incorrectas";
      }

      toast.error(errorMessage);
    }
  };

  // Componente para mensajes de validación
  const ValidationMessage = ({ message, isValid }) => {
    if (!message) return null;

    return (
      <div
        className={`text-sm mt-1 flex items-center ${
          isValid ? "text-green-600" : "text-red-600"
        }`}
      >
        {isValid ? (
          <FaCheckCircle className="mr-1" />
        ) : (
          <FaExclamationCircle className="mr-1" />
        )}
        {message}
      </div>
    );
  };

  // Función para determinar el estilo del borde según la validación
  const getInputBorderClass = (value, error) => {
    if (!value) return "border-gray-300";
    return error
      ? "border-red-500 focus:ring-red-500"
      : "border-green-500 focus:ring-green-500";
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
          {showRegister ? "Crear cuenta" : "Iniciar sesión"}
        </h2>

        {/* Pestañas de navegación */}
        <div className="flex mb-6 border-b border-gray-200">
          <button
            className={`py-3 px-6 font-medium text-sm flex-1 text-center transition-colors ${
              !showRegister
                ? "text-white bg-blue-600 rounded-t-lg"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setShowRegister(false)}
          >
            Iniciar sesión
          </button>
          <button
            className={`py-3 px-6 font-medium text-sm flex-1 text-center transition-colors ${
              showRegister
                ? "text-white bg-blue-600 rounded-t-lg"
                : "text-gray-500 hover:text-gray-700"
            }`}
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
                  <label
                    className="block text-gray-700 text-sm font-semibold mb-2"
                    htmlFor="name"
                  >
                    Nombre
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      className={`pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:border-transparent ${getInputBorderClass(
                        name,
                        nameError
                      )}`}
                      id="name"
                      type="text"
                      placeholder="Nombre (3-30 caracteres)"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      minLength={3}
                      maxLength={30}
                      required
                    />
                  </div>
                  <ValidationMessage message={nameError} isValid={false} />
                  {name && !nameError && (
                    <ValidationMessage message="Nombre válido" isValid={true} />
                  )}
                </div>
                <div className="w-1/2">
                  <label
                    className="block text-gray-700 text-sm font-semibold mb-2"
                    htmlFor="lastName"
                  >
                    Apellido
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400" />
                    </div>
                    <input
                      className={`pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:border-transparent ${getInputBorderClass(
                        lastName,
                        lastNameError
                      )}`}
                      id="lastName"
                      type="text"
                      placeholder="Apellido (3-30 caracteres)"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      minLength={3}
                      maxLength={30}
                      required
                    />
                  </div>
                  <ValidationMessage message={lastNameError} isValid={false} />
                  {lastName && !lastNameError && (
                    <ValidationMessage
                      message="Apellido válido"
                      isValid={true}
                    />
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label
                  className="block text-gray-700 text-sm font-semibold mb-2"
                  htmlFor="phone"
                >
                  Teléfono
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaPhone className="text-gray-400" />
                  </div>
                  <input
                    className={`pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:border-transparent ${getInputBorderClass(
                      phone,
                      phoneError
                    )}`}
                    id="phone"
                    type="tel"
                    placeholder="Teléfono (7-10 dígitos)"
                    value={phone}
                    onChange={(e) =>
                      setPhone(e.target.value.replace(/\D/g, ""))
                    }
                    minLength={7}
                    maxLength={10}
                    pattern="[0-9]{7,10}"
                    required
                  />
                </div>
                <ValidationMessage message={phoneError} isValid={false} />
                {phone && !phoneError && (
                  <ValidationMessage message="Teléfono válido" isValid={true} />
                )}
              </div>
            </>
          )}

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="email"
            >
              Correo electrónico
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaEnvelope className="text-gray-400" />
              </div>
              <input
                className={`pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:border-transparent ${getInputBorderClass(
                  email,
                  emailError
                )}`}
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={100}
                required
              />
            </div>
            <ValidationMessage message={emailError} isValid={false} />
            {email && !emailError && (
              <ValidationMessage message="Correo válido" isValid={true} />
            )}
          </div>

          <div className="mb-4">
            <label
              className="block text-gray-700 text-sm font-semibold mb-2"
              htmlFor="password"
            >
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaLock className="text-gray-400" />
              </div>
              <input
                className={`pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:border-transparent ${getInputBorderClass(
                  password,
                  passwordError
                )}`}
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña (8-12 caracteres)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={12}
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                ) : (
                  <FaEye className="text-gray-400 hover:text-gray-600" />
                )}
              </button>
            </div>
            <ValidationMessage message={passwordError} isValid={false} />
            {password && !passwordError && (
              <ValidationMessage message="Contraseña válida" isValid={true} />
            )}
          </div>

          {showRegister && (
            <div className="mb-6">
              <label
                className="block text-gray-700 text-sm font-semibold mb-2"
                htmlFor="confirmPassword"
              >
                Confirmar contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaLock className="text-gray-400" />
                </div>
                <input
                  className={`pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:border-transparent ${getInputBorderClass(
                    confirmPassword,
                    confirmPasswordError
                  )}`}
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  maxLength={12}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FaEyeSlash className="text-gray-400 hover:text-gray-600" />
                  ) : (
                    <FaEye className="text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
              <ValidationMessage
                message={confirmPasswordError}
                isValid={false}
              />
              {confirmPassword && !confirmPasswordError && (
                <ValidationMessage
                  message="Contraseñas coinciden"
                  isValid={true}
                />
              )}
            </div>
          )}

          <div className="mt-8">
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
              type="submit"
            >
              {showRegister ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </div>
        </form>

        {!showRegister && (
          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              ¿No tienes una cuenta?{" "}
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
