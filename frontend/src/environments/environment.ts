export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api/v1',
  /** Tiempo en minutos para cerrar sesión por inactividad (pestaña oculta) — Mecanismo 2 */
  inactivityTimeoutMinutes: 0.2,
  /** Tiempo en minutos para cerrar sesión por inactividad DENTRO de la misma pestaña — Mecanismo 3 */
  inactivityInTabTimeoutMinutes: 0.5,
};