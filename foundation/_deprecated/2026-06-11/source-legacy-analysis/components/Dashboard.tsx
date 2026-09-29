"use client";

import React, { useEffect, useState } from 'react';

// 🧠 1. Definición de Tipos (Para que TypeScript no dé error ts(2552))
interface Hotspot {
    file: string;
    score: number;
    reason: string;
    fixPriority: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface AuditResult {
    score: number;
    trend: string;
    security: { score: number };
    architecture: { score: number };
    criticalIssues?: string[];
    hotspots: Hotspot[];
}

export default function Dashboard() {
    // 🧠 2. Estados para manejar los datos y la carga
    const [auditData, setAuditData] = useState<AuditResult | null>(null);
    const [loading, setLoading] = useState(true);

    // 🧠 3. Efecto para leer el JSON desde /public/ai-audit-result.json
    useEffect(() => {
        const fetchAudit = async () => {
            try {
                const response = await fetch('/ai-audit-result.json');
                if (response.ok) {
                    const data = await response.json();
                    setAuditData(data);
                }
            } catch (error) {
                console.error("Error cargando el reporte de IA:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAudit();
        // Recarga automática cada 30 segundos para ver actualizaciones en vivo
        const interval = setInterval(fetchAudit, 30000);
        return () => clearInterval(interval);
    }, []);

    // Estado inicial mientras carga el archivo
    if (loading) {
        return (
            <div className="p-10 bg-black min-h-screen flex items-center justify-center">
                <div className="text-[#FFD700] font-black text-2xl animate-pulse uppercase tracking-widest">
                    Iniciando Radar de Hotspots...
                </div>
            </div>
        );
    }

    // Si el archivo no existe aún en /public
    if (!auditData) {
        return (
            <div className="p-10 bg-black min-h-screen text-center">
                <div className="border border-red-500 p-6 inline-block rounded-lg">
                    <p className="text-red-500 font-bold uppercase mb-2">⚠️ Reporte no encontrado</p>
                    <p className="text-gray-400 text-sm">Ejecuta <code className="bg-[#222] px-2 py-1 text-white">npm run audit</code> en tu terminal para generar los datos.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 bg-black min-h-screen text-white font-sans selection:bg-[#FFD700] selection:text-black">

            {/* CABECERA: Score General y Tendencia */}
            <div className="mb-12 border-l-8 border-[#FFD700] pl-6 py-2">
                <h1 className="text-5xl font-black text-[#FFD700] tracking-tighter uppercase italic">
                    AI AUDIT SYSTEM
                </h1>
                <div className="flex gap-6 mt-4 items-baseline">
                    <p className="text-3xl font-bold">Score: {auditData.score}/10</p>
                    <p className="text-sm uppercase tracking-widest text-gray-500">
                        Tendencia: <span className={`font-black ${auditData.trend === 'improving' ? 'text-green-500' : 'text-[#FFD700]'}`}>
                            {auditData.trend}
                        </span>
                    </p>
                </div>
            </div>

            {/* GRID DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                <div className="p-6 border border-[#333] bg-[#0A0A0A] hover:border-[#FFD700] transition-colors group">
                    <span className="text-gray-600 block text-xs font-black uppercase tracking-widest mb-2 group-hover:text-[#FFD700]">Security Shield</span>
                    <span className="text-4xl font-black tracking-tighter">{auditData.security.score}/10</span>
                </div>
                <div className="p-6 border border-[#333] bg-[#0A0A0A] hover:border-[#FFD700] transition-colors group">
                    <span className="text-gray-600 block text-xs font-black uppercase tracking-widest mb-2 group-hover:text-[#FFD700]">Architecture Flow</span>
                    <span className="text-4xl font-black tracking-tighter">{auditData.architecture.score}/10</span>
                </div>
            </div>

            {/* 🔥 SECCIÓN DE HOTSPOTS (Tu tabla profesional integrada) */}
            {auditData.hotspots && auditData.hotspots.length > 0 && (
                <div className="mt-12">
                    <h2 className="text-2xl font-black mb-6 text-[#FFD700] uppercase tracking-tighter italic underline decoration-4 underline-offset-8">
                        Hotspots Detectados (Archivos Críticos)
                    </h2>
                    <div className="bg-[#0A0A0A] border-2 border-[#FFD700] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(255,215,0,0.05)]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#FFD700] text-black text-sm font-black uppercase tracking-widest">
                                <tr>
                                    <th className="p-4 border-b border-black">Archivo</th>
                                    <th className="p-4 border-b border-black text-center">Score</th>
                                    <th className="p-4 border-b border-black">Prioridad</th>
                                    <th className="p-4 border-b border-black">Razón</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditData.hotspots.map((hs, i) => (
                                    <tr key={i} className="border-b border-[#222] hover:bg-[#151515] transition-all group">
                                        <td className="p-4 font-mono text-sm text-[#FFD700] font-bold group-hover:pl-6 transition-all">
                                            {hs.file}
                                        </td>
                                        <td className="p-4 text-center font-black text-xl italic">{hs.score}/10</td>
                                        <td className="p-4">
                                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-lg ${hs.fixPriority === 'HIGH'
                                                    ? 'bg-red-600 text-white animate-pulse'
                                                    : hs.fixPriority === 'MEDIUM'
                                                        ? 'bg-[#FFD700] text-black'
                                                        : 'bg-green-600 text-white'
                                                }`}>
                                                {hs.fixPriority}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-400 italic">
                                            {hs.reason}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ISSUES CRÍTICOS ADICIONALES */}
            {auditData.criticalIssues && auditData.criticalIssues.length > 0 && (
                <div className="mt-16 p-6 border-2 border-red-900 bg-[#0F0000] rounded-lg">
                    <h3 className="text-red-500 font-black mb-4 uppercase text-xs tracking-widest">Alertas de Calidad Pendientes</h3>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                        {auditData.criticalIssues.map((issue, idx) => (
                            <li key={idx} className="text-gray-500 text-xs flex items-start">
                                <span className="text-red-500 mr-2">◢</span> {issue}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* FOOTER DEL DASHBOARD */}
            <div className="mt-20 text-center border-t border-[#222] pt-8 opacity-20 hover:opacity-100 transition-opacity">
                <p className="text-[10px] uppercase tracking-[0.5em] font-black">
                    GI - Gestión Integral • Professional Software Audit • 2026
                </p>
            </div>
        </div>
    );
}