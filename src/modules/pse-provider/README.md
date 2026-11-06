# FE3: Selección e Integración de Proveedor PSE/OSE

## Resumen Ejecutivo

Se ha implementado un sistema flexible de integración con múltiples proveedores PSE/OSE (Proveedores de Servicios Electrónicos / Operadores de Servicios Electrónicos) para facturación electrónica en Perú. El sistema permite cambiar dinámicamente entre proveedores según las necesidades de cada organización.

## Proveedores Evaluados

### 1. Nubefact ⭐ (Recomendado para inicio)

**Características:**
- **Costo:** $0.03 - $0.05 USD por comprobante
- **Tipo de API:** REST moderna
- **Tiempo de respuesta:** 1-3 segundos
- **Certificado digital:** No requerido (usan el suyo)

**Ventajas:**
- ✅ API REST fácil de integrar
- ✅ Excelente documentación
- ✅ Soporte técnico responsivo en español
- ✅ No requiere certificado digital propio
- ✅ Tiempo de respuesta rápido
- ✅ Ideal para startups y PYMES

**Desventajas:**
- ❌ Costo por comprobante
- ❌ Dependencia de servicio externo

**Documentación:** https://app.nubefact.com/docs/api/

---

### 2. SUNAT Directo (Opción gratuita)

**Características:**
- **Costo:** GRATIS
- **Tipo de API:** SOAP
- **Tiempo de respuesta:** 3-8 segundos
- **Certificado digital:** Requerido (costo anual ~$150-300)

**Ventajas:**
- ✅ Sin costo por comprobante
- ✅ Conexión directa a SUNAT
- ✅ Control total del proceso
- ✅ No hay intermediarios
- ✅ Ideal para alto volumen (>10,000 comprobantes/mes)

**Desventajas:**
- ❌ Requiere certificado digital (costo anual)
- ❌ API SOAP más compleja
- ❌ Mayor tiempo de implementación
- ❌ Mantenimiento de certificados
- ❌ Tiempos de respuesta más lentos

**Documentación:** https://www.sunat.gob.pe/orientacion/electronica/servicios.html

---

### 3. Solucion Factible (Alternativa económica)

**Características:**
- **Costo:** $0.02 - $0.04 USD por comprobante
- **Tipo de API:** REST
- **Tiempo de respuesta:** 2-4 segundos
- **Certificado digital:** No requerido

**Ventajas:**
- ✅ Costo competitivo
- ✅ API REST simple
- ✅ Soporta guías de remisión
- ✅ Buena documentación

**Desventajas:**
- ❌ Costo por comprobante
- ❌ Menos popular que Nubefact

**Documentación:** https://solucionfactible.com/sfe/documentacion/

---

## Comparativa Detallada

| Característica | Nubefact | SUNAT Directo | Solución Factible |
|---------------|----------|---------------|-------------------|
| Costo/comprobante | $0.03-0.05 | GRATIS | $0.02-0.04 |
| API | REST | SOAP | REST |
| Respuesta | 1-3s | 3-8s | 2-4s |
| Certificado digital | No | Sí | No |
| Facilidad integración | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ |
| Soporte facturas | Sí | Sí | Sí |
| Soporte boletas | Sí | Sí | Sí |
| Soporte notas crédito | Sí | Sí | Sí |
| Soporte notas débito | Sí | Sí | Sí |
| Documentación | Excelente | Regular | Buena |

---

## Recomendación por Escenario

### 🚀 Startup / PYME (< 1,000 comprobantes/mes)
**Recomendado: Nubefact**
- Costo mensual bajo (~$30-50)
- Implementación rápida (1-2 días)
- Sin complicaciones técnicas

### 📈 Empresa Mediana (1,000-10,000 comprobantes/mes)
**Recomendado: Nubefact o Solución Factible**
- Evaluar volumen para negociar tarifas
- Considerar migrar a SUNAT directo si supera 5,000/mes

### 🏢 Gran Empresa (> 10,000 comprobantes/mes)
**Recomendado: SUNAT Directo**
- Ahorro significativo en costos
- Inversión en certificado digital se amortiza
- Control total del proceso

---

## Arquitectura Implementada

### Estructura de Archivos

