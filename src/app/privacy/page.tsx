"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Lock, Eye, Database, Trash2, Bell } from "lucide-react";

const SECTIONS = [
    {
        icon: Database,
        title: "Datos que almacenamos",
        content: [
            "Nombre de usuario y nombre completo que proporcionas al registrarte.",
            "Tus transacciones financieras: montos, fechas, descripciones y categorías.",
            "Saldos de tus cuentas vinculadas dentro de la app.",
            "Preferencias de la aplicación (tema, idioma, configuración).",
        ],
    },
    {
        icon: Lock,
        title: "Cómo protegemos tu información",
        content: [
            "Tu PIN nunca se almacena en texto plano — se convierte en un hash criptográfico (SHA-256) antes de guardarse.",
            "La autenticación biométrica (Face ID / Huella) usa las APIs nativas del dispositivo; las credenciales biométricas no salen de tu dispositivo.",
            "Toda la comunicación con nuestra base de datos usa HTTPS/TLS.",
            "Los datos en Supabase están protegidos con Row Level Security (RLS): cada usuario solo puede acceder a sus propios datos.",
        ],
    },
    {
        icon: Eye,
        title: "Con quién compartimos datos",
        content: [
            "No vendemos ni compartimos tus datos personales con terceros con fines comerciales.",
            "Usamos Supabase como proveedor de base de datos en la nube. Supabase cumple con estándares SOC 2.",
            "No usamos servicios de analítica que rastreen tu comportamiento individual.",
            "Podemos compartir datos anónimos y agregados para mejorar la aplicación.",
        ],
    },
    {
        icon: Bell,
        title: "Notificaciones y acceso",
        content: [
            "La app no envía notificaciones push sin tu consentimiento explícito.",
            "Solo accedemos a la cámara o biometría cuando tú lo solicitas activamente.",
            "No accedemos a tus contactos, micrófono, ubicación ni ningún otro sensor del dispositivo.",
        ],
    },
    {
        icon: Trash2,
        title: "Tus derechos",
        content: [
            "Puedes eliminar tu cuenta y todos tus datos en cualquier momento desde la sección de perfil.",
            "Tienes derecho a exportar tus datos en formato CSV desde la sección de importar/exportar.",
            "Puedes solicitar la eliminación completa de tus datos contactándonos.",
            "Esta app es de uso personal — tú controlas completamente tu información.",
        ],
    },
];

export default function PrivacyPage() {
    const router = useRouter();
    return (
        <div className="min-h-screen bg-background px-5 py-8 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
                <button
                    onClick={() => router.back()}
                    className="w-9 h-9 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition-colors shrink-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                    <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-widest">Legal</p>
                    <h1 className="text-xl font-mono tracking-tighter uppercase font-bold">Privacidad</h1>
                </div>
            </div>

            {/* Hero */}
            <div className="paper-card rounded-2xl p-5 mb-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-foreground flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-background" />
                </div>
                <div>
                    <h2 className="font-mono font-bold text-sm uppercase tracking-tight mb-1">
                        Tus datos, tu control
                    </h2>
                    <p className="font-mono text-xs text-muted-foreground leading-relaxed">
                        Churupitos es una app de finanzas personales. Tu información financiera
                        es privada y nunca la usaremos para fines ajenos a la app.
                    </p>
                </div>
            </div>

            {/* Sections */}
            <div className="space-y-4 mb-8">
                {SECTIONS.map(({ icon: Icon, title, content }) => (
                    <div key={title} className="paper-card rounded-xl overflow-hidden">
                        <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-black/5">
                            <div className="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center shrink-0">
                                <Icon className="w-3.5 h-3.5 text-foreground" />
                            </div>
                            <h3 className="font-mono font-bold text-xs uppercase tracking-wide">{title}</h3>
                        </div>
                        <ul className="px-4 py-3 space-y-2">
                            {content.map((item, i) => (
                                <li key={i} className="flex items-start gap-2">
                                    <span className="font-mono text-[10px] text-muted-foreground mt-0.5 shrink-0">·</span>
                                    <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">{item}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="text-center space-y-1 pb-8">
                <p className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    Última actualización
                </p>
                <p className="font-mono text-xs font-bold">Marzo 2026</p>
                <p className="font-mono text-[10px] text-muted-foreground mt-3">
                    Churupitos · App de finanzas personales
                </p>
            </div>
        </div>
    );
}
