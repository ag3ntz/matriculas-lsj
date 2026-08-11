export const GAS_URL: string = import.meta.env.PUBLIC_GAS_URL;
export const RECAPTCHA_SITE_KEY: string = import.meta.env.PROD
  ? import.meta.env.PUBLIC_RECAPTCHA_SITE_KEY
  : "";