```
src/modules/pse-provider/
├── interfaces/
│   └── pse-provider.interface.ts    # Contratos e interfaces
├── providers/
│   ├── nubefact.provider.ts         # Implementación Nubefact
│   ├── sunat.provider.ts            # Implementación SUNAT
│   └── solucion-factible.provider.ts # Implementación Solución Factible
├── pse-provider.factory.ts          # Factory para gestión multi-proveedor
├── pse-provider.module.ts           # Módulo NestJS
└── README.md                        # Este archivo
```

### Patrón de Diseño

Se utilizó el patrón **Strategy** combinado con **Factory**:

```typescript
// Interfaz común que todos los proveedores deben implementar
export interface PseProvider {
  sendInvoice(invoiceData: InvoiceData): Promise<PseProviderResponse>;
  checkStatus(documentType: string, documentNumber: string): Promise<PseProviderStatus>;
  getCDR(documentType: string, documentNumber: string): Promise<string | null>;
  cancelInvoice(documentType: string, documentNumber: string, reason: string): Promise<PseProviderResponse>;
  validateCredentials(): Promise<boolean>;
  getProviderName(): string;
}
```

### Uso en el Código

```typescript
// Inyectar el factory en tu servicio
constructor(private pseProviderFactory: PseProviderFactory) {}

// Obtener proveedor por defecto
const provider = this.pseProviderFactory.getDefaultProvider();

// O obtener proveedor específico
const nubefact = this.pseProviderFactory.getProvider(ProviderType.NUBEFACT);

// Enviar comprobante
const response = await provider.sendInvoice(invoiceData);

if (response.success) {
  console.log('Ticket:', response.ticket);
  console.log('Hash:', response.hash);
  console.log('QR:', response.qrCode);
} else {
  console.error('Errores:', response.errors);
}
```

---

## Variables de Entorno

Agregar al `.env`:

```bash
# Proveedor por defecto (nubefact | sunat | solucion_factible)
PSE_DEFAULT_PROVIDER=nubefact

# Configuración Nubefact
NUBEFACT_API_KEY=tu_api_key_aqui
NUBEFACT_BASE_URL=https://nubefact.com/api/v1

# Configuración SUNAT (solo si usas SUNAT directo)
SUNAT_RUC=20123456789
SUNAT_USER=usuario_sol
SUNAT_PASSWORD=contraseña
SUNAT_CERT_PATH=/path/to/certificado.pfx
SUNAT_ENV=BETA  # o SOL para producción

# Configuración Solución Factible
SF_USERNAME=tu_usuario
SF_PASSWORD=tu_password
SF_BASE_URL=https://sigfac.sunat.gob.pe
```

---

## Próximos Pasos

1. **Seleccionar proveedor inicial** (recomendado: Nubefact)
2. **Obtener credenciales** del proveedor seleccionado
3. **Configurar variables de entorno**
4. **Realizar pruebas** en ambiente de desarrollo/beta
5. **Validar con casos reales** (facturas, boletas, notas)
6. **Implementar en producción**

---

## Consideraciones de Producción

### Para Nubefact/Solución Factible:
- [ ] Suscribirse al servicio
- [ ] Obtener API keys
- [ ] Configurar webhooks para notificaciones
- [ ] Establecer monitoreo de errores

### Para SUNAT Directo:
- [ ] Adquirir certificado digital (válido por 1 año)
- [ ] Registrar usuario SOL con clave secundario
- [ ] Implementar firma XML con librería como `node-forge`
- [ ] Configurar cliente SOAP robusto
- [ ] Implementar reintentos automáticos
- [ ] Monitorear tiempos de respuesta

---

## Soporte Técnico

- **Nubefact:** soporte@nubefact.com | https://nubefact.com/contacto
- **SUNAT:** Mesa de partes virtual | https://www.sunat.gob.pe
- **Solución Factible:** contacto@solucionfactible.com

---

## Estado de Implementación

✅ Interfaz común `PseProvider` definida  
✅ Proveedor Nubefact implementado  
✅ Proveedor SUNAT implementado  
✅ Proveedor Solución Factible implementado  
✅ Factory para gestión multi-proveedor  
✅ Módulo NestJS configurado  
⏳ Pruebas unitarias pendientes  
⏳ Integración con módulo de invoices pendiente  

---

*Documento generado como parte de la fase FE3 - Selección e integración de proveedor PSE/OSE*
