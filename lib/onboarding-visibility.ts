/**
 * La bienvenida se renderiza en el HTML del servidor para que el navegador
 * descubra su imagen durante el parseo y no espere a la hidratación (el LCP
 * estaba en ~3 s por eso). Quien ya terminó el onboarding no debe verla: este
 * script corre antes del primer pintado y marca el documento para que CSS la
 * oculte. Lee la misma clave que el store persistido de Zustand.
 */
export const ONBOARDING_STORAGE_KEY = "la-fruta-cart";

export function onboardingVisibilityScript(): string {
  return `(function () {
  try {
    var raw = localStorage.getItem(${JSON.stringify(ONBOARDING_STORAGE_KEY)});
    if (raw) {
      var state = JSON.parse(raw).state;
      if (state && state.onboardingComplete === true) {
        document.documentElement.setAttribute("data-onboarded", "true");
      }
    }
  } catch (e) {}
})();`;
}
