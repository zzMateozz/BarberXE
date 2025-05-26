import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaEnvelope, FaLock, FaPhone, FaExclamationCircle, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import { LoginService } from "../services/LoginService";
import { createUser } from "../services/ClientService";


function Login() {
    const navigate = useNavigate();
    const [showRegister, setShowRegister] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: ""
    });
    
    const [errors, setErrors] = useState({
        name: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: ""
    });
    
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Validaciones
    useEffect(() => {
        // Validación de nombre
        if (formData.name) {
            if (formData.name.length < 3) {
                setErrors(prev => ({...prev, name: "El nombre debe tener al menos 3 caracteres"}));
            } else if (formData.name.length > 30) {
                setErrors(prev => ({...prev, name: "El nombre no debe exceder 30 caracteres"}));
            } else {
                setErrors(prev => ({...prev, name: ""}));
            }
        }
        
        // Validación de apellido
        if (formData.lastName) {
            if (formData.lastName.length < 3) {
                setErrors(prev => ({...prev, lastName: "El apellido debe tener al menos 3 caracteres"}));
            } else if (formData.lastName.length > 30) {
                setErrors(prev => ({...prev, lastName: "El apellido no debe exceder 30 caracteres"}));
            } else {
                setErrors(prev => ({...prev, lastName: ""}));
            }
        }
        
        // Validación de email
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.com$/;
        if (formData.email) {
            if (!emailRegex.test(formData.email)) {
                setErrors(prev => ({...prev, email: "Correo inválido. Debe incluir @ y terminar en .com"}));
            } else {
                setErrors(prev => ({...prev, email: ""}));
            }
        }
        
        // Validación de contraseña
        if (formData.password) {
            if (formData.password.length < 8) {
                setErrors(prev => ({...prev, password: "La contraseña debe tener al menos 8 caracteres"}));
            } else if (formData.password.length > 12) {
                setErrors(prev => ({...prev, password: "La contraseña no debe exceder 12 caracteres"}));
            } else if (!/^[a-zA-Z0-9]{8,12}$/.test(formData.password)) {
                setErrors(prev => ({...prev, password: "La contraseña solo debe contener letras y números"}));
            } else {
                setErrors(prev => ({...prev, password: ""}));
            }
        }
        
        // Validación de confirmación de contraseña
        if (formData.confirmPassword) {
            if (formData.confirmPassword !== formData.password) {
                setErrors(prev => ({...prev, confirmPassword: "Las contraseñas no coinciden"}));
            } else {
                setErrors(prev => ({...prev, confirmPassword: ""}));
            }
        }
        
        // Validación de teléfono
        if (formData.phone) {
            if (formData.phone.length < 7) {
                setErrors(prev => ({...prev, phone: "El teléfono debe tener al menos 7 dígitos"}));
            } else if (formData.phone.length > 10) {
                setErrors(prev => ({...prev, phone: "El teléfono no debe exceder 10 dígitos"}));
            } else {
                setErrors(prev => ({...prev, phone: ""}));
            }
        }
    }, [formData]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (showRegister) {
            // Lógica de registro (sin cambios)
            if (Object.values(errors).some(error => error !== "")) {
                toast.error("Por favor corrige los errores en el formulario");
                return;
            }
            
            if (formData.password !== formData.confirmPassword) {
                toast.error("Las contraseñas no coinciden");
                return;
            }
            
            try {
                const newUser = {
                    cliente: {
                        nombre: formData.name,
                        apellido: formData.lastName,
                        telefono: formData.phone,
                    },
                    usuario: formData.email,
                    contraseña: formData.password,
                };

                const response = await createUser(newUser);
                toast.success("Cuenta creada con éxito. Ahora puedes iniciar sesión.");
                
                setFormData({
                    name: "",
                    lastName: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                    phone: ""
                });
                setShowRegister(false);
            } catch (error) {
                toast.error(error.message || "Error al crear la cuenta");
            }
        } else {
            // Lógica de login mejorada
            try {
                const credentials = {
                    usuario: formData.email,
                    contraseña: formData.password
                };

                console.log("Enviando credenciales:", credentials);
                const authData = await LoginService.login(credentials);
                console.log("Datos de autenticación recibidos:", authData);

                // Verificación más estricta de la estructura de respuesta
                if (!authData || !authData.token || !authData.user || !authData.role) {
                    console.error("Estructura de respuesta inválida:", authData);
                    throw new Error('Respuesta de autenticación inválida del servidor');
                }

                // Guardar en localStorage con estructura consistente
                const authInfo = {
                    isAuthenticated: true,
                    user: authData.user,
                    role: authData.role,
                    token: authData.token
                };
                
                localStorage.setItem('authData', JSON.stringify(authInfo));
                localStorage.setItem('authToken', authData.token);
                
                console.log("Datos guardados en localStorage:", authInfo);

                toast.success(`¡Bienvenido ${authData.user.username || authData.user.name || 'Usuario'}!`);

                // Redirección mejorada según rol
                const roleRoutes = {
                    admin: '/admin',
                    empleado: '/cajero',
                    cajero: '/cajero',
                    cliente: '/cliente'
                };
                
                const userRole = authData.role.toLowerCase();
                const redirectPath = roleRoutes[userRole];
                
                if (!redirectPath) {
                    console.error(`Rol no reconocido: ${userRole}`);
                    toast.error("Rol de usuario no válido");
                    return;
                }
                
                console.log(`Redirigiendo a: ${redirectPath} (Rol: ${userRole})`);
                
                // Usar setTimeout para asegurar que el localStorage se haya guardado
                setTimeout(() => {
                    navigate(redirectPath, { replace: true });
                }, 100);
                
            } catch (error) {
                console.error("Error completo de login:", {
                    message: error.message,
                    stack: error.stack,
                    response: error.response
                });
                
                let errorMessage = "Error en el servidor";
                
                if (error.message.includes("401") || error.message.toLowerCase().includes("credenciales")) {
                    errorMessage = "Credenciales incorrectas";
                } else if (error.message.includes("estructura") || error.message.includes("inválida")) {
                    errorMessage = "Error en el formato de respuesta del servidor";
                } else if (error.message.toLowerCase().includes("network") || error.message.toLowerCase().includes("fetch")) {
                    errorMessage = "Error de conexión con el servidor";
                } else if (error.message.toLowerCase().includes("cors")) {
                    errorMessage = "Error de configuración del servidor";
                }
                
                toast.error(errorMessage);
                
                // Limpiar localStorage en caso de error
                localStorage.removeItem('authData');
                localStorage.removeItem('authToken');
            }
        }
    };

    const ValidationMessage = ({ message, isValid }) => {
        if (!message) return null;

        return (
            <div className={`text-sm mt-1 flex items-center ${isValid ? "text-green-600" : "text-red-600"}`}>
                {isValid ? (
                    <FaCheckCircle className="mr-1" />
                ) : (
                    <FaExclamationCircle className="mr-1" />
                )}
                {message}
            </div>
        );
    };

    const getInputBorderClass = (value, error) => {
        if (!value) return "border-gray-300";
        return error ? "border-red-500 focus:ring-red-500" : "border-green-500 focus:ring-green-500";
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-200">
            <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
                <h2 className="text-3xl font-bold mb-8 text-center text-gray-800">
                    {showRegister ? "Crear cuenta" : "Iniciar sesión"}
                </h2>

                <div className="flex mb-6 border-b border-gray-200">
                    <button
                        type="button"
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
                        type="button"
                        className={`py-3 px-6 font-medium text-sm flex-1 text-center transition-colors ${
                            showRegister 
                            ? "text-white bg-blue-600 rounded-t-lg" 
                            : "text-gray-500 hover:text-gray-700"
                        }`}
                        onClick={() => setShowRegister(true)}
                    >
                        Registrarse
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {showRegister && (
                        <>
                            <div className="mb-4 flex gap-4">
                                <div className="w-1/2">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                                        Nombre
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaUser className="text-gray-400" />
                                        </div>
                                        <input
                                            name="name"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            className={`pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:border-transparent ${
                                                getInputBorderClass(formData.name, errors.name)
                                            }`}
                                            type="text"
                                            placeholder="Nombre (3-30 caracteres)"
                                            minLength={3}
                                            maxLength={30}
                                            required
                                        />
                                    </div>
                                    <ValidationMessage message={errors.name} isValid={!errors.name} />
                                </div>
                                
                                <div className="w-1/2">
                                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                                        Apellido
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <FaUser className="text-gray-400" />
                                        </div>
                                        <input
                                            name="lastName"
                                            value={formData.lastName}
                                            onChange={handleInputChange}
                                            className={`pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:border-transparent ${
                                                getInputBorderClass(formData.lastName, errors.lastName)
                                            }`}
                                            type="text"
                                            placeholder="Apellido (3-30 caracteres)"
                                            minLength={3}
                                            maxLength={30}
                                            required
                                        />
                                    </div>
                                    <ValidationMessage message={errors.lastName} isValid={!errors.lastName} />
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-semibold mb-2">
                                    Teléfono
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FaPhone className="text-gray-400" />
                                    </div>
                                    <input
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className={`pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:border-transparent ${
                                            getInputBorderClass(formData.phone, errors.phone)
                                        }`}
                                        type="tel"
                                        placeholder="Teléfono (7-10 dígitos)"
                                        minLength={7}
                                        maxLength={10}
                                        pattern="[0-9]{7,10}"
                                        required
                                    />
                                </div>
                                <ValidationMessage message={errors.phone} isValid={!errors.phone} />
                            </div>
                        </>
                    )}

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                            Correo electrónico
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaEnvelope className="text-gray-400" />
                            </div>
                            <input
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:border-transparent ${
                                    getInputBorderClass(formData.email, errors.email)
                                }`}
                                type="email"
                                placeholder="correo@ejemplo.com"
                                required
                            />
                        </div>
                        <ValidationMessage message={errors.email} isValid={!errors.email} />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-semibold mb-2">
                            Contraseña
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaLock className="text-gray-400" />
                            </div>
                            <input
                                name="password"
                                value={formData.password}
                                onChange={handleInputChange}
                                className={`pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:border-transparent ${
                                    getInputBorderClass(formData.password, errors.password)
                                }`}
                                type={showPassword ? "text" : "password"}
                                placeholder="Contraseña (8-12 caracteres)"
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
                        <ValidationMessage message={errors.password} isValid={!errors.password} />
                    </div>

                    {showRegister && (
                        <div className="mb-6">
                            <label className="block text-gray-700 text-sm font-semibold mb-2">
                                Confirmar contraseña
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <FaLock className="text-gray-400" />
                                </div>
                                <input
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                    className={`pl-10 appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:border-transparent ${
                                        getInputBorderClass(formData.confirmPassword, errors.confirmPassword)
                                    }`}
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="Confirmar contraseña"
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
                            <ValidationMessage message={errors.confirmPassword} isValid={!errors.confirmPassword} />
                        </div>
                    )}

                    <div className="mt-8">
                        <button
                            type="submit"
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
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
                                type="button"
                                className="text-blue-600 hover:text-blue-800 font-semibold focus:outline-none"
                                onClick={() => setShowRegister(true)}
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