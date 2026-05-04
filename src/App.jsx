import { useState, useRef } from "react";

// ── Design tokens ────────────────────────────────────────────────
const T = {
  purple:      "#6D28D9",
  purpleDark:  "#4C1D95",
  purpleLight: "#EDE9FE",
  purpleMid:   "#8B5CF6",
  orange:      "#EA580C",
  orangeLight: "#FFF7ED",
  green:       "#059669",
  greenLight:  "#ECFDF5",
  slate:       "#475569",
  slateLight:  "#F8FAFC",
  mid:         "#E2E8F0",
  black:       "#0F172A",
  white:       "#FFFFFF",
  red:         "#DC2626",
  redLight:    "#FEF2F2",
};

// ── Platform definitions ─────────────────────────────────────────
const PLATFORMS = [
  {
    id: "ocp", label: "OpenShift", color: "#333333",
    logo: (
      <svg viewBox="0 0 40 40" width="30" height="30" fill="none">
        <circle cx="20" cy="20" r="17" stroke="#333" strokeWidth="2" fill="none"/>
        <path d="M20 10C14.5 10 10 14.5 10 20s4.5 10 10 10 10-4.5 10-10S25.5 10 20 10zm0 17.5c-4.1 0-7.5-3.4-7.5-7.5s3.4-7.5 7.5-7.5 7.5 3.4 7.5 7.5-3.4 7.5-7.5 7.5z" fill="#333"/>
        <path d="M23.8 15.2l-1.6.6a3.8 3.8 0 00-5.4 1.2l-1.7.6a5.7 5.7 0 0110.4 1.1l-1.7.6a3.8 3.8 0 00-2-4.1zM16.2 24.8l1.6-.6a3.8 3.8 0 005.4-1.2l1.7-.6a5.7 5.7 0 01-10.4-1.1l1.7-.6a3.8 3.8 0 002 4.1z" fill="#333"/>
      </svg>
    ),
  },
  {
    id: "k8s", label: "Kubernetes", color: "#333333",
    logo: (
      <svg viewBox="0 0 40 40" width="30" height="30" fill="none">
        {/* Outer ring */}
        <circle cx="20" cy="20" r="17" stroke="#333" strokeWidth="2" fill="none"/>
        {/* Hub */}
        <circle cx="20" cy="20" r="3.5" stroke="#333" strokeWidth="2" fill="none"/>
        {/* 8 spokes with handle grips */}
        {[0,45,90,135,180,225,270,315].map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const x1 = 20 + 3.5 * Math.cos(rad);
          const y1 = 20 + 3.5 * Math.sin(rad);
          const x2 = 20 + 10.5 * Math.cos(rad);
          const y2 = 20 + 10.5 * Math.sin(rad);
          const xg = 20 + 13 * Math.cos(rad);
          const yg = 20 + 13 * Math.sin(rad);
          return (
            <g key={i}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#333" strokeWidth="1.8" strokeLinecap="round"/>
              <circle cx={xg} cy={yg} r="2.2" fill="#333"/>
            </g>
          );
        })}
      </svg>
    ),
  },
  {
    id: "gcp", label: "GCP", color: "#333333",
    logo: (
      <svg viewBox="0 0 40 40" width="30" height="30" fill="none">
        {/* Cloud shape */}
        <path d="M28 26H13a5 5 0 01-1-9.9A7 7 0 0126 19a4 4 0 012 7z"
          stroke="#333" strokeWidth="2" fill="none" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

const FREQUENCIES = ["Diario", "Varias veces/semana", "Semanal", "Ocasional"];

// ── Resources with descriptions and examples ─────────────────────
const RESOURCE_GROUPS = [
  {
    group: "Namespace y proyecto",
    items: [
      { name: "Namespace", desc: "Unidad lógica de aislamiento dentro del clúster. Agrupa todos los recursos de un proyecto: nombre, etiquetas y anotaciones que lo identifican.", example: "namespace: proyecto-backend-telcel, labels: team=plataforma, env=dev" },
      { name: "Cuotas CPU / Memoria", desc: "Límites de consumo de cómputo asignados al namespace. Definen cuánto CPU y memoria puede usar el proyecto en total.", example: "limits.cpu=4, limits.memory=8Gi, requests.cpu=500m, requests.memory=2Gi" },
      { name: "Limit Ranges", desc: "Restricciones mínimas y máximas de recursos por cada pod o contenedor individual dentro del namespace, para evitar consumo descontrolado.", example: "max cpu por pod: 2 cores, min memoria por contenedor: 128Mi, default request: 250m CPU" },
      { name: "Resource Quotas", desc: "Tope máximo de objetos que puede contener el namespace en total.", example: "máximo 20 pods, 10 servicios, 5 PVCs, 30 ConfigMaps dentro del namespace" },
    ],
  },
  {
    group: "Identidad y acceso",
    items: [
      { name: "Usuarios / Grupos", desc: "Identidades que tendrán acceso al namespace. Pueden venir del Directorio Activo y se asignan a grupos del proyecto para controlar quién puede operar qué.", example: "grupo AD: dev-backend-telcel → acceso edit al namespace proyecto-backend" },
      { name: "Rolebindings", desc: "Vinculación entre un usuario o grupo y un rol dentro del namespace. Define el nivel de acceso sobre los recursos del proyecto.", example: "usuario: jperez → rol: admin | grupo: devs-frontend → rol: edit | auditores → rol: view" },
      { name: "Service Accounts", desc: "Identidad técnica usada por aplicaciones o pipelines para autenticarse contra el clúster o el registry, sin depender de credenciales de usuario.", example: "sa: pipeline-ci-telcel con permisos de pull sobre registry interno y deploy en namespace" },
      { name: "RBAC policies", desc: "Reglas de control de acceso basado en roles que determinan qué operaciones puede realizar cada identidad sobre recursos específicos del clúster.", example: "ClusterRole: solo lectura de pods y logs | Role: crear y eliminar deployments en namespace propio" },
    ],
  },
  {
    group: "Red",
    items: [
      { name: "Network Policies", desc: "Reglas que controlan el tráfico de red entre namespaces y hacia el exterior. Determinan qué puede comunicarse con qué dentro y fuera del clúster.", example: "permitir tráfico solo desde namespace frontend → backend, bloquear todo egress excepto BD corporativa" },
      { name: "Gateway de salida", desc: "Configuración de la IP de salida del namespace hacia servicios externos o redes corporativas. Permite rutas controladas hacia fuera del clúster.", example: "IP de egress fija: 10.20.5.100 con ruta hacia red corporativa 192.168.0.0/16" },
      { name: "Ingress / Routes", desc: "Punto de entrada externo al namespace. Expone servicios internos mediante una URL, con soporte de TLS y balanceo de carga.", example: "Route: api.interno.telcel.com → servicio backend puerto 8080, TLS terminado en el router" },
      { name: "DNS interno", desc: "Nombre de dominio interno para que los servicios del proyecto sean resolvibles dentro del clúster sin necesidad de IPs fijas.", example: "servicio: backend-svc.proyecto-backend.svc.cluster.local resolvible desde cualquier namespace autorizado" },
    ],
  },
  {
    group: "Configuración y seguridad",
    items: [
      { name: "Secrets base", desc: "Objetos que almacenan información sensible del proyecto que los contenedores necesitan para funcionar, cifrada en etcd.", example: "SECRET_DB_PASSWORD, TOKEN_REGISTRY, CERT_TLS_KEY inyectados como variables de entorno al pod" },
      { name: "ConfigMaps base", desc: "Almacenamiento de configuración no sensible del aplicativo: parámetros, rutas y variables que se inyectan en los pods sin necesidad de recompilar la imagen.", example: "APP_ENV=production, DB_HOST=bd.telcel.internal, LOG_LEVEL=info, TIMEOUT=30s" },
      { name: "Imágenes de aplicación", desc: "Imagen de contenedor base aprobada por el equipo de plataforma, con su versión y el registro desde el que se permite hacer pull.", example: "quay.io/telcel/base-java:17-approved, quay.io/telcel/base-node:20-lts, versión fija no latest" },
      { name: "Registry / Quay", desc: "Permisos de acceso al registro de imágenes del equipo. Controla qué service accounts o usuarios pueden hacer pull o push sobre repositorios específicos.", example: "sa: pipeline-ci → push a quay.io/telcel/proyecto-backend | pods del namespace → solo pull" },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 8);

const emptyCase = () => ({
  id: uid(),
  name: "",
  platform: "",
  platformOther: "",
  frequency: "",
  frequencyOther: "",
  resources: [],
  resourceNotes: {},
  resourceNote: "",
  version: "",
  restrictions: "",
  notes: "",
});

// ── Markdown export ──────────────────────────────────────────────
const toMarkdown = (cases, poc) => {
  const date = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const platLabel = (id, other) => {
    if (id === "other") return other || "Otra";
    return PLATFORMS.find(p => p.id === id)?.label || id;
  };

  let md = `# Sesión de trabajo — Constructor de casos de despliegue\n`;
  md += `**Fecha:** ${date}  \n`;
  md += `**Cliente:** Telcel · Equipo de Infraestructura / Plataforma\n\n`;
  md += `---\n\n`;

  if (poc) {
    md += `## ✅ Caso de uso del POC\n\n`;
    md += `**${poc.name || "Sin nombre"}**\n\n`;
    md += `| Campo | Detalle |\n|---|---|\n`;
    md += `| Plataforma | ${platLabel(poc.platform, poc.platformOther)} ${poc.version ? `v${poc.version}` : ""} |\n`;
    md += `| Frecuencia | ${poc.frequency === "Otra" ? poc.frequencyOther : poc.frequency} |\n`;
    md += `| Recursos | ${poc.resources.join(", ")}${poc.resourceNote ? `, ${poc.resourceNote}` : ""} |\n`;
    md += `| Restricciones | ${poc.restrictions || "Sin restricciones identificadas"} |\n`;
    md += `| Ambiente | No productivo · confirmado |\n\n`;
    if (poc.resourceNotes && Object.keys(poc.resourceNotes).length > 0) {
      md += `**Notas por recurso:**\n\n`;
      Object.entries(poc.resourceNotes).forEach(([res, note]) => {
        if (note) md += `- **${res}:** ${note}\n`;
      });
      md += `\n`;
    }
    md += `**Resultado esperado:** Al finalizar el POC, el equipo podrá aprovisionar "${poc.name}" en ${platLabel(poc.platform, poc.platformOther)} en menos de 15 minutos, sin intervención manual y con configuración estandarizada y repetible.\n\n`;
    if (poc.notes) md += `**Notas:** ${poc.notes}\n\n`;
    md += `---\n\n`;
  }

  md += `## 📋 Inventario completo de casos\n\n`;
  cases.forEach((c, i) => {
    md += `### Caso ${i + 1}: ${c.name || "Sin nombre"}\n\n`;
    md += `| Campo | Detalle |\n|---|---|\n`;
    md += `| Plataforma | ${platLabel(c.platform, c.platformOther)} ${c.version ? `v${c.version}` : ""} |\n`;
    md += `| Frecuencia | ${c.frequency === "Otra" ? c.frequencyOther : c.frequency} |\n`;
    md += `| Recursos | ${c.resources.join(", ")}${c.resourceNote ? `, ${c.resourceNote}` : ""} |\n`;
    md += `| Restricciones | ${c.restrictions || "—"} |\n`;
    if (c.notes) md += `| Notas | ${c.notes} |\n`;
    if (c.resourceNotes && Object.keys(c.resourceNotes).length > 0) {
      md += `\n**Notas por recurso:**\n`;
      Object.entries(c.resourceNotes).forEach(([res, note]) => {
        if (note) md += `- **${res}:** ${note}\n`;
      });
    }
    md += `\n`;
  });

  md += `---\n\n`;
  md += `## 📅 Siguiente paso\n\n`;
  md += `Presentación de propuesta formal · Semana del 12 de mayo\n`;

  return md;
};

const downloadMd = (cases, poc) => {
  const content = toMarkdown(cases, poc);
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `telcel-poc-${new Date().toISOString().slice(0, 10)}.md`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Micro components ─────────────────────────────────────────────
function Tag({ label, color = T.purple }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 600,
      background: color + "18", color, border: `1px solid ${color}44`,
    }}>{label}</span>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, letterSpacing: 2,
      textTransform: "uppercase", color: T.slate, marginBottom: 8,
    }}>{children}</div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <SectionLabel>{label}</SectionLabel>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, multiline }) {
  const shared = {
    width: "100%", borderRadius: 8, border: `1.5px solid ${T.mid}`,
    padding: "9px 12px", fontSize: 13, fontFamily: "inherit",
    color: T.black, boxSizing: "border-box", background: T.white,
    outline: "none", resize: "none",
  };
  return multiline
    ? <textarea value={value} onChange={onChange} placeholder={placeholder} rows={2} style={shared} />
    : <input value={value} onChange={onChange} placeholder={placeholder} style={shared} />;
}

