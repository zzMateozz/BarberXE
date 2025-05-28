import { useState, useEffect } from "react";
import { Eye, EyeOff, User, Mail, Lock, Phone, AlertCircle, CheckCircle, ArrowRight, UserPlus, Scissors } from "lucide-react";
import { toast } from "react-toastify";
import { LoginService } from "../services/LoginService";
import { createUser } from "../services/ClientService";
import { useNavigate } from "react-router-dom";

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
                return;
            } else if (formData.password.length > 12) {
                setErrors(prev => ({...prev, password: "La contraseña no debe exceder 12 caracteres"}));
                return;
            }

            if (!/^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/.test(formData.password)) {
                setErrors(prev => ({...prev, password: "La contraseña contiene caracteres no permitidos"}));
                return;
            }

            let errorMessages = [];
            
            if (!/[A-Z]/.test(formData.password)) {
                errorMessages.push("al menos una letra mayúscula");
            }
            
            if (!/[0-9]/.test(formData.password)) {
                errorMessages.push("al menos un número");
            }
            
            if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
                errorMessages.push("al menos un carácter especial");
            }

            if (errorMessages.length > 0) {
                setErrors(prev => ({...prev, password: `La contraseña debe contener ${errorMessages.join(", ")}`}));
            } else {
                setErrors(prev => ({...prev, password: ""}));
            }
        } else {
            setErrors(prev => ({...prev, password: ""}));
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
            <div className={`text-xs mt-2 flex items-center transition-all duration-200 ${
                isValid ? "text-green-500" : "text-red-400"
            }`}>
                {isValid ? (
                    <CheckCircle className="w-3 h-3 mr-1.5 flex-shrink-0" />
                ) : (
                    <AlertCircle className="w-3 h-3 mr-1.5 flex-shrink-0" />
                )}
                <span className="leading-tight">{message}</span>
            </div>
        );
    };

    const getInputBorderClass = (value, error) => {
        if (!value) return "border-gray-200 focus:border-red-500";
        return error
            ? "border-red-400 focus:border-red-500 bg-red-50"
            : "border-green-400 focus:border-green-500 bg-green-50";
    };

    return (
        <div className="min-h-screen bg-white relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-20 h-20 text-red-500">
                    <Scissors className="w-full h-full rotate-45" />
                </div>
                <div className="absolute top-32 right-20 w-16 h-16 text-red-500">
                    <Scissors className="w-full h-full -rotate-12" />
                </div>
                <div className="absolute bottom-20 left-20 w-24 h-24 text-red-500">
                    <Scissors className="w-full h-full rotate-12" />
                </div>
                <div className="absolute bottom-40 right-10 w-18 h-18 text-red-500">
                    <Scissors className="w-full h-full rotate-45" />
                </div>
            </div>
            
            {/* Geometric Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-80 h-80 bg-red-100 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gray-100 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-red-50 rounded-full blur-2xl"></div>
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="relative">
                            <div className="w-24 h-24 bg-gradient-to-br from-red-600 via-red-500 to-red-700 rounded-full mx-auto mb-6 flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all duration-300 border-4 border-white/20">
                                {showRegister ? (
                                    <UserPlus className="w-12 h-12 text-white" />
                                ) : (
                                    <Scissors className="w-12 h-12 text-white" />
                                )}
                                {/* Glow effect */}
                                <div className="absolute inset-0 bg-red-500/30 rounded-full blur-xl animate-pulse"></div>
                            </div>
                        </div>
                        
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-gray-700 to-gray-600 bg-clip-text text-transparent mb-3">
                            {showRegister ? "Únete a BarberXE" : "BarberXE"}
                        </h1>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {showRegister 
                                ? "Crea tu cuenta y accede a los mejores servicios de barbería" 
                                : "La experiencia de barbería más exclusiva te espera"
                            }
                        </p>
                    </div>

                    {/* Main Card */}
                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-3xl shadow-2xl p-8 relative overflow-hidden">
                        {/* Card Background Effects */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-transparent to-gray-50 rounded-3xl"></div>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-red-500 to-red-700"></div>
                        
                        <div className="relative z-10">
                            {/* Toggle Buttons */}
                            <div className="flex mb-8 bg-gray-100 rounded-2xl p-1.5 relative overflow-hidden border border-gray-200">
                                <div 
                                    className={`absolute top-1.5 bottom-1.5 bg-gradient-to-r from-red-600 to-red-700 rounded-xl transition-all duration-500 shadow-lg ${
                                        showRegister ? 'left-1/2 right-1.5' : 'left-1.5 right-1/2'
                                    }`}
                                ></div>
                                
                                <button
                                    className={`flex-1 py-4 px-6 rounded-xl font-bold text-sm transition-all duration-300 relative z-10 ${
                                        !showRegister
                                            ? "text-white shadow-lg"
                                            : "text-gray-600 hover:text-gray-800"
                                    }`}
                                    onClick={() => setShowRegister(false)}
                                >
                                    Iniciar Sesión
                                </button>
                                <button
                                    className={`flex-1 py-4 px-6 rounded-xl font-bold text-sm transition-all duration-300 relative z-10 ${
                                        showRegister
                                            ? "text-white shadow-lg"
                                            : "text-gray-600 hover:text-gray-800"
                                    }`}
                                    onClick={() => setShowRegister(true)}
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
                                                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors z-10" />
                                                    <input
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 ${getInputBorderClass(formData.name, errors.name)}`}
                                                        type="text"
                                                        placeholder="Tu nombre"
                                                        minLength={3}
                                                        maxLength={30}
                                                    />
                                                </div>
                                                <ValidationMessage message={errors.name} isValid={!errors.name} />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="block text-gray-700 text-sm font-semibold">
                                                    Apellido
                                                </label>
                                                <div className="relative group">
                                                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors z-10" />
                                                    <input
                                                        name="lastName"
                                                        value={formData.lastName}
                                                        onChange={handleInputChange}
                                                        className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 ${getInputBorderClass(formData.lastName, errors.lastName)}`}
                                                        type="text"
                                                        placeholder="Tu apellido"
                                                        minLength={3}
                                                        maxLength={30}
                                                    />
                                                </div>
                                                <ValidationMessage message={errors.lastName} isValid={!errors.lastName} />
                                            </div>
                                        </div>

                                        {/* Teléfono */}
                                        <div className="space-y-2">
                                            <label className="block text-gray-700 text-sm font-semibold">
                                                Número de Teléfono
                                            </label>
                                            <div className="relative group">
                                                <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors z-10" />
                                                <input
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 ${getInputBorderClass(formData.phone, errors.phone)}`}
                                                    type="tel"
                                                    placeholder="1234567890"
                                                    minLength={7}
                                                    maxLength={10}
                                                />
                                            </div>
                                            <ValidationMessage message={errors.phone} isValid={!errors.phone} />
                                        </div>
                                    </>
                                )}

                                {/* Email */}
                                <div className="space-y-2">
                                    <label className="block text-gray-700 text-sm font-semibold">
                                        Correo Electrónico
                                    </label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors z-10" />
                                        <input
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            className={`w-full pl-12 pr-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 ${getInputBorderClass(formData.email, errors.email)}`}
                                            type="email"
                                            placeholder="tu@email.com"
                                            maxLength={100}
                                        />
                                    </div>
                                    <ValidationMessage message={errors.email} isValid={!errors.email} />
                                </div>

                                {/* Contraseña */}
                                <div className="space-y-2">
                                    <label className="block text-gray-700 text-sm font-semibold">
                                        Contraseña
                                    </label>
                                    <div className="relative group">
                                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors z-10" />
                                        <input
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            className={`w-full pl-12 pr-14 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 ${getInputBorderClass(formData.password, errors.password)}`}
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Contraseña segura"
                                            minLength={8}
                                            maxLength={12}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-200 z-10"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    <ValidationMessage message={errors.password} isValid={!errors.password} />
                                </div>

                                {/* Confirmar Contraseña */}
                                {showRegister && (
                                    <div className="space-y-2">
                                        <label className="block text-gray-700 text-sm font-semibold">
                                            Confirmar Contraseña
                                        </label>
                                        <div className="relative group">
                                            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-red-500 transition-colors z-10" />
                                            <input
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                className={`w-full pl-12 pr-14 py-4 border-2 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/20 transition-all duration-200 ${getInputBorderClass(formData.confirmPassword, errors.confirmPassword)}`}
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Repite tu contraseña"
                                                minLength={8}
                                                maxLength={12}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors duration-200 z-10"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                            </button>
                                        </div>
                                        <ValidationMessage message={errors.confirmPassword} isValid={!errors.confirmPassword} />
                                    </div>
                                )}

                                {/* Submit Button */}
                                <div className="pt-6">
                                    <button
                                        onClick={handleSubmit}
                                        className="group relative w-full bg-gradient-to-r from-red-600 via-red-500 to-red-700 hover:from-red-700 hover:via-red-600 hover:to-red-800 text-white font-bold py-4 px-6 rounded-xl focus:outline-none focus:ring-4 focus:ring-red-500/40 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-2xl hover:shadow-red-500/25 border border-red-500/20 overflow-hidden"
                                    >
                                        {/* Button glow effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-red-700/20 blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                                        
                                        <div className="relative flex items-center justify-center space-x-3">
                                            <span className="text-lg font-bold">
                                                {showRegister ? "Crear Mi Cuenta" : "Iniciar Sesión"}
                                            </span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Footer Links */}
                            <div className="mt-8 text-center">
                                {!showRegister ? (
                                    <p className="text-gray-600 text-sm">
                                        ¿Nuevo en BarberXE?{" "}
                                        <button
                                            onClick={() => setShowRegister(true)}
                                            className="text-red-600 hover:text-red-500 font-semibold focus:outline-none transition-colors duration-200 underline decoration-2 underline-offset-2 decoration-red-400/50"
                                        >
                                            Créa tu cuenta
                                        </button>
                                    </p>
                                ) : (
                                    <p className="text-gray-600 text-sm">
                                        ¿Ya eres miembro?{" "}
                                        <button
                                            onClick={() => setShowRegister(false)}
                                            className="text-red-600 hover:text-red-500 font-semibold focus:outline-none transition-colors duration-200 underline decoration-2 underline-offset-2 decoration-red-400/50"
                                        >
                                            Inicia sesión
                                        </button>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Text */}
                    <div className="text-center mt-6">
                        <p className="text-gray-500 text-xs leading-relaxed">
                            Al continuar, aceptas nuestros{" "}
                            <span className="text-red-500 hover:text-red-600 cursor-pointer transition-colors underline decoration-1 underline-offset-2">
                                Términos de Servicio
                            </span>{" "}
                            y{" "}
                            <span className="text-red-500 hover:text-red-600 cursor-pointer transition-colors underline decoration-1 underline-offset-2">
                                Política de Privacidad
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;