// ── Case Card ────────────────────────────────────────────────────
function CaseCard({ c, onEdit, onDelete, priority }) {
  const plat = c.platform === "other"
    ? { label: c.platformOther || "Otra", color: T.slate, logo: <span style={{ fontSize: 22 }}>○</span> }
    : PLATFORMS.find(p => p.id === c.platform);
  const color = plat?.color || T.slate;
  const freqLabel = c.frequency === "Otra" ? c.frequencyOther : c.frequency;

  return (
    <div style={{
      background: T.white, borderRadius: 14,
      border: `2px solid ${color}`,
      padding: "16px", position: "relative",
      boxShadow: "0 2px 8px #0000000a",
    }}>
      {priority && (
        <div style={{
          position: "absolute", top: -10, right: 12,
          background: T.green, color: T.white,
          fontSize: 10, fontWeight: 800, padding: "2px 10px",
          borderRadius: 99, letterSpacing: 1,
        }}>★ PRIORITARIO</div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, paddingRight: 8 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: T.black, lineHeight: 1.3 }}>{c.name || "Sin nombre"}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 5 }}>
            {plat?.logo}
            <span style={{ fontSize: 12, fontWeight: 700, color }}>{plat?.label}</span>
            {c.version && <span style={{ fontSize: 11, color: T.slate }}>v{c.version}</span>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
          <button onClick={onEdit} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.mid}`, background: T.white, cursor: "pointer", color: T.slate, fontFamily: "inherit" }}>Editar</button>
          <button onClick={onDelete} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: `1px solid #FCA5A5`, background: T.redLight, cursor: "pointer", color: T.red, fontFamily: "inherit" }}>×</button>
        </div>
      </div>
      {freqLabel && <Tag label={freqLabel} color={T.slate} />}
      <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
        {c.resources.slice(0, 5).map(r => <Tag key={r} label={r} color={color} />)}
        {c.resources.length > 5 && <Tag label={`+${c.resources.length - 5} más`} color={T.slate} />}
      </div>
      {c.restrictions && (
        <div style={{ marginTop: 8, fontSize: 11, color: T.orange }}>⚠ {c.restrictions}</div>
      )}
    </div>
  );
}

// ── Case Editor ──────────────────────────────────────────────────
function CaseEditor({ draft, setDraft, onSave, onCancel }) {
  const toggleResource = (r) => setDraft(d => ({
    ...d,
    resources: d.resources.includes(r) ? d.resources.filter(x => x !== r) : [...d.resources, r],
  }));
  const canSave = draft.name.trim() && draft.platform;

  return (
    <div style={{
      background: T.white, borderRadius: 16,
      border: `2px solid ${T.purple}`,
      padding: "20px 20px",
      boxShadow: "0 8px 32px #6D28D922",
      animation: "slideIn 0.25s ease",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.black }}>Nuevo caso de despliegue</div>
        <button onClick={onCancel} style={{ fontSize: 20, background: "none", border: "none", cursor: "pointer", color: T.slate }}>×</button>
      </div>

      {/* Nombre */}
      <Field label="Nombre del caso">
        <TextInput value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} placeholder="Ej: Namespace para app de backend en OpenShift" />
      </Field>

      {/* Plataforma */}
      <Field label="Plataforma">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8, marginBottom: 8 }}>
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setDraft(d => ({ ...d, platform: p.id }))} style={{
              padding: "12px 8px", borderRadius: 10,
              border: `2px solid ${draft.platform === p.id ? p.color : T.mid}`,
              background: draft.platform === p.id ? p.color + "12" : T.white,
              cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "all 0.15s",
            }}>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 4 }}>{p.logo}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: draft.platform === p.id ? p.color : T.slate }}>{p.label}</div>
            </button>
          ))}
          <button onClick={() => setDraft(d => ({ ...d, platform: "other" }))} style={{
            padding: "12px 8px", borderRadius: 10,
            border: `2px solid ${draft.platform === "other" ? T.slate : T.mid}`,
            background: draft.platform === "other" ? T.slateLight : T.white,
            cursor: "pointer", fontFamily: "inherit", textAlign: "center", transition: "all 0.15s",
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>○</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.slate }}>Otra</div>
          </button>
        </div>
        {draft.platform === "other" && (
          <TextInput value={draft.platformOther} onChange={e => setDraft(d => ({ ...d, platformOther: e.target.value }))} placeholder="Especifica la plataforma..." />
        )}
      </Field>

      {/* Versión */}
      <Field label="Versión">
        <TextInput value={draft.version} onChange={e => setDraft(d => ({ ...d, version: e.target.value }))} placeholder="Ej: OpenShift 4.14 / Kubernetes 1.28 / GKE 1.29" />
      </Field>

      {/* Frecuencia */}
      <Field label="Frecuencia de solicitudes">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
          {FREQUENCIES.map(f => (
            <button key={f} onClick={() => setDraft(d => ({ ...d, frequency: f }))} style={{
              padding: "7px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
              border: `1.5px solid ${draft.frequency === f ? T.purple : T.mid}`,
              background: draft.frequency === f ? T.purpleLight : T.white,
              color: draft.frequency === f ? T.purple : T.slate,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}>{f}</button>
          ))}
          <button onClick={() => setDraft(d => ({ ...d, frequency: "Otra" }))} style={{
            padding: "7px 14px", borderRadius: 99, fontSize: 12, fontWeight: 600,
            border: `1.5px solid ${draft.frequency === "Otra" ? T.purple : T.mid}`,
            background: draft.frequency === "Otra" ? T.purpleLight : T.white,
            color: draft.frequency === "Otra" ? T.purple : T.slate,
            cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          }}>Otra</button>
        </div>
        {draft.frequency === "Otra" && (
          <TextInput value={draft.frequencyOther} onChange={e => setDraft(d => ({ ...d, frequencyOther: e.target.value }))} placeholder="Ej: 2 veces al mes, cada 3 días..." />
        )}
      </Field>

      {/* Recursos */}
      <Field label="Recursos que incluye este despliegue">
        {RESOURCE_GROUPS.map(g => (
          <div key={g.group} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, marginBottom: 8 }}>{g.group}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {g.items.map(r => {
                const selected = draft.resources.includes(r.name);
                return (
                  <div key={r.name} style={{
                    borderRadius: 10,
                    border: `1.5px solid ${selected ? T.purple : T.mid}`,
                    background: selected ? T.purpleLight : T.white,
                    transition: "all 0.15s", overflow: "hidden",
                  }}>
                    <div onClick={() => toggleResource(r.name)} style={{ padding: "10px 12px", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                          border: `2px solid ${selected ? T.purple : T.mid}`,
                          background: selected ? T.purple : T.white,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          transition: "all 0.15s",
                        }}>
                          {selected && <span style={{ color: T.white, fontSize: 11, lineHeight: 1 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: selected ? T.purple : T.black }}>{r.name}</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.slate, marginTop: 4, marginLeft: 28, lineHeight: 1.5 }}>{r.desc}</div>
                      <div style={{ fontSize: 10, color: T.purple, marginTop: 4, marginLeft: 28, lineHeight: 1.4, fontStyle: "italic", background: "#DDD6FE", borderRadius: 4, padding: "3px 8px", display: "inline-block" }}>Ej: {r.example}</div>
                    </div>
                    {selected && (
                      <div onClick={e => e.stopPropagation()} style={{ padding: "0 12px 10px 12px", borderTop: `1px solid ${T.purpleMid}22` }}>
                        <textarea
                          value={(draft.resourceNotes || {})[r.name] || ""}
                          onChange={e => setDraft(d => ({ ...d, resourceNotes: { ...(d.resourceNotes || {}), [r.name]: e.target.value } }))}
                          placeholder={`Nota sobre ${r.name}... (restricciones, configuraciones específicas, acuerdos)`}
                          rows={2}
                          style={{
                            width: "100%", borderRadius: 6, border: `1px solid ${T.purpleMid}44`,
                            padding: "7px 10px", fontSize: 12, fontFamily: "inherit",
                            color: T.black, boxSizing: "border-box", background: T.white,
                            outline: "none", resize: "none", marginTop: 8,
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <div style={{ marginTop: 8 }}>
          <TextInput value={draft.resourceNote} onChange={e => setDraft(d => ({ ...d, resourceNote: e.target.value }))} placeholder="¿Algo que no está en la lista? Agréguenlo aquí..." />
        </div>
      </Field>

      {/* Restricciones */}
      <Field label="Restricciones técnicas o de seguridad">
        <TextInput value={draft.restrictions} onChange={e => setDraft(d => ({ ...d, restrictions: e.target.value }))} placeholder="Ej: sin acceso a internet, certificados internos, compliance PCI..." multiline />
      </Field>

      {/* Notas */}
      <Field label="Notas adicionales">
        <TextInput value={draft.notes} onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))} placeholder="Cualquier detalle relevante del equipo..." multiline />
      </Field>

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <button onClick={onCancel} style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1.5px solid ${T.mid}`, background: T.white, color: T.slate, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>Cancelar</button>
        <button onClick={onSave} disabled={!canSave} style={{ flex: 2, padding: "12px", borderRadius: 10, border: "none", background: canSave ? T.purple : T.mid, color: T.white, fontSize: 14, fontWeight: 700, cursor: canSave ? "pointer" : "not-allowed", fontFamily: "inherit", transition: "background 0.2s" }}>Guardar caso →</button>
      </div>
    </div>
  );
}

// ── Prioritization ───────────────────────────────────────────────
function Prioritize({ cases, onConfirm, onBack }) {
  const [order, setOrder] = useState(cases.map(c => c.id));
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);
  const ordered = order.map(id => cases.find(c => c.id === id)).filter(Boolean);

  const handleDrop = (targetId) => {
    if (!dragging || dragging === targetId) { setDragging(null); setOver(null); return; }
    const from = order.indexOf(dragging);
    const to = order.indexOf(targetId);
    const newOrder = [...order];
    newOrder.splice(from, 1);
    newOrder.splice(to, 0, dragging);
    setOrder(newOrder);
    setDragging(null);
    setOver(null);
  };

  return (
    <div style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto" }}>
      <button onClick={onBack} style={{ fontSize: 12, color: T.slate, background: "none", border: "none", cursor: "pointer", marginBottom: 16, fontFamily: "inherit" }}>← Regresar</button>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: T.purple, textTransform: "uppercase", marginBottom: 8 }}>Priorización</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.black, marginBottom: 8 }}>¿Cuál resolvemos primero?</h2>
      <p style={{ fontSize: 13, color: T.slate, marginBottom: 24, lineHeight: 1.6 }}>Arrastren los casos del más al menos prioritario. El primero será el caso de uso del POC.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {ordered.map((c, i) => {
          const plat = c.platform === "other" ? { label: c.platformOther || "Otra", color: T.slate, logo: <span>○</span> } : PLATFORMS.find(p => p.id === c.platform);
          const color = plat?.color || T.slate;
          return (
            <div key={c.id} draggable
              onDragStart={() => setDragging(c.id)}
              onDragOver={e => { e.preventDefault(); setOver(c.id); }}
              onDrop={() => handleDrop(c.id)}
              style={{
                background: T.white, borderRadius: 12,
                border: `2px solid ${over === c.id ? T.purple : i === 0 ? color : T.mid}`,
                padding: "14px 16px", cursor: "grab",
                boxShadow: over === c.id ? `0 4px 16px ${T.purple}33` : "0 1px 4px #0001",
                transition: "all 0.15s", opacity: dragging === c.id ? 0.5 : 1,
                display: "flex", alignItems: "center", gap: 14,
              }}>
              <div style={{ width: 32, height: 32, borderRadius: 99, background: i === 0 ? color : T.slateLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: i === 0 ? 14 : 13, fontWeight: 800, color: i === 0 ? T.white : T.slate, flexShrink: 0 }}>
                {i === 0 ? "★" : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.black }}>{c.name || "Sin nombre"}</div>
                <div style={{ fontSize: 11, color: T.slate, marginTop: 2 }}>{plat?.label} {c.version && `· v${c.version}`} {(c.frequency === "Otra" ? c.frequencyOther : c.frequency) && `· ${c.frequency === "Otra" ? c.frequencyOther : c.frequency}`}</div>
              </div>
              <div style={{ fontSize: 18, color: T.mid }}>⠿</div>
            </div>
          );
        })}
      </div>
      <button onClick={() => onConfirm(ordered[0])} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: T.purple, color: T.white, fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
        Confirmar caso de uso del POC →
      </button>
    </div>
  );
}

// ── Summary ──────────────────────────────────────────────────────
function Summary({ poc, allCases, onBack, onDownload }) {
  const plat = poc.platform === "other" ? { label: poc.platformOther || "Otra", color: T.slate, logo: <span style={{ fontSize: 22 }}>○</span> } : PLATFORMS.find(p => p.id === poc.platform);
  const color = plat?.color || T.purple;
  const date = new Date().toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
  const freqLabel = poc.frequency === "Otra" ? poc.frequencyOther : poc.frequency;

  return (
    <div style={{ padding: "24px 20px", maxWidth: 560, margin: "0 auto" }}>
      <button onClick={onBack} style={{ fontSize: 12, color: T.slate, background: "none", border: "none", cursor: "pointer", marginBottom: 16, fontFamily: "inherit" }}>← Regresar</button>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: T.green, textTransform: "uppercase", marginBottom: 8 }}>Sesión completada</div>
      <h2 style={{ fontSize: 22, fontWeight: 800, color: T.black, marginBottom: 4 }}>Alcance del POC</h2>
      <p style={{ fontSize: 12, color: T.slate, marginBottom: 24 }}>{date} · Equipo de Infraestructura / Plataforma · Telcel</p>

      {/* POC */}
      <div style={{ background: T.white, borderRadius: 16, border: `2px solid ${color}`, overflow: "hidden", marginBottom: 20, boxShadow: "0 4px 20px #0000000d" }}>
        <div style={{ background: color, padding: "16px 20px" }}>
          <div style={{ fontSize: 10, color: "#ffffff99", textTransform: "uppercase", letterSpacing: 1, marginBottom: 2 }}>Caso de uso del POC</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: T.white }}>{poc.name || "Sin nombre"}</div>
          <div style={{ fontSize: 12, color: "#ffffff99", marginTop: 4 }}>
            {plat?.label} {poc.version && `· v${poc.version}`} {freqLabel && `· ${freqLabel}`}
          </div>
        </div>
        <div style={{ padding: "16px 20px" }}>
          {[
            { label: "Plataforma", value: `${plat?.label || "—"} ${poc.version ? `v${poc.version}` : ""}` },
            { label: "Recursos a gestionar", value: poc.resources.length > 0 ? poc.resources.join(", ") + (poc.resourceNote ? `, ${poc.resourceNote}` : "") : "Por definir" },
            { label: "Frecuencia actual", value: freqLabel || "Por definir" },
            { label: "Restricciones técnicas", value: poc.restrictions || "Sin restricciones identificadas" },
            { label: "Ambiente del POC", value: "No productivo · confirmado" },
          ].map((row, i, arr) => (
            <div key={i} style={{ padding: "10px 0", borderBottom: i < arr.length - 1 ? `1px solid ${T.mid}` : "none", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
              <span style={{ fontSize: 11, color: T.slate, flexShrink: 0, marginTop: 1 }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: T.black, textAlign: "right", lineHeight: 1.4 }}>{row.value}</span>
            </div>
          ))}
        </div>
        <div style={{ background: T.slateLight, padding: "14px 20px" }}>
          <div style={{ fontSize: 10, color: T.slate, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Resultado esperado</div>
          <div style={{ fontSize: 13, color: T.black, lineHeight: 1.6, fontWeight: 500 }}>
            Al finalizar el POC, el equipo podrá aprovisionar "{poc.name || "el caso definido"}" en {plat?.label || "la plataforma seleccionada"} en menos de 15 minutos, sin intervención manual y con configuración estandarizada y repetible.
          </div>
        </div>
      </div>

      {/* All cases */}
      <div style={{ background: T.slateLight, borderRadius: 12, padding: "14px 16px", marginBottom: 20 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: T.slate, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Casos inventariados en la sesión</div>
        {allCases.map((c, i) => {
          const p = c.platform === "other" ? { label: c.platformOther || "Otra", logo: <span>○</span> } : PLATFORMS.find(x => x.id === c.platform);
          return (
            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: i < allCases.length - 1 ? `1px solid ${T.mid}` : "none" }}>
              <div style={{ width: 24, display: "flex", justifyContent: "center" }}>{p?.logo}</div>
              <span style={{ fontSize: 12, color: T.black, flex: 1 }}>{c.name || "Sin nombre"}</span>
              <span style={{ fontSize: 10, color: T.slate }}>{c.resources.length} recursos</span>
              {c.id === poc.id && <Tag label="POC" color={T.green} />}
            </div>
          );
        })}
      </div>

      {/* Next step */}
      <div style={{ background: T.purpleDark, borderRadius: 14, padding: "18px 20px", textAlign: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: "#C4B5FD", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Siguiente paso</div>
        <div style={{ fontSize: 16, fontWeight: 800, color: T.white, marginBottom: 4 }}>Propuesta formal</div>
        <div style={{ fontSize: 12, color: "#DDD6FE" }}>Semana del 12 de mayo</div>
      </div>

      {/* Export */}
      <button onClick={onDownload} style={{
        width: "100%", padding: "13px", borderRadius: 12,
        border: `2px solid ${T.purple}`, background: T.purpleLight,
        color: T.purple, fontSize: 14, fontWeight: 700,
        cursor: "pointer", fontFamily: "inherit",
      }}>
        ↓ Exportar resumen como .md
      </button>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("builder");
  const [cases, setCases] = useState([]);
  const [draft, setDraft] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [poc, setPoc] = useState(null);
  const topRef = useRef(null);
  const scrollTop = () => setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 50);

  const openNew = () => { setDraft(emptyCase()); setEditingId(null); scrollTop(); };
  const openEdit = (c) => { setDraft({ ...c }); setEditingId(c.id); scrollTop(); };
  const saveDraft = () => {
    if (editingId) setCases(cs => cs.map(c => c.id === editingId ? draft : c));
    else setCases(cs => [...cs, draft]);
    setDraft(null); setEditingId(null);
  };
  const deleteCase = (id) => setCases(cs => cs.filter(c => c.id !== id));

  if (screen === "prioritize") return <Prioritize cases={cases} onBack={() => setScreen("builder")} onConfirm={c => { setPoc(c); setScreen("summary"); }} />;
  if (screen === "summary") return <Summary poc={poc} allCases={cases} onBack={() => setScreen("prioritize")} onDownload={() => downloadMd(cases, poc)} />;

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif", background: T.white, minHeight: "100vh" }}>
      <style>{`
        @keyframes slideIn { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:none; } }
        * { box-sizing: border-box; }
        .main-wrap { max-width: 900px; margin: 0 auto; padding: 0 20px 60px; }
        .grid-cases { display: grid; grid-template-columns: 1fr; gap: 12px; }
        @media(min-width: 640px) {
          .grid-cases { grid-template-columns: 1fr 1fr; }
        }
        @media(min-width: 900px) {
          .editor-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; align-items: start; }
        }
      `}</style>

      <div className="main-wrap">
        <div ref={topRef} />

        {/* Header */}
        <div style={{ padding: "24px 0 16px", borderBottom: `1px solid ${T.mid}`, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: T.purple, textTransform: "uppercase", marginBottom: 4 }}>4 de mayo · Telcel</div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: T.black, margin: 0, lineHeight: 1.2 }}>Constructor de casos</h1>
            <p style={{ fontSize: 12, color: T.slate, margin: "4px 0 0" }}>Equipo de Infraestructura / Plataforma</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: T.purple, lineHeight: 1 }}>{cases.length}</div>
            <div style={{ fontSize: 10, color: T.slate }}>casos</div>
          </div>
        </div>

        <div className="editor-layout">
          {/* Left: editor or add button */}
          <div>
            {draft ? (
              <CaseEditor draft={draft} setDraft={setDraft} onSave={saveDraft} onCancel={() => setDraft(null)} />
            ) : (
              <button onClick={openNew} style={{
                width: "100%", padding: "18px", borderRadius: 12,
                border: `2px dashed ${T.purple}`, background: T.purpleLight,
                color: T.purple, fontSize: 14, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>+ Agregar caso de despliegue</button>
            )}
          </div>

          {/* Right: cases grid + CTA */}
          <div>
            {cases.length === 0 && !draft ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: T.slate, border: `1px dashed ${T.mid}`, borderRadius: 12 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⎈</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.black, marginBottom: 6 }}>Sin casos todavía</div>
                <div style={{ fontSize: 12, lineHeight: 1.6 }}>Cuando el equipo describa un tipo de despliegue, agrégalo como caso nuevo.</div>
              </div>
            ) : (
              <>
                {cases.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <SectionLabel>Casos registrados</SectionLabel>
                    <div className="grid-cases">
                      {cases.map(c => (
                        <CaseCard key={c.id} c={c} onEdit={() => openEdit(c)} onDelete={() => deleteCase(c.id)} />
                      ))}
                    </div>
                  </div>
                )}
                {cases.length >= 2 && (
                  <button onClick={() => setScreen("prioritize")} style={{
                    width: "100%", padding: "14px", borderRadius: 12,
                    border: "none", background: T.purple,
                    color: T.white, fontSize: 14, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit", marginTop: 8,
                  }}>Priorizar casos y definir POC →</button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
